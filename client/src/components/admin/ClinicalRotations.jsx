import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

const hospitalForm = { name: '', county: '', address: '', contactPerson: '', contactPhone: '' };
const siteForm = { hospitalId: '', name: '', department: '' };
const rotationForm = { hospitalId: '', siteId: '', title: '', department: '', startsOn: '', endsOn: '', supervisorId: '' };
const assignForm = { rotationId: '', studentIds: '', supervisorId: '', activateLogbook: true };

export default function ClinicalRotations() {
  const [dashboard, setDashboard] = useState(null);
  const [hospital, setHospital] = useState(hospitalForm);
  const [site, setSite] = useState(siteForm);
  const [rotation, setRotation] = useState(rotationForm);
  const [assignment, setAssignment] = useState(assignForm);
  const [status, setStatus] = useState('');

  async function load() {
    const data = await api('/clinical-rotations/dashboard');
    setDashboard(data);
  }

  useEffect(() => {
    load().catch((error) => setStatus(error.message));
  }, []);

  async function createHospital() {
    await api('/clinical-rotations/hospitals', { method: 'POST', body: hospital });
    setHospital(hospitalForm);
    setStatus('Hospital created.');
    await load();
  }

  async function createSite() {
    await api('/clinical-rotations/sites', { method: 'POST', body: site });
    setSite(siteForm);
    setStatus('Clinical site created.');
    await load();
  }

  async function createRotation() {
    await api('/clinical-rotations/rotations', { method: 'POST', body: rotation });
    setRotation(rotationForm);
    setStatus('Rotation created.');
    await load();
  }

  async function assignStudents() {
    await api(`/clinical-rotations/rotations/${assignment.rotationId}/assign`, {
      method: 'POST',
      body: {
        studentIds: assignment.studentIds.split(',').map((value) => value.trim()).filter(Boolean),
        supervisorId: assignment.supervisorId || null,
        activateLogbook: assignment.activateLogbook,
      },
    });
    setAssignment(assignForm);
    setStatus('Students assigned and logbook activation updated.');
    await load();
  }

  if (!dashboard) return <Loading label="Loading clinical rotation dashboard..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clinical rotations</h1>
          <div className="sub">Manage hospitals, sites, rotations, supervisors, and digital logbook activation.</div>
        </div>
      </div>

      {status && <div className="ok-note">{status}</div>}

      <div className="stats-grid">
        <div className="stat-card"><strong>{dashboard.hospitals.length}</strong><span>Hospitals</span></div>
        <div className="stat-card"><strong>{dashboard.rotations.length}</strong><span>Rotations</span></div>
        <div className="stat-card"><strong>{dashboard.assignments.length}</strong><span>Assignments</span></div>
        <div className="stat-card"><strong>{dashboard.pendingApprovals}</strong><span>Pending approvals</span></div>
      </div>

      <div className="card">
        <h2>Create hospital</h2>
        <div className="form-grid">
          <div className="field"><label>Name</label><input value={hospital.name} onChange={(event) => setHospital({ ...hospital, name: event.target.value })} /></div>
          <div className="field"><label>County</label><input value={hospital.county} onChange={(event) => setHospital({ ...hospital, county: event.target.value })} /></div>
          <div className="field"><label>Address</label><input value={hospital.address} onChange={(event) => setHospital({ ...hospital, address: event.target.value })} /></div>
          <div className="field"><label>Contact person</label><input value={hospital.contactPerson} onChange={(event) => setHospital({ ...hospital, contactPerson: event.target.value })} /></div>
          <div className="field"><label>Contact phone</label><input value={hospital.contactPhone} onChange={(event) => setHospital({ ...hospital, contactPhone: event.target.value })} /></div>
        </div>
        <button className="primary" onClick={createHospital}>Save hospital</button>
      </div>

      <div className="card">
        <h2>Create clinical site</h2>
        <div className="form-grid">
          <div className="field"><label>Hospital ID</label><input value={site.hospitalId} onChange={(event) => setSite({ ...site, hospitalId: event.target.value })} /></div>
          <div className="field"><label>Site name</label><input value={site.name} onChange={(event) => setSite({ ...site, name: event.target.value })} /></div>
          <div className="field"><label>Department</label><input value={site.department} onChange={(event) => setSite({ ...site, department: event.target.value })} /></div>
        </div>
        <button className="primary" onClick={createSite}>Save site</button>
      </div>

      <div className="card">
        <h2>Create rotation</h2>
        <div className="form-grid">
          <div className="field"><label>Hospital ID</label><input value={rotation.hospitalId} onChange={(event) => setRotation({ ...rotation, hospitalId: event.target.value })} /></div>
          <div className="field"><label>Site ID</label><input value={rotation.siteId} onChange={(event) => setRotation({ ...rotation, siteId: event.target.value })} /></div>
          <div className="field"><label>Title</label><input value={rotation.title} onChange={(event) => setRotation({ ...rotation, title: event.target.value })} /></div>
          <div className="field"><label>Department</label><input value={rotation.department} onChange={(event) => setRotation({ ...rotation, department: event.target.value })} /></div>
          <div className="field"><label>Starts on</label><input type="date" value={rotation.startsOn} onChange={(event) => setRotation({ ...rotation, startsOn: event.target.value })} /></div>
          <div className="field"><label>Ends on</label><input type="date" value={rotation.endsOn} onChange={(event) => setRotation({ ...rotation, endsOn: event.target.value })} /></div>
          <div className="field"><label>Supervisor ID</label><input value={rotation.supervisorId} onChange={(event) => setRotation({ ...rotation, supervisorId: event.target.value })} /></div>
        </div>
        <button className="primary" onClick={createRotation}>Save rotation</button>
      </div>

      <div className="card">
        <h2>Assign students and activate logbook</h2>
        <div className="form-grid">
          <div className="field"><label>Rotation ID</label><input value={assignment.rotationId} onChange={(event) => setAssignment({ ...assignment, rotationId: event.target.value })} /></div>
          <div className="field"><label>Student IDs</label><input value={assignment.studentIds} onChange={(event) => setAssignment({ ...assignment, studentIds: event.target.value })} /></div>
          <div className="field"><label>Supervisor ID</label><input value={assignment.supervisorId} onChange={(event) => setAssignment({ ...assignment, supervisorId: event.target.value })} /></div>
        </div>
        <label><input type="checkbox" checked={assignment.activateLogbook} onChange={(event) => setAssignment({ ...assignment, activateLogbook: event.target.checked })} /> Activate digital logbook access</label>
        <div><button className="primary" style={{ marginTop: 14 }} onClick={assignStudents}>Assign students</button></div>
      </div>
    </>
  );
}
