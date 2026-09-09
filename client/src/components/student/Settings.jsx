import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import UiIcon from '../shared/UiIcon';

const TABS = ['Profile', 'Notifications', 'Study Preferences', 'Account'];

export default function StudentSettings() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Profile');
  const name = user?.name || user?.full_name || 'Student';
  const [form, setForm] = useState({ name, email: user?.email || '', program: user?.program || 'EMT' });

  return <div className="new-settings-page"><header><h1>Settings</h1></header><nav className="new-settings-tabs" aria-label="Settings sections">{TABS.map((item) => <button type="button" className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)} key={item}>{item}</button>)}</nav>{tab === 'Profile' ? <section className="new-settings-panel"><div className="new-settings-profile"><span className="new-settings-avatar"><UiIcon name="community" /></span><div><h2>{name}</h2><p>{user?.email || 'Account email'}</p><button type="button">Change photo</button></div></div><form className="new-settings-form" onSubmit={(event) => event.preventDefault()}><h2>Personal Information</h2><label>Full Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Certification Level<select value={form.program} onChange={(event) => setForm({ ...form, program: event.target.value })}><option>EMT</option><option>Paramedic</option></select></label><button className="new-settings-save" type="submit">Save Changes</button></form></section> : <section className="new-settings-panel new-settings-placeholder"><UiIcon name={tab === 'Notifications' ? 'alert' : 'settings'} /><h2>{tab}</h2><p>Your {tab.toLowerCase()} preferences will appear here.</p></section>}</div>;
}
