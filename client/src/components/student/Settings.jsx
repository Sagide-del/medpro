import { useAuth } from '../../context/AuthContext';

export default function StudentSettings() {
  const { user } = useAuth();
  return (
    <div className="platform-page">
      <header className="page-head"><div><div className="platform-eyebrow">Account</div><h1>Settings</h1><div className="sub">Manage your profile and revision preferences.</div></div></header>
      <section className="platform-settings-panel">
        <div><span className="platform-settings-avatar">{String(user?.name || 'A').charAt(0).toUpperCase()}</span><div><h2>{user?.name || 'Student'}</h2><p>{user?.email || 'Account email'}</p></div></div>
        <dl><div><dt>Certification track</dt><dd>{user?.program || 'EMT'}</dd></div><div><dt>Account status</dt><dd>Active</dd></div></dl>
      </section>
    </div>
  );
}
