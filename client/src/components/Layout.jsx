import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import PlatformFooter from './shared/PlatformFooter';
import UiIcon from './shared/UiIcon';
import '../styles/platform-v2.css';

function MedProMark() {
  return <img className="brand-logo-image" src="/medpro-logo.png" alt="MedPro" />;
}

/**
 * Shared authenticated-app shell: sidebar + <Outlet/>.
 * Supports both:
 * 1. Flat links:
 *    [{to:'/student', label:'Dashboard'}]
 *
 * 2. Grouped links:
 *    [
 *      {
 *        group:'Management',
 *        items:[
 *          {to:'/users', label:'Users'}
 *        ]
 *      }
 *    ]
 */
export default function Layout({ links, roleLabel }) {
  const { user, logout, setProgram } = useAuth();
  const navigate = useNavigate();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const visibleLinks = links.filter((item) => item.group !== 'Aliases');

  return (
    <div className={`shell${user?.role === 'student' ? ' role-student' : ''}`}>

      <aside className={`sidebar${navigationOpen ? ' open' : ''}`}>

        <div className="sidebar-top">
          <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
            <span className="brand-lockup"><MedProMark /></span>
            {(roleLabel || user?.role === 'student') && <small>{roleLabel || 'Learn • Practice • Pass'}</small>}
          </Link>
          <button
            type="button"
            className="nav-toggle"
            aria-label={navigationOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={navigationOpen}
            onClick={() => setNavigationOpen((current) => !current)}
          >
            <span /><span /><span />
          </button>
        </div>

        <div className="sidebar-account-actions">
          <span className="sidebar-account-name">{user?.name || user?.full_name || 'Account'}</span>
          <button type="button" className="sidebar-signout" onClick={() => { logout(); navigate('/login'); }}>
            Sign out
          </button>
        </div>

        {user?.role === 'student' && (
          <div className="program-switcher" aria-label="Choose revision track">
            <div className="program-switcher-label">Revision track</div>
            <div className="program-switcher-options">
              {['EMT', 'Paramedic'].map((program) => (
                <button
                  key={program}
                  type="button"
                  className={user.program === program ? 'is-selected' : ''}
                  aria-pressed={user.program === program}
                      onClick={() => setProgram(program)}
                >
                  {program}
                </button>
              ))}
            </div>
          </div>
        )}

        <nav>

          {visibleLinks.map((item, index) => {

            // Grouped navigation
            if (item.group) {
              return (
                <div 
                  key={`${item.group}-${index}`} 
                  className="nav-group"
                >

                  <div className="nav-group-title">
                    {item.group}
                  </div>

                  {item.items.map((link) => (
                  <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      onClick={() => setNavigationOpen(false)}
                    >
                      {link.icon && <UiIcon name={link.icon} className="nav-link-icon" />}
                      <span className="nav-link-copy">{link.label}</span>
                    </NavLink>
                  ))}

                </div>
              );
            }


            // Existing flat navigation
            return (
            <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setNavigationOpen(false)}
              >
                <span className="nav-link-copy">{item.label}</span>
              </NavLink>
            );

          })}

        </nav>


        <div className="foot">

          <div className="foot-label">Signed in as</div>
          <div className="foot-user">{user?.name || user?.full_name}</div>


          <div style={{ marginTop: 14 }}>
            Andolih EdTech Studios
          </div>


        </div>

      </aside>


      <main className="main">

        <header className="platform-topbar">
          <button
            type="button"
            className="platform-mobile-menu"
            aria-label={navigationOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={navigationOpen}
            onClick={() => setNavigationOpen((current) => !current)}
          >
            <span className="platform-hamburger" aria-hidden="true"><i /><i /><i /></span>
          </button>
          <label className="platform-search">
            <UiIcon name="search" />
            <span className="sr-only">Search MedPro</span>
            <input type="search" placeholder="Search questions, topics, or keywords..." />
          </label>
          <div className="platform-topbar-actions">
            <button type="button" aria-label="Notifications"><UiIcon name="alert" /></button>
            <span className="platform-user-role">{roleLabel || user?.role || 'Account'}</span>
            <span className="platform-user-avatar" aria-hidden="true">{String(user?.name || user?.full_name || 'A').charAt(0).toUpperCase()}</span>
          </div>
        </header>

        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>

        <PlatformFooter />

      </main>


    </div>
  );
}
