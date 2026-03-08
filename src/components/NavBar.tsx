import { Link, useLocation } from 'react-router-dom';

export default function NavBar() {
  const { pathname } = useLocation();

  return (
    <nav className="nav-links">
      <Link to="/" className={`nav-link${pathname === '/' ? ' nav-link-active' : ''}`}>Play</Link>
      <Link to="/library" className={`nav-link${pathname === '/library' ? ' nav-link-active' : ''}`}>Library</Link>
      <Link to="/leaderboard" className={`nav-link${pathname === '/leaderboard' ? ' nav-link-active' : ''}`}>Leaderboard</Link>
      <Link to="/about" className={`nav-link${pathname === '/about' ? ' nav-link-active' : ''}`}>About</Link>
    </nav>
  );
}
