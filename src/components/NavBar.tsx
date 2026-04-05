import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/',            label: 'Play' },
  { to: '/library',     label: 'Library' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/about',       label: 'About' },
];

export default function NavBar() {
  const { pathname } = useLocation();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="site-title-block">
          <Link to="/" className="site-title">Gerrymander Tetris</Link>
        </div>
        <nav className="nav-tabs">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-tab${pathname === to ? ' nav-tab-active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
