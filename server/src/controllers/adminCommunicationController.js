import { query } from '../config/database.js';
import { asyncHandler } from '../utils/helpers.js';
import { logAdminAction } from '../middleware/audit.js';
import { sendSms } from '../services/notificationService.js';
import { sendEmail } from '../services/emailService.js';

function requireSuperAdmin(req, res) {
  if (req.user?.role !== 'super_admin') {
    res.status(403).json({ error: 'Super admin access is required.' });
    return false;
  }
  return true;
}

async function getTemplate(templateId) {
  const { rows } = await query(
    `SELECT template_id, institution_id, name, channel, event_type, subject, body, active, created_by, created_at
     FROM communication_templates
     WHERE template_id = $1`,
    [templateId]
  );
  return rows[0] || null;
}

async function resolveRecipients({
  recipientUserIds = [],
  recipientRole = null,
  institutionId = null,
  requireEmail = false,
  requirePhone = false,
}) {
  const conditions = [];
  const params = [];
  let index = 1;

  if (recipientUserIds.length) {
    conditions.push(`u.user_id = ANY($${index++}::uuid[])`);
    params.push(recipientUserIds);
  }
  if (recipientRole) {
    conditions.push(`u.role = $${index++}`);
    params.push(recipientRole);
  }
  if (institutionId) {
    conditions.push(`u.institution_id = $${index++}`);
    params.push(institutionId);
  }

  conditions.push(`u.status = 'active'`);
  if (requireEmail) conditions.push(`COALESCE(NULLIF(TRIM(u.email), ''), '') <> ''`);
  if (requirePhone) conditions.push(`COALESCE(NULLIF(TRIM(u.phone), ''), '') <> ''`);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT u.user_id, u.full_name, u.email, u.phone, u.role, u.institution_id, i.name AS institution_name
     FROM users u
     LEFT JOIN institutions i ON i.institution_id = u.institution_id
     ${where}
     ORDER BY u.full_name ASC`,
    params
  );
  return rows;
}

async function insertHistoryRecord({ institutionId, userId, eventType, channel, title, message, templateId = null, status = 'sent', providerReference = null, providerPayload = null, recipient = null }) {
  const payload = providerPayload ? JSON.stringify(providerPayload) : null;
  const { rows: historyRows } = await query(
    `INSERT INTO communication_history (institution_id, user_id, event_type, channel, title, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [institutionId || null, userId || null, eventType, channel, title, message]
  );

  await query(
    `INSERT INTO communication_delivery_logs
     (template_id, user_id, channel, event_type, recipient, status, provider_reference, provider_payload, delivered_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      templateId,
      userId || null,
      channel,
      eventType,
      recipient || null,
      status,
      providerReference,
      payload,
      status === 'failed' ? null : new Date(),
    ]
  );

  return historyRows[0];
}

function mergeTemplate(template, body = {}) {
  return {
    name: body.name || template?.name || '',
    channel: body.channel || template?.channel || 'email',
    eventType: body.eventType || template?.event_type || 'general',
    subject: body.subject ?? template?.subject ?? null,
    body: body.body || template?.body || '',
    institutionId: Object.prototype.hasOwnProperty.call(body, 'institutionId') ? body.institutionId || null : template?.institution_id || null,
    active: Object.prototype.hasOwnProperty.call(body, 'active') ? Boolean(body.active) : template?.active ?? true,
  };
}

export const listTemplates = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { rows } = await query(
    `SELECT template_id, institution_id, name, channel, event_type, subject, body, active, created_by, created_at
     FROM communication_templates
     ORDER BY created_at DESC`
  );
  res.json({ templates: rows });
});

export const createTemplate = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { name, channel, eventType, body, subject, institutionId, active = true } = mergeTemplate(null, req.body);
  if (!name || !channel || !eventType || !body) {
    return res.status(400).json({ error: 'name, channel, eventType, and body are required.' });
  }
  const { rows } = await query(
    `INSERT INTO communication_templates
     (institution_id, name, channel, event_type, subject, body, active, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING template_id, institution_id, name, channel, event_type, subject, body, active, created_by, created_at`,
    [institutionId || null, name, channel, eventType, subject || null, body, Boolean(active), req.user.sub]
  );
  logAdminAction(req.user.sub, 'manage_communication', { action: 'create_template', templateId: rows[0].template_id }, req);
  res.status(201).json({ template: rows[0] });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const existing = await getTemplate(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Template not found.' });
  const merged = mergeTemplate(existing, req.body);
  const { rows } = await query(
    `UPDATE communication_templates
     SET institution_id = $1,
         name = $2,
         channel = $3,
         event_type = $4,
         subject = $5,
         body = $6,
         active = $7
     WHERE template_id = $8
     RETURNING template_id, institution_id, name, channel, event_type, subject, body, active, created_by, created_at`,
    [merged.institutionId, merged.name, merged.channel, merged.eventType, merged.subject, merged.body, merged.active, req.params.id]
  );
  logAdminAction(req.user.sub, 'manage_communication', { action: 'update_template', templateId: req.params.id }, req);
  res.json({ template: rows[0] });
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const { rowCount } = await query(`DELETE FROM communication_templates WHERE template_id = $1`, [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Template not found.' });
  logAdminAction(req.user.sub, 'manage_communication', { action: 'delete_template', templateId: req.params.id }, req);
  res.status(204).end();
});

async function dispatchToRecipients({
  institutionId,
  eventType,
  title,
  message,
  subject,
  channel,
  recipientUserIds = [],
  recipientRole = null,
  templateId = null,
}) {
  const recipients = await resolveRecipients({
    recipientUserIds,
    recipientRole,
    institutionId,
    requireEmail: channel === 'email',
    requirePhone: channel === 'sms',
  });

  const deliveries = [];
  for (const recipient of recipients) {
    const target = channel === 'email' ? recipient.email : recipient.phone;
    let result;
    if (channel === 'email') {
      result = await sendEmail({ to: target, subject: subject || title, text: message, html: `<p>${message}</p>` });
    } else if (channel === 'sms') {
      result = await sendSms(target, message);
    } else {
      result = { status: 'simulated', recipient: target };
    }

    const historyRow = await insertHistoryRecord({
      institutionId,
      userId: recipient.user_id,
      eventType,
      channel,
      title,
      message,
      templateId,
      status: result.status,
      providerReference: result.reference || result.providerReference || null,
      providerPayload: result,
      recipient: target,
    });
    deliveries.push({ recipient: recipient.user_id, ...result, history_id: historyRow.history_id });
  }
  return deliveries;
}

export const sendEmailCampaign = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const {
    recipientUserIds = [],
    recipientRole = null,
    institutionId = null,
    templateId = null,
    subject: rawSubject,
    body: rawBody,
    title: rawTitle,
  } = req.body || {};
  const template = templateId ? await getTemplate(templateId) : null;
  const merged = mergeTemplate(template, req.body || {});
  const subject = rawSubject || merged.subject || merged.name || 'MedProHub update';
  const message = rawBody || merged.body || '';
  const title = rawTitle || merged.name || subject;
  if (!subject || !message) {
    return res.status(400).json({ error: 'subject and body are required.' });
  }
  const deliveries = await dispatchToRecipients({
    institutionId: institutionId || merged.institutionId,
    eventType: merged.eventType,
    title,
    message,
    subject,
    channel: 'email',
    recipientUserIds,
    recipientRole,
    templateId,
  });
  logAdminAction(req.user.sub, 'manage_communication', { action: 'send_email', count: deliveries.length }, req);
  res.status(201).json({ sent: deliveries.length, deliveries });
});

export const sendSmsCampaign = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const {
    recipientUserIds = [],
    recipientRole = null,
    institutionId = null,
    templateId = null,
    message: rawMessage,
    title: rawTitle,
  } = req.body || {};
  const template = templateId ? await getTemplate(templateId) : null;
  const merged = mergeTemplate(template, req.body || {});
  const message = rawMessage || merged.body || '';
  const title = rawTitle || merged.name || 'MedProHub SMS';
  if (!message) {
    return res.status(400).json({ error: 'message is required.' });
  }
  const deliveries = await dispatchToRecipients({
    institutionId: institutionId || merged.institutionId,
    eventType: merged.eventType,
    title,
    message,
    subject: title,
    channel: 'sms',
    recipientUserIds,
    recipientRole,
    templateId,
  });
  logAdminAction(req.user.sub, 'manage_communication', { action: 'send_sms', count: deliveries.length }, req);
  res.status(201).json({ sent: deliveries.length, deliveries });
});

export const listHistory = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const [history, logs, schedules] = await Promise.all([
    query(
      `SELECT h.history_id, h.institution_id, h.user_id, u.full_name, u.email, h.event_type, h.channel, h.title, h.message, h.created_at
       FROM communication_history h
       LEFT JOIN users u ON u.user_id = h.user_id
       ORDER BY h.created_at DESC
       LIMIT 100`
    ),
    query(
      `SELECT l.log_id, l.template_id, l.user_id, u.full_name, u.email, l.channel, l.event_type, l.recipient, l.status, l.provider_reference, l.created_at, l.delivered_at
       FROM communication_delivery_logs l
       LEFT JOIN users u ON u.user_id = l.user_id
       ORDER BY l.created_at DESC
       LIMIT 100`
    ),
    query(
      `SELECT schedule_id, institution_id, created_by, channel, title, subject, message, audience, scheduled_at, status, result, sent_at, created_at, updated_at
       FROM communication_schedules
       ORDER BY created_at DESC
       LIMIT 100`
    ),
  ]);
  res.json({
    history: history.rows,
    logs: logs.rows,
    schedules: schedules.rows,
  });
});

export const scheduleCommunication = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const {
    institutionId = null,
    channel = 'email',
    title,
    subject = null,
    message,
    scheduledAt,
    audience = {},
    recipientUserIds = [],
    recipientRole = null,
  } = req.body || {};

  if (!title || !message || !scheduledAt) {
    return res.status(400).json({ error: 'title, message, and scheduledAt are required.' });
  }

  const { rows } = await query(
    `INSERT INTO communication_schedules
     (institution_id, created_by, channel, title, subject, message, audience, scheduled_at, status, result)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', $9)
     RETURNING schedule_id, institution_id, created_by, channel, title, subject, message, audience, scheduled_at, status, result, sent_at, created_at, updated_at`,
    [
      institutionId || null,
      req.user.sub,
      channel,
      title,
      subject,
      message,
      JSON.stringify({ ...audience, recipientUserIds, recipientRole }),
      scheduledAt,
      JSON.stringify({ queued: true }),
    ]
  );

  logAdminAction(req.user.sub, 'manage_communication', { action: 'schedule_message', scheduleId: rows[0].schedule_id }, req);
  res.status(201).json({ schedule: rows[0] });
});

async function loadReminderSettings(institutionId) {
  const { rows } = await query(
    `SELECT setting_id, institution_id, created_by, email_enabled, sms_enabled, settings_json, active, created_at, updated_at
     FROM communication_reminder_settings
     WHERE institution_id IS NOT DISTINCT FROM $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [institutionId || null]
  );
  return rows[0] || null;
}

export const getReminderSettings = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const institutionId = req.query.institutionId || null;
  const settings = await loadReminderSettings(institutionId);
  res.json({
    settings: settings || {
      setting_id: null,
      institution_id: institutionId,
      email_enabled: true,
      sms_enabled: true,
      settings_json: { subscription: [7, 3, 1], deadline: [3, 1], rotation: [7, 3, 1], inactive: [14, 7, 3] },
      active: true,
    },
  });
});

