import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import UiIcon from '../shared/UiIcon';

const USER_TABS = [
  { id: 'users', label: 'Users', icon: 'shield' },
  { id: 'communications', label: 'Communication Center', icon: 'mail' },
];

const COMM_TABS = [
  { id: 'compose', label: 'Compose', icon: 'send' },
  { id: 'templates', label: 'Templates', icon: 'document' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'reminders', label: 'Reminders', icon: 'settings' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'student', label: 'Students' },
  { value: 'teacher', label: 'Teachers' },
  { value: 'institution_admin', label: 'Institution admins' },
  { value: 'super_admin', label: 'Super admins' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deleted', label: 'Deleted' },
];

const AUDIENCE_OPTIONS = [
  { value: 'selected', label: 'Selected users' },
  { value: 'students', label: 'Students' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'institution_admin', label: 'Institution admins' },
  { value: 'all', label: 'All active users' },
];

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email', icon: 'mail' },
  { value: 'sms', label: 'SMS', icon: 'sms' },
];

const REMINDER_KEYS = [
  { key: 'subscription', label: 'Subscription' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'rotation', label: 'Rotation' },
  { key: 'inactive', label: 'Inactive' },
];

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-KE');
  } catch {
    return '—';
  }
}

function toCommaString(values = []) {
  return Array.isArray(values) ? values.join(', ') : '';
}

function fromCommaString(text = '') {
  return String(text)
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value) && value >= 0);
}

function normalizeAudience(recipientIds, audience) {
  if (audience !== 'selected') return {};
  return recipientIds.length ? { recipientUserIds: recipientIds } : {};
}

