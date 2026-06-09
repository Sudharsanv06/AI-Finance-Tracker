import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

const ROLE_COLORS = {
  Organizer:    'bg-teal-100 text-teal-700 border-teal-200',
  Approver:     'bg-amber-100 text-amber-700 border-amber-200',
  FinanceAdmin: 'bg-green-100 text-green-700 border-green-200',
};

const ROLE_LABELS = {
  Organizer:    'Organizer',
  Approver:     'Approver',
  FinanceAdmin: 'Finance Admin',
};

export default function Navbar() {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-teal text-cream shadow-teal-sm'
        : 'text-teal hover:bg-teal-50'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-cream border-b border-teal-100 shadow-teal-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
              <span className="text-cream text-sm font-bold
                               font-playfair">E</span>
            </div>
            <span className="text-teal font-bold text-lg font-playfair
                             hidden sm:block">
              EventFi
            </span>
          </div>

          {/* ── Desktop Nav Links ────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/events" className={navLinkClass}>
              Events
            </NavLink>
            <NavLink to="/expenses" className={navLinkClass}>
              Expenses
            </NavLink>
          </div>

          {/* ── User Info + Logout ───────────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Role badge */}
            <span className={`badge border text-xs
                             ${ROLE_COLORS[user?.role] || ''}`}>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>

            {/* Avatar + name — clickable to profile */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-teal flex items-center
                              justify-center text-cream text-xs font-bold">
                {getInitials(user?.name)}
              </div>
              <span className="text-sm font-semibold text-teal
                               max-w-[120px] truncate">
                {user?.name}
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Logout
            </button>
          </div>

          {/* ── Mobile Menu Button ───────────────────────────────── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-teal
                       hover:bg-teal-50 transition-colors"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                      strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Mobile Menu ──────────────────────────────────────────── */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 animate-slideUp">
            <NavLink to="/dashboard"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/events"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}>
              Events
            </NavLink>
            <NavLink to="/expenses"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}>
              Expenses
            </NavLink>

            <div className="divider" />

            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-teal flex
                                items-center justify-center
                                text-cream text-xs font-bold">
                  {getInitials(user?.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-teal">
                    {user?.name}
                  </p>
                  <p className="text-xs text-teal-400">
                    {ROLE_LABELS[user?.role]}
                  </p>
                </div>
              </div>
              <button onClick={handleLogout}
                      className="btn-secondary text-xs px-3 py-1.5">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}