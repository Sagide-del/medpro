import { query, withTransaction } from '../config/database.js';

export const ClinicalRotation = {
  async dashboard(institutionId) {
    const [{ rows: hospitals }, { rows: rotations }, { rows: assignments }, { rows: pending }] = await Promise.all([
      query(`SELECT * FROM hospitals WHERE institution_id = $1 ORDER BY created_at DESC`, [institutionId]),
      query(
        `SELECT r.*, h.name AS hospital_name, s.name AS site_name, u.full_name AS supervisor_name
         FROM clinical_rotations r
         LEFT JOIN hospitals h ON h.hospital_id = r.hospital_id
         LEFT JOIN clinical_sites s ON s.site_id = r.site_id
         LEFT JOIN users u ON u.user_id = r.supervisor_id
         WHERE r.institution_id = $1
         ORDER BY r.created_at DESC`,
        [institutionId]
      ),
      query(
        `SELECT cra.*, r.title AS rotation_title, u.full_name AS student_name, sup.full_name AS supervisor_name
         FROM clinical_rotation_assignments cra
         JOIN clinical_rotations r ON r.rotation_id = cra.rotation_id
         JOIN users u ON u.user_id = cra.student_id
         LEFT JOIN users sup ON sup.user_id = cra.supervisor_id
         WHERE r.institution_id = $1
         ORDER BY cra.created_at DESC`,
        [institutionId]
      ),
      query(
        `SELECT COUNT(*)::int AS pending_count
         FROM clinical_activity_records car
         JOIN clinical_rotation_assignments cra ON cra.assignment_id = car.rotation_assignment_id
         JOIN clinical_rotations r ON r.rotation_id = cra.rotation_id
         WHERE r.institution_id = $1 AND car.status = 'pending'`,
        [institutionId]
      ),
    ]);

    return {
      hospitals,
      rotations,
      assignments,
      pendingApprovals: pending[0]?.pending_count || 0,
    };
  },

  async createHospital({ institutionId, name, county, address, contactPerson, contactPhone }) {
    const { rows } = await query(
      `INSERT INTO hospitals (institution_id, name, county, address, contact_person, contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [institutionId, name, county || null, address || null, contactPerson || null, contactPhone || null]
    );
    return rows[0];
  },

  async createSite({ institutionId, hospitalId, name, department }) {
    const { rows } = await query(
      `INSERT INTO clinical_sites (hospital_id, institution_id, name, department)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [hospitalId, institutionId, name, department || null]
    );
    return rows[0];
  },

  async createRotation({ institutionId, hospitalId, siteId, title, department, startsOn, endsOn, supervisorId }) {
    const { rows } = await query(
      `INSERT INTO clinical_rotations
       (institution_id, hospital_id, site_id, title, department, starts_on, ends_on, supervisor_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'scheduled')
       RETURNING *`,
      [institutionId, hospitalId || null, siteId || null, title, department || null, startsOn || null, endsOn || null, supervisorId || null]
    );
    return rows[0];
  },

  async assignStudents({ rotationId, studentIds = [], supervisorId, activateLogbook = false }) {
    return withTransaction(async (client) => {
      const created = [];
      for (const studentId of studentIds) {
        const { rows } = await client.query(
          `INSERT INTO clinical_rotation_assignments (rotation_id, student_id, supervisor_id, logbook_enabled)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (rotation_id, student_id)
           DO UPDATE SET supervisor_id = EXCLUDED.supervisor_id,
                         logbook_enabled = EXCLUDED.logbook_enabled
           RETURNING *`,
          [rotationId, studentId, supervisorId || null, activateLogbook]
        );
        created.push(rows[0]);
      }
      return created;
    });
  },

  async studentLogbook(studentId) {
    const [{ rows: assignments }, { rows: activities }] = await Promise.all([
      query(
        `SELECT cra.*, r.title AS rotation_title, r.department, r.starts_on, r.ends_on,
                h.name AS hospital_name, s.name AS site_name, sup.full_name AS supervisor_name
         FROM clinical_rotation_assignments cra
         JOIN clinical_rotations r ON r.rotation_id = cra.rotation_id
         LEFT JOIN hospitals h ON h.hospital_id = r.hospital_id
         LEFT JOIN clinical_sites s ON s.site_id = r.site_id
         LEFT JOIN users sup ON sup.user_id = COALESCE(cra.supervisor_id, r.supervisor_id)
         WHERE cra.student_id = $1
         ORDER BY r.starts_on DESC NULLS LAST, cra.created_at DESC`,
        [studentId]
      ),
      query(
        `SELECT *
         FROM clinical_activity_records
         WHERE student_id = $1
         ORDER BY activity_date DESC, created_at DESC`,
        [studentId]
      ),
    ]);

    const summary = activities.reduce((acc, row) => {
      acc.totalHours += Number(row.hours_completed || 0);
      if (row.status === 'approved') acc.approved += 1;
      if (row.status === 'pending') acc.pending += 1;
      return acc;
    }, { totalHours: 0, approved: 0, pending: 0 });

    return {
      assignments,
      activities,
      summary,
      access: {
        activated: assignments.some((assignment) => assignment.logbook_enabled),
      },
    };
  },

  async createActivity({ studentId, rotationAssignmentId, activityDate, hospital, department, activityPerformed, clinicalSkill, hoursCompleted, supervisor, comments }) {
    const { rows: assignmentRows } = await query(
      `SELECT * FROM clinical_rotation_assignments WHERE assignment_id = $1 AND student_id = $2`,
      [rotationAssignmentId, studentId]
    );
    const assignment = assignmentRows[0];
    if (!assignment || !assignment.logbook_enabled) {
      const error = new Error('Your digital logbook is locked until your institution activates rotation access.');
      error.status = 403;
      throw error;
    }

    const { rows } = await query(
      `INSERT INTO clinical_activity_records
       (rotation_assignment_id, student_id, activity_date, hospital, department, activity_performed, clinical_skill, hours_completed, supervisor, comments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        rotationAssignmentId,
        studentId,
        activityDate,
        hospital,
        department || null,
        activityPerformed,
        clinicalSkill,
        hoursCompleted || 0,
        supervisor || null,
        comments || null,
      ]
    );
    return rows[0];
  },

  async reviewQueue({ userId, institutionId, role }) {
    const params = [];
    let where = `WHERE car.status = 'pending'`;
    if (role === 'teacher') {
      params.push(userId);
      where += ` AND (cra.supervisor_id = $${params.length} OR r.supervisor_id = $${params.length})`;
    } else if (institutionId) {
      params.push(institutionId);
      where += ` AND r.institution_id = $${params.length}`;
    }

    const { rows } = await query(
      `SELECT car.*, u.full_name AS student_name, r.title AS rotation_title
       FROM clinical_activity_records car
       JOIN clinical_rotation_assignments cra ON cra.assignment_id = car.rotation_assignment_id
       JOIN clinical_rotations r ON r.rotation_id = cra.rotation_id
       JOIN users u ON u.user_id = car.student_id
       ${where}
       ORDER BY car.activity_date DESC, car.created_at DESC`,
      params
    );
    return rows;
  },

  async reviewActivity(activityId, reviewerId, { status, comments }) {
    const { rows } = await query(
      `UPDATE clinical_activity_records
       SET status = $2,
           verified_by = $3,
           verified_at = now(),
           verification_comments = $4
       WHERE activity_id = $1
       RETURNING *`,
      [activityId, status, reviewerId, comments || null]
    );
    return rows[0] || null;
  },
};
