import { useState, useEffect, useCallback } from 'react';
import budgetService from '../services/budgetService';
import ConfirmModal  from '../components/ConfirmModal';
import { formatCurrency } from '../utils/helpers';

const CATEGORIES = [
  'Food & Dining','Transportation','Shopping',
  'Entertainment','Health','Education',
  'Utilities','Rent','Groceries',
  'Travel','Personal Care','Other',
];

const CATEGORY_ICONS = {
  'Food & Dining': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5v14M7 5v14" />
    </svg>
  ),
  'Transportation': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm0 0h5a2 2 0 002-2v-4a2 2 0 00-2-2H9m-4 6H3m14-1H3M13 13V9a2 2 0 012-2h3.5a1.5 1.5 0 011.5 1.5V13a2 2 0 01-2 2H17m-4-1h4m1 3a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  ),
  'Shopping': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  'Entertainment': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'Health': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  'Education': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6M4 11v6a1 1 0 001 1h2a1 1 0 001-1v-6" />
    </svg>
  ),
  'Utilities': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'Rent': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  'Groceries': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  'Travel': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  'Personal Care': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  'Other': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </svg>
  ),
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];


const getCategoryColor = (cat) => {
  const map = {
    'Food & Dining':  'bg-blue-500',
    'Transportation': 'bg-amber-500',
    'Shopping':       'bg-pink-500',
    'Entertainment':  'bg-purple-500',
    'Health':         'bg-red-500',
    'Education':      'bg-indigo-500',
    'Utilities':      'bg-orange-500',
    'Rent':           'bg-cyan-500',
    'Groceries':      'bg-green-500',
    'Travel':         'bg-sky-500',
    'Personal Care':  'bg-rose-500',
    'Other':          'bg-slate-400',
  };
  return map[cat] || 'bg-teal';
};

const WalletIcon = () => (
  <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a3 3 0 00-3-3H3m18 3v3a3 3 0 01-3 3H3M21 12H18a2 2 0 110-4h3" />
  </svg>
);

