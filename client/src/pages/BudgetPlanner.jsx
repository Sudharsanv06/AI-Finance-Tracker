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
  'Food & Dining':  '🍽️',
  'Transportation': '🚗',
  'Shopping':       '🛍️',
  'Entertainment':  '🎭',
  'Health':         '💊',
  'Education':      '📚',
  'Utilities':      '💡',
  'Rent':           '🏠',
  'Groceries':      '🛒',
  'Travel':         '✈️',
  'Personal Care':  '💆',
  'Other':          '📦',
};

// ── Budget Form Modal ─────────────────────────────────────────────────────────
function BudgetModal({ budget, month, year, onClose, onSaved }) {
  const isEdit = !!budget?._id;

  const [category,     setCategory]     = useState(budget?.category     || 'Food & Dining');
  const [monthlyLimit, setMonthlyLimit] = useState(budget?.monthlyLimit || '');
  const [alertAt,      setAlertAt]      = useState(budget?.alertAt      || 80);
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
        month, year,
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
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            ⚠️ {error}
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
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-xl">
            {CATEGORY_ICONS[budget.category]}
          </div>
          <div>
            <h3 className="font-bold text-teal text-sm font-playfair">
              {budget.category}
            </h3>
            {needsAlert && !isOver && (
              <span className="text-[10px] text-amber-600 font-semibold">
                ⚠️ Nearing limit
              </span>
            )}
            {isOver && (
              <span className="text-[10px] text-red-600 font-semibold">
                🚨 Over budget!
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

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
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
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

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
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Total Limit',  value: summary.totalLimit,                                 icon: '💰' },
                { label: 'Total Spent',  value: summary.totalSpent,                                 icon: '💸' },
                { label: 'Remaining',    value: Math.max(0, summary.totalLimit - summary.totalSpent), icon: '✅' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-teal-400 uppercase tracking-wider mb-1">
                    {s.icon} {s.label}
                  </p>
                  <p className="text-lg font-bold text-teal font-playfair">
                    {formatCurrency(s.value)}
                  </p>
                </div>
              ))}
            </div>

            {summary.alerts > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 font-semibold">
                ⚠️ {summary.alerts} budget{summary.alerts > 1 ? 's' : ''} near limit
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
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
          <div className="card p-12 text-center">
            <span className="text-4xl mb-3 block">📊</span>
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