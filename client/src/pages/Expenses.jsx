import { useState, useEffect, useCallback } from 'react';
import { useLocation }   from 'react-router-dom';
import { useAuth }       from '../context/AuthContext';
import api               from '../services/api';
import ExpenseTable      from '../components/ExpenseTable';
import ExpenseForm       from '../components/ExpenseForm';
import EmptyState        from '../components/EmptyState';
import Pagination        from '../components/Pagination';
import { formatCurrency } from '../utils/helpers';

const STATUS_FILTERS = ['All','Pending','Approved','Rejected','Paid'];
const ITEMS_PER_PAGE = 10;

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
  const [currentPage,  setCurrentPage]  = useState(1);
  const [pagination,   setPagination]   = useState(null);

  const userRole  = user?.role || 'Organizer';
  const canSubmit = userRole === 'Organizer' || userRole === 'FinanceAdmin';

  const fetchExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const url = defaultEventId
        ? `/expenses?eventId=${defaultEventId}&page=${page}&limit=${ITEMS_PER_PAGE}`
        : `/expenses?page=${page}&limit=${ITEMS_PER_PAGE}`;
      const res = await api.get(url);
      setExpenses(res.data.data?.expenses || []);
      setPagination(res.data.data?.pagination || null);
      setCurrentPage(page);
    } catch {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [defaultEventId]);

  useEffect(() => { fetchExpenses(1); }, [fetchExpenses]);

  // Filtered list (frontend filtering on current page)
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

  // Stats (based on current page expenses only)
  const totalAmount   = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingCount  = expenses.filter((e) => e.approvalStatus === 'Pending').length;
  const approvedCount = expenses.filter((e) => e.approvalStatus === 'Approved').length;
  const paidCount     = expenses.filter((e) => e.approvalStatus === 'Paid').length;

  const handlePageChange = (page) => {
    fetchExpenses(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
                : `${pagination?.total || expenses.length} total expense${(pagination?.total || expenses.length) !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Export CSV button — uses axios */}
            <button
              onClick={async () => {
                try {
                  const res = await api.get('/expenses/export/csv', {
                    responseType: 'blob',
                  });
                  const url  = URL.createObjectURL(new Blob([res.data]));
                  const a    = document.createElement('a');
                  a.href     = url;
                  a.download = 'eventfi-expenses.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch {
                  alert('Export failed. Please try again.');
                }
              }}
              className="btn-secondary flex items-center gap-2"
            >
              📥 Export CSV
            </button>

            {canSubmit && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                + Add Expense
              </button>
            )}
          </div>
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
          <>
            <ExpenseTable
              expenses={filtered}
              userRole={userRole}
              onRefresh={() => fetchExpenses(currentPage)}
            />
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <ExpenseForm
          defaultEventId={defaultEventId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchExpenses(currentPage); }}
        />
      )}
    </div>
  );
}