const ReceiptIcon = () => (
  <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2-2 4 4m0-7v.01M12 21a9 9 0 110-18 9 9 0 010 18z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ── Budget Form Modal ─────────────────────────────────────────────────────────
function BudgetModal({ budget, month: initialMonth, year: initialYear, onClose, onSaved }) {
  const isEdit = !!budget?._id;

  const [category,     setCategory]     = useState(budget?.category     || 'Food & Dining');
  const [monthlyLimit, setMonthlyLimit] = useState(budget?.monthlyLimit || '');
  const [alertAt,      setAlertAt]      = useState(budget?.alertAt      || 80);
  const [selectedMonth, setSelectedMonth] = useState(budget?.month || initialMonth);
  const [selectedYear,  setSelectedYear]  = useState(budget?.year  || initialYear);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!monthlyLimit) return setError('Monthly limit is required');

    setLoading(true);
    try {
      const payload = {
        category,
        monthlyLimit: parseFloat(monthlyLimit),
        alertAt: parseInt(alertAt),
        month: selectedMonth,
        year: selectedYear,
      };
      isEdit
        ? await budgetService.updateBudget(budget._id, payload)
        : await budgetService.createBudget(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-teal/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-teal-lg border border-teal-100 p-6 animate-scaleIn">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-teal font-playfair">
            {isEdit ? 'Edit Budget' : 'Set Budget'}
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Category */}
          {!isEdit && (
            <div>
              <label className="label">Category *</label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all ${
                      category === c
                        ? 'border-teal bg-teal-50 text-teal'
                        : 'border-teal-100 text-teal-400 hover:border-teal-200'
                    }`}>
                    <span className="text-xl">{CATEGORY_ICONS[c]}</span>
                    <span className="text-[9px] font-semibold leading-tight">{c}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Monthly Limit (₹) *</label>
            <input type="number" value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              placeholder="10000" min="1" className="input" required />
          </div>

          {/* Month & Year Selection */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Month</label>
                <select value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="input">
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="input">
                  {[2023, 2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="label">Alert When Spent (%)</label>
            <div className="flex items-center gap-4">
              <input type="range" value={alertAt} min="50" max="100" step="5"
                onChange={(e) => setAlertAt(e.target.value)}
                className="flex-1 accent-teal" />
              <span className="text-sm font-bold text-teal w-12 text-right">
                {alertAt}%
              </span>
            </div>
            <p className="text-xs text-teal-400 mt-1">
              You'll be alerted when {alertAt}% of budget is spent
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <span className="spinner" /> : isEdit ? '✓ Update' : '+ Set Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Budget Card ───────────────────────────────────────────────────────────────
function BudgetCard({ budget, onEdit, onDelete }) {
  const pct      = budget.utilization || 0;
  const isOver   = budget.isOver;
  const needsAlert = budget.needsAlert;

  const barColor =
    isOver        ? 'bg-red-500' :
    needsAlert    ? 'bg-amber-500' :
    pct >= 50     ? 'bg-teal' :
                    'bg-green-500';

  const borderColor =
    isOver     ? 'border-red-200 bg-red-50/20' :
    needsAlert ? 'border-amber-200 bg-amber-50/20' :
                 '';

  return (
    <div className={`card card-hover p-5 ${borderColor}`}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${getCategoryColor(budget.category)}`} />
          <div>
            <h3 className="font-bold text-teal text-sm font-playfair">
              {budget.category}
            </h3>
            {needsAlert && !isOver && (
              <span className="text-[10px] text-amber-600 font-semibold">
                Nearing limit
              </span>
            )}
            {isOver && (
              <span className="text-[10px] text-red-600 font-semibold">
                Over budget!
              </span>
            )}
          </div>
        </div>
        <span className={`text-lg font-bold font-playfair ${
          isOver ? 'text-red-600' : needsAlert ? 'text-amber-600' : 'text-teal'
        }`}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-cream-dark rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs mb-4">
        <div className="bg-teal-50 rounded-lg p-2 text-center">
          <p className="text-teal-400 mb-0.5">Limit</p>
          <p className="font-bold text-teal">
            {formatCurrency(budget.monthlyLimit)}
          </p>
        </div>
        <div className="bg-teal-50 rounded-lg p-2 text-center">
          <p className="text-teal-400 mb-0.5">Spent</p>
          <p className={`font-bold ${isOver ? 'text-red-600' : 'text-teal'}`}>
            {formatCurrency(budget.spent || 0)}
          </p>
        </div>
        <div className={`rounded-lg p-2 text-center ${
          isOver ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <p className="text-teal-400 mb-0.5">Left</p>
          <p className={`font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
            {isOver
              ? `-${formatCurrency(budget.spent - budget.monthlyLimit)}`
              : formatCurrency(budget.remaining)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-teal-50">
        <button onClick={() => onEdit(budget)}
          className="flex-1 btn-secondary text-xs py-1.5">
          Edit Limit
        </button>
        <button onClick={() => onDelete(budget._id)}
          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold">
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BudgetPlanner() {
  const now = new Date();

  const [budgets,       setBudgets]       = useState([]);
  const [summary,       setSummary]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [error,         setError]         = useState('');



  const fetchBudgets = useCallback(async () => {
    Promise.resolve().then(() => {
      setLoading(true);
      setError('');
    });
    try {
      const res = await budgetService.getBudgets(selectedMonth, selectedYear);
      setBudgets(res.data?.budgets    || []);
      setSummary({
        totalLimit: res.data?.totalLimit || 0,
        totalSpent: res.data?.totalSpent || 0,
        alerts:     res.data?.alerts     || 0,
      });
    } catch {
      setError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, setLoading, setBudgets, setSummary, setError]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchBudgets();
    });
  }, [fetchBudgets]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await budgetService.deleteBudget(deleteTarget);
      fetchBudgets();
    } catch {
      setError('Failed to delete');
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalPct = summary?.totalLimit
    ? Math.min(
        Math.round((summary.totalSpent / summary.totalLimit) * 100), 100
      )
    : 0;

  return (
    <div className="page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Budget Planner</h1>
            <p className="page-subtitle">Set and track monthly spending limits</p>
          </div>
          <button onClick={() => { setEditingBudget(null); setShowModal(true); }}
            className="btn-primary">
            + Set Budget
          </button>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-3">
          <select value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="input w-auto">
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input w-auto">
            {[2023, 2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="text-sm text-teal-400">
            {budgets.length} budget{budgets.length !== 1 ? 's' : ''} set
          </span>
        </div>

        {/* Overall summary */}
        {summary && budgets.length > 0 && (
          <div className={`card p-6 ${
            totalPct >= 90 ? 'border-red-200 bg-red-50/20' :
            totalPct >= 70 ? 'border-amber-200 bg-amber-50/20' : ''
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Overall Budget</h2>
              <span className={`text-2xl font-bold font-playfair ${
                totalPct >= 90 ? 'text-red-600' :
                totalPct >= 70 ? 'text-amber-600' : 'text-teal'
              }`}>
                {totalPct}%
              </span>
            </div>
            <div className="h-4 bg-cream-dark rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  totalPct >= 90 ? 'bg-red-500' :
                  totalPct >= 70 ? 'bg-amber-500' : 'bg-teal'
                }`}
                style={{ width: `${totalPct}%` }}
              />
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 text-center">
              {[
                { label: 'Total Limit',  value: summary.totalLimit,                                 icon: <WalletIcon /> },
                { label: 'Total Spent',  value: summary.totalSpent,                                 icon: <ReceiptIcon /> },
                { label: 'Remaining',    value: Math.max(0, summary.totalLimit - summary.totalSpent), icon: <CheckIcon /> },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-teal-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5 truncate">
                    {s.icon} <span>{s.label}</span>
                  </p>
                  <p className="text-sm xs:text-base sm:text-lg font-bold text-teal font-playfair truncate" title={String(formatCurrency(s.value))}>
                    {formatCurrency(s.value)}
                  </p>
                </div>
              ))}
            </div>

            {summary.alerts > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 text-teal shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                </svg>
                <span>{summary.alerts} budget{summary.alerts > 1 ? 's' : ''} near limit</span>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Budget grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="card p-5 h-48 animate-pulse bg-teal-50" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center">
            <svg className="w-12 h-12 text-teal-300 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <h3 className="text-lg font-bold text-teal font-playfair mb-2">
              No budgets set for {MONTHS[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-sm text-teal-400 mb-4">
              Set spending limits for each category
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              + Set Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget._id}
                budget={budget}
                onEdit={(b) => { setEditingBudget(b); setShowModal(true); }}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <BudgetModal
          budget={editingBudget}
          month={selectedMonth}
          year={selectedYear}
          onClose={() => { setShowModal(false); setEditingBudget(null); }}
          onSaved={() => { setShowModal(false); setEditingBudget(null); fetchBudgets(); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Budget"
        message="This budget will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}