function HistoryPanel({ userId, onClose }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    api(`/admin/users/${userId}/history`)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="superadmin-history-panel">
      <div className="superadmin-panel-head">
        <div>
          <div className="superadmin-kicker">User history</div>
          <h3 style={{ margin: 0 }}>Activity trail</h3>
        </div>
        <button className="ghost" onClick={onClose}>Close</button>
      </div>
      {error ? <div className="error-note">{error}</div> : null}
      {!history && !error ? <Loading label="Loading history..." /> : null}
      {history ? (
        <div className="superadmin-history-stack">
          <div className="superadmin-history-summary">
            <strong>{history.user?.full_name || 'Deleted user'}</strong>
            <span>{history.user?.email || 'No email available'}</span>
          </div>
          <div className="superadmin-mini-stats">
            <div className="superadmin-mini-stat"><strong>{history.audit?.length || 0}</strong><span>Audit rows</span></div>
            <div className="superadmin-mini-stat"><strong>{history.communications?.length || 0}</strong><span>Messages</span></div>
            <div className="superadmin-mini-stat"><strong>{history.schedules?.length || 0}</strong><span>Schedules</span></div>
          </div>
          <div className="superadmin-history-list">
            {(history.audit || []).slice(0, 5).map((row) => (
              <article key={row.audit_id} className="superadmin-history-item">
                <div><strong>Deletion snapshot</strong><span>{formatDate(row.deleted_at)}</span></div>
                <p>{row.reason || 'Permanent delete audit entry'}</p>
              </article>
            ))}
            {(history.communications || []).slice(0, 5).map((row) => (
              <article key={row.history_id} className="superadmin-history-item">
                <div><strong>{row.channel.toUpperCase()} message</strong><span>{formatDate(row.created_at)}</span></div>
                <p>{row.title}</p>
              </article>
            ))}
            {(history.schedules || []).slice(0, 3).map((row) => (
              <article key={row.schedule_id} className="superadmin-history-item">
                <div><strong>Scheduled item</strong><span>{formatDate(row.scheduled_at)}</span></div>
                <p>{row.title}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DeleteConfirmModal({ title, count = 1, onCancel, onConfirm, confirmText, setConfirmText, busy }) {
  const valid = String(confirmText || '').trim().toUpperCase() === 'DELETE';
  return (
    <div className="superadmin-modal" role="dialog" aria-modal="true" aria-label="Confirm permanent delete">
      <div className="superadmin-modal-panel">
        <div className="superadmin-panel-head">
          <div>
            <div className="superadmin-kicker">Permanent delete</div>
            <h3 style={{ margin: 0 }}>{title}</h3>
          </div>
          <UiIcon name="trash" />
        </div>
        <p className="superadmin-muted" style={{ marginTop: 0 }}>
          {count > 1 ? `${count} users will be deleted permanently.` : 'This user will be removed permanently.'}
          {' '}Type DELETE to continue.
        </p>
        <div className="field">
          <label>Type DELETE</label>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
        </div>
        <div className="superadmin-modal-actions">
          <button className="ghost" onClick={onCancel}>Cancel</button>
          <button className="primary danger" onClick={onConfirm} disabled={!valid || busy}>
            {busy ? 'Deleting...' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserCommunications({ defaultTab = 'users' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [commTab, setCommTab] = useState('compose');
  const [users, setUsers] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState({ history: [], logs: [], schedules: [] });
  const [reminders, setReminders] = useState(null);
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedUserHistoryId, setSelectedUserHistoryId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [deletePrompt, setDeletePrompt] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [templateForm, setTemplateForm] = useState({
    name: '',
    channel: 'email',
    eventType: 'general',
    subject: '',
    body: '',
    institutionId: '',
    active: true,
  });
  const [composeForm, setComposeForm] = useState({
    audience: 'selected',
    channel: 'email',
    recipientRole: 'student',
    subject: '',
    message: '',
    scheduledAt: '',
  });
  const [reminderForm, setReminderForm] = useState({
    institutionId: '',
    emailEnabled: true,
    smsEnabled: true,
    active: true,
    subscription: '7, 3, 1',
    deadline: '3, 1',
    rotation: '7, 3, 1',
    inactive: '14, 7, 3',
  });

  const selectedTemplate = useMemo(
    () => templates.find((template) => String(template.template_id) === String(selectedTemplateId)) || null,
    [templates, selectedTemplateId]
  );

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.active),
    [templates]
  );

  function loadUsers() {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.role) params.set('role', filters.role);
    if (filters.status) params.set('status', filters.status);
    params.set('limit', '100');
    return api(`/admin/users${params.toString() ? `?${params.toString()}` : ''}`).then((data) => {
      setUsers(data.users || []);
      setSelectedUserIds((current) => current.filter((id) => (data.users || []).some((user) => String(user.user_id) === String(id))));
    });
  }

  function loadComms() {
    return Promise.all([
      api('/admin/communication/templates').then((data) => setTemplates(data.templates || [])),
      api('/admin/communication/history').then((data) => setHistory({
        history: data.history || [],
        logs: data.logs || [],
        schedules: data.schedules || [],
      })),
      api('/admin/reminders/settings').then((data) => {
        const settings = data.settings || null;
        if (settings) {
          setReminders(settings);
          const normalized = settings.settings_json || {};
          setReminderForm({
            institutionId: settings.institution_id || '',
            emailEnabled: settings.email_enabled ?? true,
            smsEnabled: settings.sms_enabled ?? true,
            active: settings.active ?? true,
            subscription: toCommaString(normalized.subscription || [7, 3, 1]),
            deadline: toCommaString(normalized.deadline || [3, 1]),
            rotation: toCommaString(normalized.rotation || [7, 3, 1]),
            inactive: toCommaString(normalized.inactive || [14, 7, 3]),
          });
        }
      }),
    ]);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadUsers()
      .then(() => (activeTab === 'communications' ? loadComms() : Promise.resolve()))
      .catch((error) => {
        if (!cancelled) setMessage({ kind: 'error', text: error.message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.role, filters.status]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (activeTab === 'communications') {
      loadComms().catch((error) => setMessage({ kind: 'error', text: error.message }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function refreshUsers() {
    await loadUsers();
  }

  async function refreshComms() {
    await loadComms();
  }

  async function suspendUser(userId) {
    setBusy(true);
    try {
      await api(`/users/${userId}/suspend`, { method: 'PATCH' });
      await refreshUsers();
    } catch (error) {
      setMessage({ kind: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function reactivateUser(userId) {
    setBusy(true);
    try {
      await api(`/users/${userId}/reactivate`, { method: 'PATCH' });
      await refreshUsers();
    } catch (error) {
      setMessage({ kind: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function confirmPermanentDelete() {
    if (String(deleteConfirmText || '').trim().toUpperCase() !== 'DELETE') return;
    setBusy(true);
    try {
      if (deletePrompt?.mode === 'bulk') {
        await api('/admin/users/bulk-delete', {
          method: 'POST',
          body: {
            userIds: deletePrompt.ids,
            reason: deletePrompt.reason || null,
          },
        });
      } else if (deletePrompt?.userId) {
        await api(`/admin/users/${deletePrompt.userId}/permanent`, {
          method: 'DELETE',
          body: {
            reason: deletePrompt.reason || null,
          },
        });
      }
      setMessage({
        kind: 'success',
        text: deletePrompt?.mode === 'bulk'
          ? 'Selected users were deleted permanently.'
          : 'User was deleted permanently.',
      });
      setDeletePrompt(null);
      setDeleteConfirmText('');
      setSelectedUserIds([]);
      await refreshUsers();
      setSelectedUserHistoryId('');
    } catch (error) {
      setMessage({ kind: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function loadSelectedUserHistory(userId) {
    setSelectedUserHistoryId(userId);
  }

  async function saveTemplate(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (selectedTemplateId) {
        await api(`/admin/communication/templates/${selectedTemplateId}`, {
          method: 'PUT',
          body: templateForm,
        });
      } else {
        await api('/admin/communication/templates', {
          method: 'POST',
          body: templateForm,
        });
      }
      setTemplateForm({
        name: '',
        channel: 'email',
        eventType: 'general',
        subject: '',
        body: '',
        institutionId: '',
        active: true,
      });
      setSelectedTemplateId('');
      await refreshComms();
    } catch (error) {
      setMessage({ kind: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function deleteTemplate(templateId) {
    setBusy(true);
    try {
      await api(`/admin/communication/templates/${templateId}`, { method: 'DELETE' });
      await refreshComms();
    } catch (error) {
      setMessage({ kind: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function sendCommunication() {
    if (composeForm.audience === 'selected' && !selectedUserIds.length) {
      setMessage({ kind: 'error', text: 'Select at least one user first.' });
      return;
    }
    setBusy(true);
    try {
      const recipients = composeForm.audience === 'selected'
        ? selectedUserIds
        : [];
      const recipientRole = composeForm.audience === 'selected'
        ? null
        : composeForm.audience === 'all'
          ? null
          : composeForm.audience;
      const body = {
        institutionId: null,
        recipientUserIds: recipients,
        recipientRole,
        channel: composeForm.channel,
        subject: composeForm.subject,
        body: composeForm.message,
        message: composeForm.message,
        title: composeForm.subject,
        templateId: selectedTemplateId || null,
      };
      await api(
        composeForm.channel === 'sms'
          ? '/admin/communication/send-sms'
          : '/admin/communication/send-email',
        { method: 'POST', body }
      );
      setMessage({ kind: 'success', text: 'Message sent successfully.' });
      await refreshComms();
    } catch (error) {
      setMessage({ kind: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function scheduleCommunication() {
    if (!composeForm.scheduledAt) {
      setMessage({ kind: 'error', text: 'Choose a schedule time first.' });
      return;
    }
    if (composeForm.audience === 'selected' && !selectedUserIds.length) {
      setMessage({ kind: 'error', text: 'Select at least one user first.' });
      return;
    }
    setBusy(true);
    try {
      const recipientRole = composeForm.audience === 'selected'
        ? null
        : composeForm.audience === 'all'
          ? null
          : composeForm.audience;
      await api('/admin/communication/schedule', {
        method: 'POST',
        body: {
          institutionId: null,
          channel: composeForm.channel,
          title: composeForm.subject || 'Scheduled communication',
          subject: composeForm.subject,
          message: composeForm.message,
          scheduledAt: composeForm.scheduledAt,
          audience: normalizeAudience(selectedUserIds, composeForm.audience),
          recipientUserIds: composeForm.audience === 'selected' ? selectedUserIds : [],
          recipientRole,
        },
      });
      setMessage({ kind: 'success', text: 'Communication scheduled.' });
      await refreshComms();
    } catch (error) {
      setMessage({ kind: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function saveReminders(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        institutionId: reminderForm.institutionId || null,
        emailEnabled: reminderForm.emailEnabled,
        smsEnabled: reminderForm.smsEnabled,
        active: reminderForm.active,
        settingsJson: {
          subscription: fromCommaString(reminderForm.subscription),
          deadline: fromCommaString(reminderForm.deadline),
          rotation: fromCommaString(reminderForm.rotation),
          inactive: fromCommaString(reminderForm.inactive),
        },
      };
      await api('/admin/reminders/settings', {
        method: 'PUT',
        body: payload,
      });
      await refreshComms();
      setMessage({ kind: 'success', text: 'Reminder settings saved.' });
    } catch (error) {
      setMessage({ kind: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function sendRemindersNow() {
    setBusy(true);
    try {
      await api('/admin/reminders/send', {
        method: 'POST',
        body: {
          institutionId: reminderForm.institutionId || null,
          channel: reminderForm.emailEnabled && reminderForm.smsEnabled
            ? 'all'
            : reminderForm.emailEnabled
              ? 'email'
              : 'sms',
          title: 'MedProHub reminder',
          message: 'You have a MedProHub reminder waiting in your account.',
          recipientRole: 'student',
        },
      });
      setMessage({ kind: 'success', text: 'Reminders sent.' });
      await refreshComms();
    } catch (error) {
      setMessage({ kind: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  const selectedCount = selectedUserIds.length;
  const filteredUsers = useMemo(() => users || [], [users]);

  if (loading && !users) return <Loading label="Loading super admin workspace..." />;

  return (
    <div className="superadmin-center-shell">
      <div className="page-head">
        <div>
          <h1>Users & Communication</h1>
          <div className="sub">Permanent user controls, templates, schedules, and reminders in one workspace.</div>
        </div>
      </div>

      <div className="superadmin-center-tabs">
        {USER_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`review-tab ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <UiIcon name={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {message ? (
        <div className={message.kind === 'success' ? 'ok-note' : 'error-note'}>
          {message.text}
        </div>
      ) : null}

      {activeTab === 'users' ? (
        <div className="superadmin-center-grid">
          <div className="superadmin-main-panel">
            <div className="card">
              <div className="superadmin-panel-head">
                <div>
                  <div className="superadmin-kicker">Users</div>
                  <h2 style={{ margin: 0 }}>{filteredUsers.length} accounts</h2>
                </div>
                <div className="superadmin-action-row">
                  <button
                    className="ghost danger"
                    type="button"
                    disabled={!selectedCount}
                    onClick={() => setDeletePrompt({
                      mode: 'bulk',
                      ids: selectedUserIds,
                      title: 'Delete selected users',
                    })}
                  >
                    Delete selected
                  </button>
                </div>
              </div>

              <div className="superadmin-toolbar">
                <div className="field">
                  <label>Search</label>
                  <input
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Name, email, or reg number"
                  />
                </div>
                <div className="field">
                  <label>Role</label>
                  <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                    {ROLE_OPTIONS.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                    {STATUS_OPTIONS.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="superadmin-bulk-bar">
                <div className="superadmin-bulk-count">{selectedCount} selected</div>
                <div className="superadmin-bulk-actions">
                  <button className="ghost" type="button" onClick={() => setSelectedUserIds([])} disabled={!selectedCount}>Clear</button>
                  <button className="ghost danger" type="button" disabled={!selectedCount} onClick={() => setDeletePrompt({
                    mode: 'bulk',
                    ids: selectedUserIds,
                    title: 'Delete selected users',
                  })}>
                    Permanent delete
                  </button>
                </div>
              </div>

              <div className="superadmin-table-wrap">
                <table className="superadmin-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedCount > 0 && selectedCount === filteredUsers.length}
                          onChange={(e) => setSelectedUserIds(e.target.checked ? filteredUsers.map((user) => user.user_id) : [])}
                        />
                      </th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Institution</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const selected = selectedUserIds.includes(user.user_id);
                      return (
                        <tr key={user.user_id} className={selected ? 'is-selected' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => {
                                setSelectedUserIds((current) => (
                                  e.target.checked
                                    ? [...new Set([...current, user.user_id])]
                                    : current.filter((id) => id !== user.user_id)
                                ));
                              }}
                            />
                          </td>
                          <td>
                            <strong>{user.full_name}</strong>
                            <div className="superadmin-muted">{user.email}</div>
                          </td>
                          <td>{String(user.role || '').replace(/_/g, ' ')}</td>
                          <td><span className={`badge ${user.status}`}>{user.status}</span></td>
                          <td>{user.institution_name || '—'}</td>
                          <td>
                            <div className="superadmin-row-actions">
                              <button className="ghost" type="button" onClick={() => loadSelectedUserHistory(user.user_id)}>
                                <UiIcon name="history" />
                                <span>History</span>
                              </button>
                              {user.status === 'active' ? (
                                <button className="ghost" type="button" onClick={() => suspendUser(user.user_id)}>
                                  Suspend
                                </button>
                              ) : (
                                <button className="ghost" type="button" onClick={() => reactivateUser(user.user_id)}>
                                  Reactivate
                                </button>
                              )}
                              <button
                                className="ghost danger"
                                type="button"
                                onClick={() => setDeletePrompt({
                                  mode: 'single',
                                  userId: user.user_id,
                                  title: `Delete ${user.full_name}`,
                                })}
                              >
                                <UiIcon name="trash" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!filteredUsers.length && (
                      <tr>
                        <td colSpan="6" style={{ color: 'var(--ink-soft)' }}>No users match the current filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="superadmin-side-panel">
          <HistoryPanel
            userId={selectedUserHistoryId}
            onClose={() => {
                setSelectedUserHistoryId('');
              }}
            />
            {!selectedUserHistoryId && (
              <div className="card">
                <div className="superadmin-panel-head">
                  <div>
                    <div className="superadmin-kicker">Quick actions</div>
                    <h3 style={{ margin: 0 }}>Bulk control</h3>
                  </div>
                  <UiIcon name="shield" />
                </div>
                <div className="superadmin-quick-grid">
                  <div className="superadmin-quick-card">
                    <strong>{selectedCount}</strong>
                    <span>Selected</span>
                  </div>
                  <div className="superadmin-quick-card">
                    <strong>{filteredUsers.filter((u) => u.status === 'active').length}</strong>
                    <span>Active</span>
                  </div>
                  <div className="superadmin-quick-card">
                    <strong>{filteredUsers.filter((u) => u.status === 'suspended').length}</strong>
                    <span>Suspended</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'communications' ? (
        <div className="superadmin-center-grid">
          <div className="superadmin-main-panel">
            <div className="card">
              <div className="superadmin-panel-head">
                <div>
                  <div className="superadmin-kicker">Communication center</div>
                  <h2 style={{ margin: 0 }}>Email and SMS</h2>
                </div>
                <div className="superadmin-channel-badges">
                  {CHANNEL_OPTIONS.map((option) => (
                    <span key={option.value} className="badge draft">
                      <UiIcon name={option.icon} />
                      {option.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="superadmin-center-tabs superadmin-center-tabs--inner">
                {COMM_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`review-tab ${commTab === tab.id ? 'is-active' : ''}`}
                    onClick={() => setCommTab(tab.id)}
                  >
                    <UiIcon name={tab.icon} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {commTab === 'compose' ? (
                <div className="superadmin-form-grid">
                  <div className="field">
                    <label>Audience</label>
                    <select value={composeForm.audience} onChange={(e) => setComposeForm({ ...composeForm, audience: e.target.value })}>
                      {AUDIENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Channel</label>
                    <select value={composeForm.channel} onChange={(e) => setComposeForm({ ...composeForm, channel: e.target.value })}>
                      {CHANNEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Template</label>
                    <select value={selectedTemplateId} onChange={(e) => {
                      const template = templates.find((item) => String(item.template_id) === e.target.value) || null;
                      setSelectedTemplateId(e.target.value);
                      if (template) {
                        setComposeForm((current) => ({
                          ...current,
                          subject: template.subject || current.subject,
                          message: template.body || current.message,
                          channel: template.channel || current.channel,
                        }));
                      }
                    }}>
                      <option value="">No template</option>
                      {templates.map((template) => (
                        <option key={template.template_id} value={template.template_id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              {commTab === 'compose' ? (
                <>
                  {composeForm.audience === 'selected' ? (
                    <div className="superadmin-selected-note">
                      <strong>{selectedCount}</strong>
                      <span>selected users will receive the message.</span>
                    </div>
                  ) : null}

                  <div className="field">
                    <label>Subject</label>
                    <input
                      value={composeForm.subject}
                      onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                      placeholder="Short subject line"
                    />
                  </div>
                  <div className="field">
                    <label>Message</label>
                    <textarea
                      rows="6"
                      value={composeForm.message}
                      onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                      placeholder="Write the email or SMS body here"
                    />
                  </div>
                  <div className="field">
                    <label>Schedule time</label>
                    <input
                      type="datetime-local"
                      value={composeForm.scheduledAt}
                      onChange={(e) => setComposeForm({ ...composeForm, scheduledAt: e.target.value })}
                    />
                  </div>
                  <div className="superadmin-action-row">
                    <button className="primary" type="button" onClick={sendCommunication} disabled={busy || !composeForm.message || (!composeForm.subject && composeForm.channel === 'email')}>
                      <UiIcon name="send" />
                      <span>Send now</span>
                    </button>
                    <button
                      className="ghost"
                      type="button"
                      onClick={scheduleCommunication}
                      disabled={
                        busy
                        || !composeForm.message
                        || !composeForm.scheduledAt
                        || (composeForm.audience === 'selected' && !selectedUserIds.length)
                      }
                    >
                      <UiIcon name="calendar" />
                      <span>Schedule</span>
                    </button>
                  </div>
                </>
              ) : null}

              {commTab === 'templates' ? (
                <div className="superadmin-template-grid">
                  <div className="card superadmin-inner-card">
                    <h3 style={{ marginTop: 0 }}>{selectedTemplateId ? 'Edit template' : 'Create template'}</h3>
                    <form onSubmit={saveTemplate}>
                      <div className="field">
                        <label>Name</label>
                        <input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} />
                      </div>
                      <div className="form-grid">
                        <div className="field">
                          <label>Channel</label>
                          <select value={templateForm.channel} onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value })}>
                            {CHANNEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </div>
                        <div className="field">
                          <label>Event</label>
                          <input value={templateForm.eventType} onChange={(e) => setTemplateForm({ ...templateForm, eventType: e.target.value })} />
                        </div>
                      </div>
                      <div className="field">
                        <label>Subject</label>
                        <input value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} />
                      </div>
                      <div className="field">
                        <label>Body</label>
                        <textarea rows="6" value={templateForm.body} onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })} />
                      </div>
                      <div className="superadmin-action-row">
                        <button className="primary" type="submit" disabled={busy || !templateForm.name || !templateForm.body}>Save template</button>
                        <button
                          className="ghost"
                          type="button"
                          onClick={() => {
                            setTemplateForm({
                              name: '',
                              channel: 'email',
                              eventType: 'general',
                              subject: '',
                              body: '',
                              institutionId: '',
                              active: true,
                            });
                            setSelectedTemplateId('');
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    </form>
                  </div>
                  <div className="card superadmin-inner-card">
                    <h3 style={{ marginTop: 0 }}>Saved templates</h3>
                    <div className="superadmin-list">
                      {templates.map((template) => (
                        <article key={template.template_id} className="superadmin-list-row">
                          <div>
                            <strong>{template.name}</strong>
                            <div className="superadmin-muted">{template.channel} · {template.event_type}</div>
                          </div>
                          <div className="superadmin-row-actions">
                            <button
                              className="ghost"
                              type="button"
                              onClick={() => {
                                setSelectedTemplateId(template.template_id);
                                setTemplateForm({
                                  name: template.name || '',
                                  channel: template.channel || 'email',
                                  eventType: template.event_type || 'general',
                                  subject: template.subject || '',
                                  body: template.body || '',
                                  institutionId: template.institution_id || '',
                                  active: template.active ?? true,
                                });
                              }}
                            >
                              Edit
                            </button>
                            <button className="ghost danger" type="button" onClick={() => deleteTemplate(template.template_id)}>
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                      {!templates.length ? <div className="superadmin-empty">No templates saved yet.</div> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {commTab === 'history' ? (
                <div className="superadmin-history-grid">
                  <div className="card superadmin-inner-card">
                    <h3 style={{ marginTop: 0 }}>Recent messages</h3>
                    <div className="superadmin-list">
                      {history.history.slice(0, 8).map((row) => (
                        <article key={row.history_id} className="superadmin-list-row">
                          <div>
                            <strong>{row.title}</strong>
                            <div className="superadmin-muted">{row.channel.toUpperCase()} · {row.full_name || 'Unknown recipient'}</div>
                          </div>
                          <div className="superadmin-muted">{formatDate(row.created_at)}</div>
                        </article>
                      ))}
                      {!history.history.length ? <div className="superadmin-empty">No communication history yet.</div> : null}
                    </div>
                  </div>
                  <div className="card superadmin-inner-card">
                    <h3 style={{ marginTop: 0 }}>Schedules</h3>
                    <div className="superadmin-list">
                      {history.schedules.slice(0, 8).map((row) => (
                        <article key={row.schedule_id} className="superadmin-list-row">
                          <div>
                            <strong>{row.title}</strong>
                            <div className="superadmin-muted">{row.channel.toUpperCase()} · {row.status}</div>
                          </div>
                          <div className="superadmin-muted">{formatDate(row.scheduled_at)}</div>
                        </article>
                      ))}
                      {!history.schedules.length ? <div className="superadmin-empty">No scheduled messages yet.</div> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {commTab === 'reminders' ? (
                <div className="superadmin-template-grid">
                  <div className="card superadmin-inner-card">
                    <h3 style={{ marginTop: 0 }}>Reminder settings</h3>
                    <form onSubmit={saveReminders}>
                      <div className="form-grid">
                        <div className="field">
                          <label>Institution ID</label>
                          <input
                            value={reminderForm.institutionId}
                            onChange={(e) => setReminderForm({ ...reminderForm, institutionId: e.target.value })}
                            placeholder="Leave blank for global"
                          />
                        </div>
                        <div className="field">
                          <label>Email</label>
                          <select value={reminderForm.emailEnabled ? 'true' : 'false'} onChange={(e) => setReminderForm({ ...reminderForm, emailEnabled: e.target.value === 'true' })}>
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>SMS</label>
                          <select value={reminderForm.smsEnabled ? 'true' : 'false'} onChange={(e) => setReminderForm({ ...reminderForm, smsEnabled: e.target.value === 'true' })}>
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Active</label>
                          <select value={reminderForm.active ? 'true' : 'false'} onChange={(e) => setReminderForm({ ...reminderForm, active: e.target.value === 'true' })}>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-grid">
                        {REMINDER_KEYS.map((item) => (
                          <div className="field" key={item.key}>
                            <label>{item.label} days before</label>
                            <input
                              value={reminderForm[item.key]}
                              onChange={(e) => setReminderForm({ ...reminderForm, [item.key]: e.target.value })}
                              placeholder="7, 3, 1"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="superadmin-action-row">
                        <button className="primary" type="submit" disabled={busy}>Save settings</button>
                        <button className="ghost" type="button" onClick={sendRemindersNow} disabled={busy}>Send reminders</button>
                      </div>
                    </form>
                  </div>
                  <div className="card superadmin-inner-card">
                    <h3 style={{ marginTop: 0 }}>Active channels</h3>
                    <div className="superadmin-list">
                      <article className="superadmin-list-row">
                        <div>
                          <strong>Email reminders</strong>
                          <div className="superadmin-muted">{reminderForm.emailEnabled ? 'Enabled' : 'Disabled'}</div>
                        </div>
                        <span className={`badge ${reminderForm.emailEnabled ? 'active' : 'expired'}`}>
                          {reminderForm.emailEnabled ? 'Active' : 'Inactive'}
                        </span>
                      </article>
                      <article className="superadmin-list-row">
                        <div>
                          <strong>SMS reminders</strong>
                          <div className="superadmin-muted">{reminderForm.smsEnabled ? 'Enabled' : 'Disabled'}</div>
                        </div>
                        <span className={`badge ${reminderForm.smsEnabled ? 'active' : 'expired'}`}>
                          {reminderForm.smsEnabled ? 'Active' : 'Inactive'}
                        </span>
                      </article>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="superadmin-side-panel">
            <div className="card">
              <div className="superadmin-panel-head">
                <div>
                  <div className="superadmin-kicker">Publishing</div>
                  <h3 style={{ margin: 0 }}>Fast actions</h3>
                </div>
                <UiIcon name="settings" />
              </div>
              <div className="superadmin-quick-grid">
                <div className="superadmin-quick-card">
                  <strong>{activeTemplates.length}</strong>
                  <span>Active templates</span>
                </div>
                <div className="superadmin-quick-card">
                  <strong>{history.schedules.length}</strong>
                  <span>Scheduled</span>
                </div>
                <div className="superadmin-quick-card">
                  <strong>{history.history.length}</strong>
                  <span>Messages</span>
                </div>
              </div>
              <div className="superadmin-publish-card">
                <label>Selected template</label>
                <div>{selectedTemplate?.name || 'No template selected'}</div>
              </div>
              <div className="superadmin-publish-card">
                <label>Selected recipients</label>
                <div>{selectedCount || 'No user selection needed for role-based sends'}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deletePrompt ? (
        <DeleteConfirmModal
          title={deletePrompt.title}
          count={deletePrompt.mode === 'bulk' ? deletePrompt.ids.length : 1}
          confirmText={deleteConfirmText}
          setConfirmText={setDeleteConfirmText}
          busy={busy}
          onCancel={() => {
            setDeletePrompt(null);
            setDeleteConfirmText('');
          }}
          onConfirm={confirmPermanentDelete}
        />
      ) : null}
    </div>
  );
}
