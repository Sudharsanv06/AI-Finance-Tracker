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
  'Emergency Fund': '🛡️',
  'Vacation':       '✈️',
  'Home Purchase':  '🏠',
  'Car Purchase':   '🚗',
  'Education':      '🎓',
  'Wedding':        '💒',
  'Retirement':     '👴',
  'Business':       '🏢',
  'Other':          '🎯',
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
        icon: GOAL_ICONS[category],
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
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            ⚠️ {error}
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
  const [amount,  setAmount]  = useState(goal?.monthlyContribution || '');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0)
      return setError('Valid amount required');

    setLoading(true);
    try {
      const res = await goalService.addContribution(goal._id, parseFloat(amount));
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
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="label">Amount (₹) *</label>
            <input type="number" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000" min="1" className="input" required />
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
function GoalCard({ goal, onEdit, onDelete, onContribute }) {
  const pct       = goal.progressPercent || 0;
  const isComplete = goal.status === 'completed';

  return (
    <div className={`card card-hover p-5 flex flex-col gap-4 ${
      isComplete ? 'border-green-200 bg-green-50/20' : ''
    }`}>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
          isComplete ? 'bg-green-100' : 'bg-teal-50'
        }`}>
          {goal.icon || GOAL_ICONS[goal.category] || '🎯'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-teal text-base font-playfair leading-snug">
              {goal.title}
            </h3>
            {isComplete && (
              <span className="text-lg shrink-0">🎉</span>
            )}
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
        {goal.monthsToGoal !== null && goal.monthsToGoal > 0 && (
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-amber-600 mb-0.5">Months Left</p>
            <p className="font-bold text-amber-700 text-sm">
              {goal.monthsToGoal}
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

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-teal-50">
        {!isComplete && (
          <button onClick={() => onContribute(goal)}
            className="flex-1 btn-primary text-xs py-2">
            + Add Money
          </button>
        )}
        <button onClick={() => onEdit(goal)}
          className="flex-1 btn-secondary text-xs py-2">
          Edit
        </button>
        <button onClick={() => onDelete(goal._id)}
          className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all">
          🗑️
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
    setLoading(true);
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

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

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
              { label: 'Total Target',   value: formatCurrency(summary.totalTarget),   icon: '🎯' },
              { label: 'Total Saved',    value: formatCurrency(summary.totalSaved),    icon: '💰' },
              { label: 'Goals Achieved', value: summary.completed,                     icon: '🏆' },
              { label: 'Monthly Needed', value: formatCurrency(summary.monthlyNeeded), icon: '📅' },
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
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold animate-scaleIn">
            ✅ {successMsg}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-1 p-1 bg-white border border-teal-100 rounded-xl w-fit">
          {['All','active','completed','paused'].map((s) => (
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
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
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
            <span className="text-4xl mb-3 block">🎯</span>
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