export const updateReminderSettings = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const institutionId = Object.prototype.hasOwnProperty.call(req.body || {}, 'institutionId') ? req.body.institutionId || null : req.query.institutionId || null;
  const emailEnabled = Object.prototype.hasOwnProperty.call(req.body || {}, 'emailEnabled') ? Boolean(req.body.emailEnabled) : true;
  const smsEnabled = Object.prototype.hasOwnProperty.call(req.body || {}, 'smsEnabled') ? Boolean(req.body.smsEnabled) : true;
  const settingsJson = req.body?.settingsJson && typeof req.body.settingsJson === 'object'
    ? req.body.settingsJson
    : { subscription: [7, 3, 1], deadline: [3, 1], rotation: [7, 3, 1], inactive: [14, 7, 3] };
  const active = Object.prototype.hasOwnProperty.call(req.body || {}, 'active') ? Boolean(req.body.active) : true;
  const existing = await loadReminderSettings(institutionId);
  let row;
  if (existing) {
    const { rows } = await query(
      `UPDATE communication_reminder_settings
       SET email_enabled = $1,
           sms_enabled = $2,
           settings_json = $3,
           active = $4,
           updated_at = now()
       WHERE setting_id = $5
       RETURNING setting_id, institution_id, created_by, email_enabled, sms_enabled, settings_json, active, created_at, updated_at`,
      [emailEnabled, smsEnabled, JSON.stringify(settingsJson), active, existing.setting_id]
    );
    row = rows[0];
  } else {
    const { rows } = await query(
      `INSERT INTO communication_reminder_settings
       (institution_id, created_by, email_enabled, sms_enabled, settings_json, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING setting_id, institution_id, created_by, email_enabled, sms_enabled, settings_json, active, created_at, updated_at`,
      [institutionId, req.user.sub, emailEnabled, smsEnabled, JSON.stringify(settingsJson), active]
    );
    row = rows[0];
  }
  logAdminAction(req.user.sub, 'manage_communication', { action: 'update_reminder_settings', institutionId }, req);
  res.json({ settings: row });
});

