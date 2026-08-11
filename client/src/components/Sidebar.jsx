import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import logoImg from '../assets/adaptive-icon.png';

// ── SVG Icon Components ──────────────────────────────────────────────────────
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const EventsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
  </svg>
);

const ExpensesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11l-4 4m0 0l-4-4m4 4V3M4 17h16" />
  </svg>
);

const IncomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l4-4m0 0l4 4m-4-4v12M4 17h16" />
  </svg>
);

const FamilyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
  </svg>
);

const InvestmentsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const LoansIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="10" width="18" height="11" rx="2" />
    <path strokeLinecap="round" d="M12 2L2 7h20L12 2zM6 10v11M10 10v11M14 10v11M18 10v11" />
  </svg>
);

const BudgetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.168.477-4 1.253" />
  </svg>
);

const GoalsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const BillsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const LINKS = [
  { name: 'Events',      path: '/events',      icon: EventsIcon },
  { name: 'Expenses',    path: '/expenses',    icon: ExpensesIcon },
  { name: 'Income',      path: '/income',      icon: IncomeIcon },
  { name: 'Family',      path: '/family',      icon: FamilyIcon },
  { name: 'Investments', path: '/investments', icon: InvestmentsIcon },
  { name: 'Loans',       path: '/loans',       icon: LoansIcon },
  { name: 'Budget',      path: '/budget',      icon: BudgetIcon },
  { name: 'Goals',       path: '/goals',       icon: GoalsIcon },
  { name: 'Bills',       path: '/bills',       icon: BillsIcon },
];

const ROLE_COLORS = {
  Organizer:    'bg-teal-50 text-teal border-teal-200',
  Approver:     'bg-amber-50 text-amber-700 border-amber-200',
  FinanceAdmin: 'bg-green-50 text-green-700 border-green-200',
};

const ROLE_LABELS = {
  Organizer:    'Organizer',
  Approver:     'Approver',
  FinanceAdmin: 'Finance Admin',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-teal text-cream shadow-teal-sm'
        : 'text-teal hover:bg-teal-50/70'
    }`;

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-cream border-r border-teal-100/60 p-4">
      {/* ── Brand Header ────────────────────────────────────────── */}
      <div 
        onClick={() => { setIsOpen(false); navigate('/dashboard'); }}
        className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-teal-100/55 cursor-pointer hover:opacity-80 active:scale-[0.98] transition-all"
      >
        <img
          src={logoImg}
          alt="Paisa Pulse Logo"
          className="w-10 h-10 rounded-xl object-contain shadow-teal-sm"
        />
        <div>
          <h1 className="text-teal font-extrabold text-lg leading-tight font-playfair">
            Paisa Pulse
          </h1>
          <p className="text-[10px] text-teal-400 font-sans tracking-wide uppercase mt-0.5">
            Financial Manager
          </p>
        </div>
      </div>

      {/* ── Nav Links ───────────────────────────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={navLinkClass}
            >
              <span className="shrink-0"><Icon /></span>
              <span className="font-playfair tracking-wide">{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── User & Logout Footer ────────────────────────────────── */}
      <div className="mt-auto pt-4 border-t border-teal-100/55 flex flex-col gap-3">
        <div 
          onClick={() => { setIsOpen(false); navigate('/profile'); }}
          className="flex items-center gap-3 px-2 py-1.5 rounded-xl cursor-pointer hover:bg-teal-50/80 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-full bg-teal overflow-hidden flex items-center
                          justify-center text-cream text-sm font-bold shrink-0 shadow-teal-sm">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-teal font-playfair truncate leading-tight">
              {user?.name}
            </h2>
            <span className="text-[9px] text-teal-400 font-sans tracking-wide uppercase font-semibold">View Profile</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-2 border-teal-200 text-teal hover:bg-teal-50"
        >
          <LogoutIcon /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile Top Header ───────────────────────────────────── */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-cream border-b border-teal-100/60 px-4 py-3 h-16 w-full shadow-teal-xs">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-xl text-teal hover:bg-teal-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 active:scale-[0.98] transition-all"
        >
          <img src={logoImg} alt="Paisa Pulse Logo" className="w-7 h-7 object-contain" />
          <span className="text-teal font-bold text-base font-playfair">Paisa Pulse</span>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-teal overflow-hidden flex items-center justify-center text-cream text-xs font-bold shrink-0"
        >
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            getInitials(user?.name)
          )}
        </button>
      </div>

      {/* ── Desktop Fixed Sidebar ───────────────────────────────── */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* ── Mobile Drawer Backdrop ──────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── Mobile Drawer Panel ─────────────────────────────────── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 z-50 md:hidden transform transition-transform duration-300 ease-out shadow-teal-lg ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebarContent()}
      </aside>
    </>
  );
}
