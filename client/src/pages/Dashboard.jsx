import { useState, useEffect, useCallback } from 'react';
import { useAuth }         from '../context/AuthContext';
import { useNavigate }     from 'react-router-dom';
import eventService        from '../services/eventService';
import expenseService      from '../services/expenseService';
import billService         from '../services/billService';
import api                 from '../services/api';
import StatCard            from '../components/StatCard';
import EmptyState          from '../components/EmptyState';
import {
  formatCurrency,
  getUtilization,
} from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const CalendarIcon = ({ className = "w-5 h-5 text-teal" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
  </svg>
);

const WalletIcon = ({ className = "w-5 h-5 text-teal" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a3 3 0 00-3-3H3m18 3v3a3 3 0 01-3 3H3M21 12H18a2 2 0 110-4h3" />
  </svg>
);

const ReceiptIcon = ({ className = "w-5 h-5 text-teal" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2-2 4 4m0-7v.01M12 21a9 9 0 110-18 9 9 0 010 18z" />
  </svg>
);

const ClockIcon = ({ className = "w-5 h-5 text-teal" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" d="M12 6v6l4 2" />
  </svg>
);

const WarningIcon = ({ className = "w-6 h-6 text-teal" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const BellIcon = ({ className = "w-6 h-6 text-teal" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const BoltIcon = ({ className = "w-5 h-5 text-teal" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5 text-teal" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-teal-100 rounded-xl
                    px-4 py-3 shadow-teal-md">
      <p className="text-xs text-teal-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-teal">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

const PIE_COLORS = [
  '#004643', '#f9bc60', '#e16162', '#00b4d8',
  '#7209b7', '#4caf50', '#ffb703', '#fb8500', '#d62828'
];

export default function Dashboard() {
  const { user }              = useAuth();
  const navigate              = useNavigate();
  const [events,   setEvents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [bills,    setBills]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  // AI Quick-Add state
  const [aiInput,   setAiInput]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState('');
  const [aiSuccess, setAiSuccess] = useState('');

  const fetchData = useCallback(async () => {
    Promise.resolve().then(() => {
      setLoading(true);
    });
    try {
      const [evRes, exRes, billRes] = await Promise.all([
        eventService.getEvents(),
        expenseService.getExpenses(),
        billService.getBills(),
      ]);
      setEvents(evRes.data?.events     || []);
      setExpenses(exRes.data?.expenses || []);
      setBills(billRes.data?.bills     || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchData();
    });
  }, [fetchData]);

  // AI Quick Add Handler
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    setAiError('');
    setAiSuccess('');

    const text = aiInput.trim();
    if (!text) return;

    const amountMatch = text.match(/\b\d+\b(?!.*\b\d+\b)/);
    if (!amountMatch) {
      setAiError('Please include an amount (e.g. "Catering 500")');
      return;
    }

    const amount = parseFloat(amountMatch[0]);
    if (amount <= 0 || isNaN(amount)) {
      setAiError('Please enter a valid expense amount');
      return;
    }

    const description = text.replace(amountMatch[0], '').replace(/\s+/g, ' ').trim();
    if (!description) {
      setAiError('Please enter a description for the expense');
      return;
    }

    setAiLoading(true);
    try {
      const catRes = await api.post('/ai/categorize', { description });
      const category = catRes.data?.data?.category || 'Others';

      const expenseRes = await api.post('/expenses', {
        description,
        amount,
        category,
        paymentMethod: 'Cash',
        date: new Date(),
        approvalStatus: 'Approved',
      });

      if (expenseRes.data?.success) {
        setAiSuccess(`Added "${description}" (₹${amount.toLocaleString('en-IN')}) under "${category}" successfully! 🎉`);
        setAiInput('');
        fetchData();
      } else {
        setAiError(expenseRes.data?.message || 'Failed to save transaction');
      }
    } catch (err) {
      setAiError(err.response?.data?.message || 'Failed to process AI quick-add');
    } finally {
      setAiLoading(false);
    }
  };

  // Stats
  const totalBudget   = events.reduce((s, e) => s + (e.totalBudget || 0), 0);
  const totalSpent    = events.reduce((s, e) => s + (e.spentAmount  || 0), 0);
  const pendingCount  = expenses.filter((e) => e.approvalStatus === 'Pending').length;
  const overBudget    = events.filter(
    (e) => e.spentAmount > e.totalBudget
  ).length;

  // Upcoming bills alerts (due in next 3 days and unpaid)
  const upcomingBills = bills.filter((b) => {
    return !b.isPaid && b.daysUntilDue !== undefined && b.daysUntilDue >= 0 && b.daysUntilDue <= 3;
  });

  // Chart data — group expenses by category
  const categoryMap = {};
  expenses.forEach((ex) => {
    if (ex.approvalStatus === 'Approved' || ex.approvalStatus === 'Paid') {
      categoryMap[ex.category] = (categoryMap[ex.category] || 0) + ex.amount;
    }
  });
  const chartData = Object.entries(categoryMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  if (loading) {
    return (
      <div className="page">
        <div className="page-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => (
              <div
                key={i}
                className="card p-5 h-28 animate-pulse bg-teal-50"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-container">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title flex items-center gap-2">
              Good day, {user?.name?.split(' ')[0]}
            </h1>
            <p className="page-subtitle">
              Here's your financial overview
            </p>
          </div>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Events"
            value={events.length}
            icon={<CalendarIcon className="w-5 h-5 text-teal" />}
            subtitle={`${events.filter((e) => e.status === 'active').length} active`}
          />
          <StatCard
            title="Total Budget"
            value={formatCurrency(totalBudget)}
            icon={<WalletIcon className="w-5 h-5 text-teal" />}
            subtitle="Across all events"
          />
          <StatCard
            title="Total Spent"
            value={formatCurrency(totalSpent)}
            icon={<ReceiptIcon className="w-5 h-5 text-teal" />}
            subtitle={`${getUtilization(totalSpent, totalBudget)}% utilized`}
          />
          <StatCard
            title="Pending Approvals"
            value={pendingCount}
            icon={<ClockIcon className="w-5 h-5 text-teal-600" />}
            subtitle="Awaiting review"
            highlight={pendingCount > 0}
          />
        </div>

        {/* ── Over Budget Alert ──────────────────────────────────── */}
        {overBudget > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl
                          px-5 py-4 flex items-center gap-3 mt-4
                          animate-scaleIn">
            <WarningIcon className="w-6 h-6 text-teal shrink-0" />
            <div>
              <p className="font-bold text-red-700 text-sm">
                {overBudget} event{overBudget > 1 ? 's' : ''} over budget
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                Review and adjust budgets or expenses immediately
              </p>
            </div>
            <button
              onClick={() => navigate('/events')}
              className="ml-auto btn-danger text-xs py-2 px-4"
            >
              View Events
            </button>
          </div>
        )}

        {/* ── Idea 4: Upcoming Bills Alert Banner ─────────────────────── */}
        {upcomingBills.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl
                          px-5 py-4 flex flex-col gap-2 mt-4
                          animate-scaleIn">
            <div className="flex items-center gap-3">
              <BellIcon className="w-6 h-6 text-teal shrink-0" />
              <div>
                <p className="font-bold text-amber-800 text-sm">
                  {upcomingBills.length} Bill Reminder{upcomingBills.length > 1 ? 's' : ''} Due Soon!
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Keep your bills paid to avoid late fees.
                </p>
              </div>
              <button
                onClick={() => navigate('/bills')}
                className="ml-auto btn-secondary text-xs py-2 px-4 border-amber-300 text-amber-700 bg-amber-100/50 hover:bg-amber-100"
              >
                Manage Bills
              </button>
            </div>
            <ul className="text-xs text-amber-700 pl-9 list-disc space-y-1">
              {upcomingBills.slice(0, 3).map((bill) => (
                <li key={bill._id}>
                  <strong>{bill.title}</strong>: ₹{bill.amount.toLocaleString('en-IN')} (Due in {bill.daysUntilDue} days)
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Idea 2: AI Quick-Add Widget ────────────────────────── */}
        <div className="card p-6 bg-teal-50 border border-teal-100 mt-6 shadow-teal-sm">
          <div className="flex items-center gap-2 mb-2">
            <BoltIcon className="w-5 h-5 text-teal" />
            <h2 className="section-title text-teal">AI Quick-Add Transaction</h2>
          </div>
          <p className="text-xs text-teal-600 mb-4">
            Type what you spent on, followed by the amount (e.g. <strong>"DJ booking 1500"</strong> or <strong>"Office snacks 500"</strong>). AI will automatically predict the category!
          </p>
          <form onSubmit={handleQuickAdd} className="flex gap-3">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="e.g. Catering for team meeting 1200"
              className="input flex-1 bg-white border-teal-200 focus:border-teal text-teal-900"
              disabled={aiLoading}
            />
            <button
              type="submit"
              disabled={aiLoading || !aiInput.trim()}
              className="btn-primary px-6 shrink-0"
            >
              {aiLoading ? <span className="spinner" /> : 'Log Instantly'}
            </button>
          </form>
          {aiError && (
            <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{aiError}</span>
            </p>
          )}
          {aiSuccess && (
            <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{aiSuccess}</span>
            </p>
          )}
        </div>

        {/* ── Chart + Recent ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">

          {/* Bar chart */}
          <div className="card p-6 col-span-1">
            <h2 className="section-title mb-4">
              Spending by Category
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                  barCategoryGap="35%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E5E0D5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#5a8a87', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#5a8a87', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                    }
                    width={48}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#004643', opacity: 0.05 }} />
                  <Bar
                    dataKey="amount"
                    fill="#004643"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center
                              text-teal-300 text-sm">
                No approved expenses yet
              </div>
            )}
          </div>

          {/* ── Idea 3: Doughnut Chart ────────────────────────────── */}
          <div className="card p-6 col-span-1">
            <h2 className="section-title mb-4">Expense Split</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-teal-300 text-sm">
                No approved expenses yet
              </div>
            )}
          </div>

          {/* Recent events */}
          <div className="card p-6 col-span-1">
            <h2 className="section-title mb-4">Recent Events</h2>
            {events.length === 0 ? (
              <EmptyState
                icon={<CalendarIcon className="w-6 h-6 text-teal" />}
                title="No events yet"
                description="Create your first event"
                action={{
                  label:   '+ New Event',
                  onClick: () => navigate('/events'),
                }}
              />
            ) : (
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => {
                  const util = getUtilization(
                    event.spentAmount,
                    event.totalBudget
                  );
                  return (
                    <div
                      key={event._id}
                      className="flex items-center gap-3
                                 p-3 rounded-xl hover:bg-teal-50
                                 transition-colors cursor-pointer"
                      onClick={() => navigate('/events')}
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-50
                                      flex items-center justify-center
                                      shrink-0">
                        <CalendarIcon className="w-4 h-4 text-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-teal
                                       truncate">
                          {event.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex-1 h-1.5 bg-cream-dark
                                          rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                util >= 90
                                  ? 'bg-red-500'
                                  : util >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-teal'
                              }`}
                              style={{ width: `${Math.min(util, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-teal-400 shrink-0">
                            {util}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {events.length > 5 && (
                  <button
                    onClick={() => navigate('/events')}
                    className="w-full text-xs text-teal-400
                               hover:text-teal py-2 transition-colors"
                  >
                    View all {events.length} events →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Actions ──────────────────────────────────────── */}
        <div className="card p-6 mt-6">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'View Events',    icon: CalendarIcon, path: '/events'   },
              { label: 'View Expenses',  icon: ReceiptIcon,  path: '/expenses' },
              { label: 'Pending Review', icon: ClockIcon,    path: '/expenses?status=Pending' },
              { label: 'Paid Expenses',  icon: CheckIcon,    path: '/expenses?status=Paid'    },
            ].map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-3 p-4 rounded-xl
                             bg-teal-50 hover:bg-teal-100 border
                             border-teal-100 hover:border-teal-200
                             transition-all text-left group"
                >
                  <span className="text-xl shrink-0"><ActionIcon className="w-5 h-5 text-teal" /></span>
                  <span className="text-sm font-semibold text-teal
                                   group-hover:text-teal-700
                                   transition-colors leading-tight">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}