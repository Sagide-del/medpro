import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeForRole } from '../../services/auth';

export default function Navbar() {
  const { user } = useAuth();
  return (
    <header className="navbar">
      <Link to="/" className="brand">Med<span>Pro</span></Link>
      <nav className="links">
        {user ? (
          <Link to={homeForRole(user.role)}>Dashboard</Link>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
