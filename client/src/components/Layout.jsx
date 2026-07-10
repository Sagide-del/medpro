import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PulseLine from './PulseLine';
import ErrorBoundary from './ErrorBoundary';

/**
 * Shared authenticated-app shell: sidebar + <Outlet/>.
 * Each role's route group passes its own nav links and label.
 * Usage: <Route element={<Layout links={studentLinks} roleLabel="Student portal" />}>...</Route>
 *
 * The page content is wrapped in an ErrorBoundary so a crash in one page
 * (like the Institutions bug) can never again wipe out the sidebar, the nav
 * links, or the "Back to home" / "Sign out" buttons — only the content area
 * shows a recovery message. Keyed on the route so navigating elsewhere
 * automatically clears a previous error.
 */
export default function Layout({ links, roleLabel }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          Med<span>Pro</span>
          <small>{roleLabel}</small>
        </Link>
        <PulseLine color="#cc0000" />
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="foot">
          Signed in as {user?.name}
          <button className="ghost" onClick={() => navigate('/')}>
            Back to home
          </button>
          <button className="ghost" onClick={() => { logout(); navigate('/login'); }} style={{ marginTop: 6 }}>
            Sign out
          </button>
          <div style={{ marginTop: 14 }}>
            MedPro &middot; SA Technologies<br />
            South C (Bellevue), Red Cross Rd, Nairobi<br />
            +254 748 519 923<br />
            info@satechnologies.co.ke
          </div>
        </div>
      </aside>
      <main className="main">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
