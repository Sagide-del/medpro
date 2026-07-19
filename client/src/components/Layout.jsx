import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PulseLine from './PulseLine';
import ErrorBoundary from './ErrorBoundary';

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

          {links.map((item, index) => {

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
                      {link.label}
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
                {item.label}
              </NavLink>
            );

          })}

        </nav>


        <div className="foot">

          Signed in as {user?.name || user?.full_name}


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
            MedPro &middot; SA Technologies
            <br />
            <br />
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