import { useState, useEffect } from 'react';
import { useAuth }         from '../context/AuthContext';
import { useNavigate }     from 'react-router-dom';
import eventService        from '../services/eventService';
import expenseService      from '../services/expenseService';
import StatCard            from '../components/StatCard';
import EmptyState          from '../components/EmptyState';
import {
  formatCurrency,
  getUtilization,
} from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

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

export default function Dashboard() {
  const { user }              = useAuth();
  const navigate              = useNavigate();
  const [events,   setEvents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [evRes, exRes] = await Promise.all([
          eventService.getEvents(),
          expenseService.getExpenses(),
        ]);
        setEvents(evRes.data?.events     || []);
        setExpenses(exRes.data?.expenses || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalBudget   = events.reduce((s, e) => s + (e.totalBudget || 0), 0);
  const totalSpent    = events.reduce((s, e) => s + (e.spentAmount  || 0), 0);
  const pendingCount  = expenses.filter((e) => e.approvalStatus === 'Pending').length;
  const overBudget    = events.filter(
    (e) => e.spentAmount > e.totalBudget
  ).length;

  // ── Chart data — group expenses by category ──────────────────────────────
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
            <h1 className="page-title">
              Good day, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="page-subtitle">
              Here's your financial overview
            </p>
          </div>
          <span className={`badge border text-sm px-4 py-2 ${
            user?.role === 'FinanceAdmin'
              ? 'bg-green-50 text-green-700 border-green-200'
              : user?.role === 'Approver'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-teal-50 text-teal border-teal-200'
          }`}>
            {user?.role === 'FinanceAdmin'
              ? 'Finance Admin'
              : user?.role}
          </span>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Events"
            value={events.length}
            icon="📅"
            subtitle={`${events.filter((e) => e.status === 'active').length} active`}
          />
          <StatCard
            title="Total Budget"
            value={formatCurrency(totalBudget)}
            icon="💰"
            subtitle="Across all events"
          />
          <StatCard
            title="Total Spent"
            value={formatCurrency(totalSpent)}
            icon="💸"
            subtitle={`${getUtilization(totalSpent, totalBudget)}% utilized`}
          />
          <StatCard
            title="Pending Approvals"
            value={pendingCount}
            icon="⏳"
            subtitle="Awaiting review"
            highlight={pendingCount > 0}
          />
        </div>

        {/* ── Over Budget Alert ──────────────────────────────────── */}
        {overBudget > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl
                          px-5 py-4 flex items-center gap-3
                          animate-scaleIn">
            <span className="text-2xl">⚠️</span>
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

        {/* ── Chart + Recent ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Bar chart */}
          <div className="lg:col-span-2 card p-6">
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

          {/* Recent events */}
          <div className="card p-6">
            <h2 className="section-title mb-4">Recent Events</h2>
            {events.length === 0 ? (
              <EmptyState
                icon="📅"
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
                                      text-sm shrink-0">
                        📅
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
        <div className="card p-6">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'View Events',    icon: '📅', path: '/events'   },
              { label: 'View Expenses',  icon: '💸', path: '/expenses' },
              { label: 'Pending Review', icon: '⏳', path: '/expenses?status=Pending' },
              { label: 'Paid Expenses',  icon: '✅', path: '/expenses?status=Paid'    },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 p-4 rounded-xl
                           bg-teal-50 hover:bg-teal-100 border
                           border-teal-100 hover:border-teal-200
                           transition-all text-left group"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm font-semibold text-teal
                                 group-hover:text-teal-700
                                 transition-colors leading-tight">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}