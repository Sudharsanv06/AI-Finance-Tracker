import { useState, useEffect, useCallback } from 'react';
import { useLocation }   from 'react-router-dom';
import { useAuth }       from '../context/AuthContext';
import expenseService    from '../services/expenseService';
import ExpenseTable      from '../components/ExpenseTable';
import ExpenseForm       from '../components/ExpenseForm';
import EmptyState        from '../components/EmptyState';
import { formatCurrency } from '../utils/helpers';

const STATUS_FILTERS = ['All','Pending','Approved','Rejected','Paid'];

export default function Expenses() {
  const { user }                        = useAuth();
  const location                        = useLocation();
  const params                          = new URLSearchParams(location.search);
  const defaultEventId                  = params.get('eventId') || '';
  const defaultStatus                   = params.get('status')  || 'All';

  const [expenses,     setExpenses]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [activeFilter, setActiveFilter] = useState(defaultStatus);
  const [search,       setSearch]       = useState('');

  const userRole  = user?.role || 'Organizer';
  const canSubmit = userRole === 'Organizer' || userRole === 'FinanceAdmin';

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await expenseService.getExpenses(defaultEventId);
      setExpenses(res.data?.expenses || []);
    } catch {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [defaultEventId]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // Filtered list
  const filtered = expenses.filter((e) => {
    const matchStatus = activeFilter === 'All' ||
      e.approvalStatus === activeFilter;
    const q           = search.toLowerCase();
    const matchSearch = !q ||
      e.description?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.eventId?.name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Stats
  const totalAmount   = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingCount  = expenses.filter((e) => e.approvalStatus === 'Pending').length;
  const approvedCount = expenses.filter((e) => e.approvalStatus === 'Approved').length;
  const paidCount     = expenses.filter((e) => e.approvalStatus === 'Paid').length;

  return (
    <div className="page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Expenses</h1>
            <p className="page-subtitle">
              {loading
                ? 'Loading...'
                : `${expenses.length} total expense${expenses.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {canSubmit && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              + Add Expense
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Amount', value: formatCurrency(totalAmount), icon: '💰' },
            { label: 'Pending',      value: pendingCount,                icon: '⏳',
              highlight: pendingCount > 0 },
            { label: 'Approved',     value: approvedCount,               icon: '✅' },
            { label: 'Paid',         value: paidCount,                   icon: '💳' },
          ].map((s) => (
            <div
              key={s.label}
              className={`card p-4 flex items-center gap-3 ${
                s.highlight ? 'border-amber-200 bg-amber-50' : ''
              }`}
            >
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-xs text-teal-400 uppercase
                              tracking-wider">{s.label}</p>
                <p className={`text-lg font-bold font-playfair ${
                  s.highlight ? 'text-amber-600' : 'text-teal'
                }`}>
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 p-1 bg-white border
                          border-teal-100 rounded-xl overflow-x-auto">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold
                            transition-all whitespace-nowrap ${
                  activeFilter === f
                    ? 'bg-teal text-cream shadow-sm'
                    : 'text-teal-500 hover:text-teal'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2
                             -translate-y-1/2 text-teal-300 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="input pl-9"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl
                          px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="card p-8 text-center">
            <div className="spinner mx-auto mb-2 border-teal" />
            <p className="text-sm text-teal-400">Loading expenses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="💸"
            title="No expenses found"
            description={
              canSubmit
                ? 'Submit your first expense for approval.'
                : 'No expenses match your filter.'
            }
            action={
              canSubmit
                ? { label: '+ Add Expense',
                    onClick: () => setShowForm(true) }
                : null
            }
          />
        ) : (
          <ExpenseTable
            expenses={filtered}
            userRole={userRole}
            onRefresh={fetchExpenses}
          />
        )}
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <ExpenseForm
          defaultEventId={defaultEventId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchExpenses(); }}
        />
      )}
    </div>
  );
}