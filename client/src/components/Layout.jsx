import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import PlatformFooter from './shared/PlatformFooter';
import UiIcon from './shared/UiIcon';

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
  const visibleLinks = links.filter((item) => item.group !== 'Aliases');

  return (
    <div className={`shell${roleLabel === 'EMS revision workspace' ? ' role-student' : ''}`}>

      <aside className="sidebar">

        <div className="sidebar-top">
          <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
            <span className="brand-lockup"><MedProMark /></span>
            {roleLabel && <small>{roleLabel}</small>}
          </Link>

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
              >
                <span className="nav-link-copy">{item.label}</span>
              </NavLink>
            );

          })}

        </nav>


        <div className="foot">

          <div className="foot-label">Signed in as</div>
          <div className="foot-user">{user?.name || user?.full_name}</div>


          <button
            className="ghost"
            onClick={() => navigate('/')}
          >
            Back to home
          </button>


          <button
            className="ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={{ marginTop: 6 }}
          >
            Sign out
          </button>


          <div style={{ marginTop: 14 }}>
            MedProHub &copy; 2026. All rights reserved.
          </div>


        </div>

      </aside>


      <main className="main">

        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>

        <PlatformFooter />

      </main>


    </div>
  );
}
