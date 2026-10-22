import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import api from '../lib/api.js';
import { fmtDateTime } from '../lib/utils.js';

const STUDENT_NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard', end: true },
  { to: '/dashboard/apply', icon: '📝', label: 'Application' },
  { to: '/dashboard/documents', icon: '📄', label: 'Documents' },
  { to: '/dashboard/payments', icon: '💳', label: 'Payments' },
  { to: '/dashboard/cutoffs', icon: '📈', label: 'Cutoffs' },
  { to: '/dashboard/curriculum', icon: '📚', label: 'Curriculum' },
  { to: '/dashboard/profile', icon: '👤', label: 'Profile' },
];

const ADMIN_NAV = [
  { to: '/admin', icon: '📊', label: 'Overview', end: true },
  { to: '/admin/applications', icon: '🗂️', label: 'Applications' },
  { to: '/admin/students', icon: '🎓', label: 'Student Database' },
  { to: '/admin/documents', icon: '✅', label: 'Verify Documents' },
  { to: '/admin/payments', icon: '💰', label: 'Payments' },
  { to: '/admin/cutoffs', icon: '📈', label: 'Cutoffs' },
  { to: '/admin/scholarships', icon: '🏆', label: 'Scholarships' },
  { to: '/admin/courses', icon: '📚', label: 'Courses & Curriculum' },
];

function BellMenu() {
  const { unread, setUnread } = useSocket();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await api.get('/notifications/mine');
        setItems(res.data);
      } finally {
        setLoading(false);
      }
    }
  };

  const markAll = async () => {
    await api.put('/notifications/read-all');
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <div className="bell-wrap">
      <button className="icon-btn bell" onClick={toggle} aria-label="Notifications">
        🔔
        {unread > 0 && <span className="bell-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <>
          <div className="dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="bell-dropdown">
            <div className="bell-head">
              <strong>Notifications</strong>
              {unread > 0 && <button className="link-btn" onClick={markAll}>Mark all read</button>}
            </div>
            <div className="bell-list">
              {loading && <p className="bell-empty">Loading…</p>}
              {!loading && items.length === 0 && <p className="bell-empty">No notifications yet.</p>}
              {items.map((n) => (
                <div key={n._id} className={`bell-item ${n.read ? '' : 'unread'}`}>
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                  <span>{fmtDateTime(n.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardLayout({ admin = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = admin ? ADMIN_NAV : STUDENT_NAV;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="side-brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>Meridian</strong>
            <span>Admissions {admin ? 'Console' : 'Portal'}</span>
          </div>
        </div>
        <nav className="side-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="side-ico">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-user">
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button className="btn btn-outline-light btn-sm btn-block" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">☰</button>
          <div className="topbar-brand-mobile">Meridian Admissions</div>
          <div className="topbar-right">
            <span className="live-pill"><span className="live-dot" /> Live</span>
            <BellMenu />
            <div className="avatar top-avatar" title={user?.email}>{user?.name?.[0]?.toUpperCase()}</div>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
      {menuOpen && <div className="drawer-backdrop" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}
