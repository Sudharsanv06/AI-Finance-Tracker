import { useState, useEffect, useCallback } from 'react';
import goalService  from '../services/goalService';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency, formatDate } from '../utils/helpers';

const GOAL_CATEGORIES = [
  'Emergency Fund','Vacation','Home Purchase',
  'Car Purchase','Education','Wedding',
  'Retirement','Business','Other',
];

const GOAL_ICONS = {
  'Emergency Fund': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  'Vacation': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'Home Purchase': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  'Car Purchase': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm0 0h5a2 2 0 002-2v-4a2 2 0 00-2-2H9m-4 6H3m14-1H3M13 13V9a2 2 0 012-2h3.5a1.5 1.5 0 011.5 1.5V13a2 2 0 01-2 2H17m-4-1h4m1 3a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  ),
  'Education': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6M4 11v6a1 1 0 001 1h2a1 1 0 001-1v-6" />
    </svg>
  ),
  'Wedding': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  'Retirement': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </svg>
  ),
  'Business': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
    </svg>
  ),
};

// ── Goal Form Modal ───────────────────────────────────────────────────────────
function GoalModal({ goal, onClose, onSaved }) {
  const isEdit = !!goal?._id;

  const [title,               setTitle]               = useState(goal?.title               || '');
  const [category,            setCategory]            = useState(goal?.category            || 'Other');
  const [targetAmount,        setTargetAmount]        = useState(goal?.targetAmount        || '');
  const [currentAmount,       setCurrentAmount]       = useState(goal?.currentAmount       || '');
  const [monthlyContribution, setMonthlyContribution] = useState(goal?.monthlyContribution || '');
  const [deadline,            setDeadline]            = useState(
    goal?.deadline
      ? new Date(goal.deadline).toISOString().split('T')[0]
      : ''
  );
  const [notes,    setNotes]   = useState(goal?.notes   || '');
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');

  // Preview months to goal
  const monthsToGoal =
    targetAmount && monthlyContribution && parseFloat(monthlyContribution) > 0
      ? Math.ceil(
          (parseFloat(targetAmount) - parseFloat(currentAmount || 0)) /
          parseFloat(monthlyContribution)
        )
      : null;

  useEffect(() => {
    if (monthsToGoal && monthsToGoal > 0) {
      const date = new Date();
      date.setMonth(date.getMonth() + monthsToGoal);
      setDeadline(date.toISOString().split('T')[0]);
    }
  }, [monthsToGoal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim())   return setError('Title is required');
    if (!targetAmount)   return setError('Target amount is required');

    setLoading(true);
    try {
      const payload = {
        title: title.trim(), category,
        targetAmount:        parseFloat(targetAmount),
        currentAmount:       parseFloat(currentAmount)       || 0,
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        deadline: deadline || null,
        icon: category,
        notes,
      };
      isEdit
        ? await goalService.updateGoal(goal._id, payload)
        : await goalService.createGoal(payload);
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
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-teal-lg border border-teal-100 p-6 animate-scaleIn max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-teal font-playfair">
            {isEdit ? 'Edit Goal' : 'New Goal'}
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
          <div>
            <label className="label">Goal Category</label>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all ${
                    category === c
                      ? 'border-teal bg-teal-50 text-teal'
                      : 'border-teal-100 text-teal-400 hover:border-teal-200'
                  }`}>
                  <span className="text-xl">{GOAL_ICONS[c]}</span>
                  <span className="text-[9px] font-semibold leading-tight">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Goal Title *</label>
            <input type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Save for Goa trip"
              className="input" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target Amount (₹) *</label>
              <input type="number" value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="100000" min="1" className="input" required />
            </div>
            <div>
              <label className="label">Already Saved (₹)</label>
              <input type="number" value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0" min="0" className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Monthly Contribution (₹)</label>
              <input type="number" value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="5000" min="0" className="input" />
            </div>
            <div>
              <label className="label">Target Date</label>
              <input type="date" value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input" />
            </div>
          </div>

          {/* Preview */}
          {monthsToGoal !== null && monthsToGoal > 0 && (
            <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 animate-scaleIn">
              <p className="text-xs text-teal-400 mb-1">At current contribution rate</p>
              <p className="text-lg font-bold text-teal font-playfair">
                🎯 {monthsToGoal} months to reach goal
              </p>
              <p className="text-xs text-teal-400 mt-0.5">
                Around {new Date(
                  new Date().setMonth(new Date().getMonth() + monthsToGoal)
                ).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} placeholder="Why is this goal important to you?"
              className="input resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <span className="spinner" /> : isEdit ? '✓ Update' : '+ Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Contribute Modal ──────────────────────────────────────────────────────────
function ContributeModal({ goal, onClose, onSaved }) {
  const [amount,  setAmount]  = useState('');
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0]);
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0)
      return setError('Valid amount required');

    setLoading(true);
    try {
      const res = await goalService.addContribution(goal._id, {
        amount: parseFloat(amount),
        date,
        note: note.trim() || 'Contribution added',
      });
      onSaved(res.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-teal/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-teal-lg border border-teal-100 p-6 animate-scaleIn">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-teal font-playfair">
            Add Contribution
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal">
            ✕
          </button>
        </div>

        <div className="bg-teal-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-teal-400">Goal</p>
          <p className="font-bold text-teal text-sm">{goal?.title}</p>
          <p className="text-xs text-teal-400 mt-1">
            Remaining: <strong className="text-teal">
              {formatCurrency(goal?.remainingAmount || 0)}
            </strong>
          </p>
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
          <div>
            <label className="label">Amount (₹) *</label>
            <input type="number" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000" min="1" className="input" required />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input" />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input type="text" value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Added from August savings" className="input" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <span className="spinner" /> : '+ Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, onEdit, onDelete, onContribute, onUpdateStatus }) {
  const pct = goal.targetAmount
    ? Math.min(Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100), 100)
    : 0;

  const monthsToGoal =
    goal.targetAmount && goal.monthlyContribution && parseFloat(goal.monthlyContribution) > 0
      ? Math.ceil(
          (parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount || 0)) /
          parseFloat(goal.monthlyContribution)
        )
      : null;

  const status = goal.status || 'active';
  const isComplete = status === 'completed';

  const statusConfig = {
    active:    { label: 'Active',    cls: 'bg-blue-50 text-blue-600 border border-blue-100' },
    completed: { label: 'Completed', cls: 'bg-green-50 text-green-700 border border-green-100' },
    paused:    { label: 'Paused',    cls: 'bg-amber-50 text-amber-600 border border-amber-100' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-600 border border-red-100' },
  };
  const s = statusConfig[status] || statusConfig.active;

  return (
    <div className={`card card-hover p-5 flex flex-col gap-4 ${
      isComplete ? 'border-green-200 bg-green-50/20' : ''
    }`}>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
          isComplete ? 'bg-green-100' : 'bg-teal-50'
        }`}>
          {GOAL_ICONS[goal.category] || GOAL_ICONS.Other}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-teal text-base font-playfair leading-snug">
              {goal.title}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${s.cls}`}>
                {s.label}
              </span>
              {isComplete && (
                <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>
          <p className="text-xs text-teal-400 mt-0.5">{goal.category}</p>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-teal-400">Progress</span>
          <span className={`font-bold ${isComplete ? 'text-green-600' : 'text-teal'}`}>
            {pct}%
          </span>
        </div>
        <div className="h-3 bg-cream-dark rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isComplete ? 'bg-green-500' : pct >= 75 ? 'bg-teal' : 'bg-amber-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-teal-50 rounded-xl p-3 text-center">
          <p className="text-teal-400 mb-0.5">Saved</p>
          <p className="font-bold text-teal text-sm">
            {formatCurrency(goal.currentAmount || 0)}
          </p>
        </div>
        <div className="bg-teal-50 rounded-xl p-3 text-center">
          <p className="text-teal-400 mb-0.5">Target</p>
          <p className="font-bold text-teal text-sm">
            {formatCurrency(goal.targetAmount)}
          </p>
        </div>
        {goal.monthlyContribution > 0 && (
          <div className="bg-teal-50 rounded-xl p-3 text-center">
            <p className="text-teal-400 mb-0.5">Monthly</p>
            <p className="font-bold text-teal text-sm">
              {formatCurrency(goal.monthlyContribution)}
            </p>
          </div>
        )}
        {monthsToGoal !== null && monthsToGoal > 0 && (
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-amber-600 mb-0.5">Months Left</p>
            <p className="font-bold text-amber-700 text-sm">
              {monthsToGoal}
            </p>
          </div>
        )}
        {goal.deadline && (
          <div className="bg-teal-50 rounded-xl p-3 text-center col-span-2">
            <p className="text-teal-400 mb-0.5">Deadline</p>
            <p className="font-bold text-teal text-sm">
              {formatDate(goal.deadline)}
            </p>
          </div>
        )}
      </div>

      {/* Contributions History */}
      {goal.contributions && goal.contributions.length > 0 && (
        <div className="border-t border-teal-50 pt-3">
          <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider mb-2">
            Contribution History
          </p>
          <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
            {goal.contributions.map((c, i) => (
              <div key={i} className="flex justify-between items-center bg-teal-50/40 rounded-lg p-2 text-[11px]">
                <div className="min-w-0">
                  <p className="text-teal font-semibold leading-tight">
                    {c.note || 'Contribution added'}
                  </p>
                  <p className="text-teal-400 text-[10px] mt-0.5">
                    {new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className="font-bold text-teal shrink-0 ml-2">
                  +{formatCurrency(c.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-teal-50">
        {!isComplete && status === 'active' && (
          <button onClick={() => onContribute(goal)}
            className="flex-1 btn-primary text-xs py-2 whitespace-nowrap">
            + Add Money
          </button>
        )}
        {status === 'active' && (
          <>
            <button onClick={() => onUpdateStatus(goal._id, 'paused')}
              className="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs font-semibold transition-all">
              Pause
            </button>
            <button onClick={() => onUpdateStatus(goal._id, 'cancelled')}
              className="px-2.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all">
              Cancel
            </button>
          </>
        )}
        {status === 'paused' && (
          <>
            <button onClick={() => onUpdateStatus(goal._id, 'active')}
              className="px-2.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition-all">
              Activate
            </button>
            <button onClick={() => onUpdateStatus(goal._id, 'cancelled')}
              className="px-2.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all">
              Cancel
            </button>
          </>
        )}
        {status === 'cancelled' && (
          <button onClick={() => onUpdateStatus(goal._id, 'active')}
            className="flex-1 btn-primary text-xs py-2">
            Restore / Activate
          </button>
        )}

        <button onClick={() => onEdit(goal)}
          className="btn-secondary text-xs px-3 py-2">
          Edit
        </button>
        <button onClick={() => onDelete(goal._id)}
          className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all flex items-center justify-center">
          <svg className="w-4 h-4 text-red-500 hover:text-red-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Goals() {
  const [goals,         setGoals]         = useState([]);
  const [summary,       setSummary]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [showContribute,setShowContribute]= useState(false);
  const [editingGoal,   setEditingGoal]   = useState(null);
  const [contributeGoal,setContributeGoal]= useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [filterStatus,  setFilterStatus]  = useState('All');
  const [successMsg,    setSuccessMsg]    = useState('');
  const [error,         setError]         = useState('');

  const fetchGoals = useCallback(async () => {
    Promise.resolve().then(() => {
      setLoading(true);
      setError('');
    });
    try {
      const res = await goalService.getGoals(
        filterStatus !== 'All' ? filterStatus : ''
      );
      setGoals(res.data?.goals || []);
      setSummary({
        totalTarget:   res.data?.totalTarget   || 0,
        totalSaved:    res.data?.totalSaved    || 0,
        completed:     res.data?.completed     || 0,
        monthlyNeeded: res.data?.monthlyNeeded || 0,
      });
    } catch {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchGoals();
    });
  }, [fetchGoals]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await goalService.deleteGoal(deleteTarget);
      fetchGoals();
    } catch {
      setError('Failed to delete');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleContributeSaved = (msg) => {
    setShowContribute(false);
    setContributeGoal(null);
    setSuccessMsg(msg);
    fetchGoals();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleUpdateStatus = async (goalId, newStatus) => {
    try {
      await goalService.updateGoal(goalId, { status: newStatus });
      fetchGoals();
    } catch {
      setError('Failed to update status');
    }
  };

  return (
    <div className="page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Financial Goals</h1>
            <p className="page-subtitle">Save towards your dreams</p>
          </div>
          <button onClick={() => { setEditingGoal(null); setShowModal(true); }}
            className="btn-primary">
            + New Goal
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Target',
                value: formatCurrency(summary.totalTarget),
                icon: (
                  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                )
              },
              {
                label: 'Total Saved',
                value: formatCurrency(summary.totalSaved),
                icon: (
                  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a3 3 0 00-3-3H3m18 3v3a3 3 0 01-3 3H3M21 12H18a2 2 0 110-4h3" />
                  </svg>
                )
              },
              {
                label: 'Goals Achieved',
                value: summary.completed,
                icon: (
                  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              },
              {
                label: 'Monthly Needed',
                value: formatCurrency(summary.monthlyNeeded),
                icon: (
                  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                )
              },
            ].map((s) => (
              <div key={s.label} className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-xs text-teal-400 uppercase tracking-wider font-semibold">
                    {s.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-teal font-playfair">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold animate-scaleIn flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-1 p-1 bg-white border border-teal-100 rounded-xl w-fit">
          {['All','active','completed','paused','cancelled'].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filterStatus === s ? 'bg-teal text-cream' : 'text-teal-500 hover:text-teal'
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Goals grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="card p-5 h-56 animate-pulse bg-teal-50" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="card p-12 text-center">
            <svg className="w-12 h-12 text-teal-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <h3 className="text-lg font-bold text-teal font-playfair mb-2">
              No goals yet
            </h3>
            <p className="text-sm text-teal-400 mb-4">
              Set a financial goal and track your progress
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              + Create First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onEdit={(g) => { setEditingGoal(g); setShowModal(true); }}
                onDelete={setDeleteTarget}
                onContribute={(g) => { setContributeGoal(g); setShowContribute(true); }}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <GoalModal
          goal={editingGoal}
          onClose={() => { setShowModal(false); setEditingGoal(null); }}
          onSaved={() => { setShowModal(false); setEditingGoal(null); fetchGoals(); }}
        />
      )}

      {showContribute && contributeGoal && (
        <ContributeModal
          goal={contributeGoal}
          onClose={() => { setShowContribute(false); setContributeGoal(null); }}
          onSaved={handleContributeSaved}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Goal"
        message="This goal and all progress will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}