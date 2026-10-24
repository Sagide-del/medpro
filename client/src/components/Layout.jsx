import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import PlatformFooter from './shared/PlatformFooter';
import UiIcon from './shared/UiIcon';
import '../styles/platform-v2.css';
import '../styles/platform-shell.css';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const caseWorkspace=user?.role==='student' && (location.pathname.startsWith('/student/learn/kenya-ems/') || location.pathname==='/student/drug-reference' || location.pathname==='/student/cheat-sheets' || location.pathname==='/student/mock-prep-tests');
  const [caseSearchOpen,setCaseSearchOpen]=useState(false);
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);
  const [mobile,setMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const [navigationOpen, setNavigationOpen] = useState(false);
  useEffect(() => {
    const media=window.matchMedia('(max-width: 900px)');
    const change=()=>{setMobile(media.matches);setNavigationOpen(false);};
    media.addEventListener('change',change);
    return ()=>media.removeEventListener('change',change);
  },[]);
  useEffect(()=>setNavigationOpen(false),[location.pathname]);
  useEffect(()=>{
    if(!mobile || !navigationOpen) return undefined;
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const nodes=()=>[...sidebarRef.current.querySelectorAll('a[href],button:not([disabled]),select')];
    sidebarRef.current.querySelector('.nav-toggle')?.focus();
    const onKey=event=>{
      if(event.key==='Escape'){setNavigationOpen(false);event.preventDefault();}
      if(event.key==='Tab'){
        const items=nodes(),first=items[0],last=items.at(-1);
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',onKey);
    return ()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',onKey);menuRef.current?.focus();};
  },[mobile,navigationOpen]);
  const visibleLinks = links.filter((item) => item.group !== 'Aliases');

  return (
    <div className={`shell platform-shell${user?.role === 'student' ? ' role-student' : ''}${caseWorkspace?' case-workspace':''}${caseSearchOpen?' case-search-open':''}`}>

      <aside id="platform-navigation" ref={sidebarRef} aria-label="Main navigation" inert={mobile && !navigationOpen ? '' : undefined} className={`sidebar${navigationOpen ? ' open' : ''}`}>

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
            <span className="navigation-close-glyph" aria-hidden="true">×</span>
          </button>
        </div>

        {user?.role === 'student' && (
          <div className="program-switcher" aria-label="Account study track">
            <div className="program-switcher-label">Study track</div>
            <strong>{user.program}</strong>
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
                      key={`${link.to}-${link.label}`}
                      to={link.to}
                      end={link.end}
                      className={link.nested ? 'nav-link-nested' : undefined}
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
          <button type="button" className="sidebar-logout" onClick={() => { logout(); navigate('/login'); }}>
            <UiIcon name="logout" />
            <span>Log out</span>
          </button>
        </div>

      </aside>


      {mobile && navigationOpen && <button type="button" className="navigation-backdrop" aria-label="Dismiss navigation" tabIndex={-1} onClick={()=>setNavigationOpen(false)} />}
      <main className="main" inert={mobile && navigationOpen ? '' : undefined}>

        <header className="platform-topbar">
          <button
            type="button"
            ref={menuRef}
            aria-controls="platform-navigation"
            className="platform-mobile-menu"
            aria-label={navigationOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={navigationOpen}
            onClick={() => setNavigationOpen((current) => !current)}
          >
            <span className="platform-hamburger" aria-hidden="true"><i /><i /><i /></span>
          </button>
          {caseWorkspace && <button type="button" className="platform-case-search" aria-label="Search" aria-expanded={caseSearchOpen} aria-controls="platform-search-field" onClick={()=>setCaseSearchOpen(value=>!value)}><UiIcon name="search"/></button>}
          <label className="platform-search" id="platform-search-field">
            <UiIcon name="search" />
            <span className="sr-only">Search MedPro</span>
            <input type="search" placeholder="Search questions, topics, or keywords..." />
          </label>
          {user?.role === 'student' && <div className="platform-track-picker" aria-label="Account study track"><span>Study track</span><strong>{user.program}</strong></div>}
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