export const sendReminders = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const institutionId = req.body?.institutionId || req.query.institutionId || null;
  const channel = req.body?.channel || 'all';
  const eventType = req.body?.eventType || 'reminder';
  const title = req.body?.title || 'MedProHub reminder';
  const message = req.body?.message || 'You have a pending MedProHub reminder.';
  const recipientRole = req.body?.recipientRole || 'student';
  const recipientUserIds = Array.isArray(req.body?.recipientUserIds) ? req.body.recipientUserIds : [];
  const recipients = await resolveRecipients({
    recipientUserIds,
    recipientRole,
    institutionId,
    requireEmail: channel === 'email' || channel === 'all',
    requirePhone: channel === 'sms' || channel === 'all',
  });

  const deliveries = [];
  for (const recipient of recipients) {
    const sendEmailNow = channel === 'email' || channel === 'all';
    const sendSmsNow = channel === 'sms' || channel === 'all';
    if (sendEmailNow && recipient.email) {
      const result = await sendEmail({ to: recipient.email, subject: title, text: message, html: `<p>${message}</p>` });
      await insertHistoryRecord({
        institutionId,
        userId: recipient.user_id,
        eventType,
        channel: 'email',
        title,
        message,
        status: result.status,
        providerPayload: result,
        recipient: recipient.email,
      });
      deliveries.push({ recipient: recipient.user_id, channel: 'email', ...result });
    }
    if (sendSmsNow && recipient.phone) {
      const result = await sendSms(recipient.phone, message);
      await insertHistoryRecord({
        institutionId,
        userId: recipient.user_id,
        eventType,
        channel: 'sms',
        title,
        message,
        status: result.status,
        providerPayload: result,
        recipient: recipient.phone,
      });
      deliveries.push({ recipient: recipient.user_id, channel: 'sms', ...result });
    }
  }

  logAdminAction(req.user.sub, 'manage_communication', { action: 'send_reminders', count: deliveries.length }, req);
  res.status(201).json({ sent: deliveries.length, deliveries });
});
