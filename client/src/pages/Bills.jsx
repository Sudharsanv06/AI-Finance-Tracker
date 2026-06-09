import { useState, useEffect, useCallback } from 'react';
import billService  from '../services/billService';
import ConfirmModal from '../components/ConfirmModal';
import { formatCurrency } from '../utils/helpers';

const BILL_CATEGORIES = [
  'Rent','Electricity','Water','Internet',
  'Phone','Insurance','Subscription',
  'EMI','Gas','Credit Card','Other',
];

const CATEGORY_ICONS = {
  'Rent':         '🏠',
  'Electricity':  '💡',
  'Water':        '💧',
  'Internet':     '📶',
  'Phone':        '📱',
  'Insurance':    '🛡️',
  'Subscription': '📺',
  'EMI':          '💳',
  'Gas':          '🔥',
  'Credit Card':  '💰',
  'Other':        '📄',
};

// ── Bill Form Modal ───────────────────────────────────────────────────────────
function BillModal({ bill, onClose, onSaved }) {
  const isEdit = !!bill?._id;

  const [title,       setTitle]       = useState(bill?.title       || '');
  const [amount,      setAmount]      = useState(bill?.amount      || '');
  const [category,    setCategory]    = useState(bill?.category    || 'Other');
  const [dueDate,     setDueDate]     = useState(bill?.dueDate     || 1);
  const [isRecurring, setIsRecurring] = useState(bill?.isRecurring !== false);
  const [frequency,   setFrequency]   = useState(bill?.frequency   || 'monthly');
  const [autoPay,     setAutoPay]     = useState(bill?.autoPay     || false);
  const [notes,       setNotes]       = useState(bill?.notes       || '');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) return setError('Title is required');
    if (!amount)       return setError('Amount is required');

    setLoading(true);
    try {
      const payload = {
        title: title.trim(), amount: parseFloat(amount),
        category, dueDate: parseInt(dueDate),
        isRecurring, frequency, autoPay, notes,
      };
      isEdit
        ? await billService.updateBill(bill._id, payload)
        : await billService.createBill(payload);
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
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-teal-lg border border-teal-100 p-6 animate-scaleIn max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-teal font-playfair">
            {isEdit ? 'Edit Bill' : 'Add Bill'}
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
            <label className="label">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {BILL_CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all ${
                    category === c
                      ? 'border-teal bg-teal-50 text-teal'
                      : 'border-teal-100 text-teal-400 hover:border-teal-200'
                  }`}>
                  <span className="text-lg">{CATEGORY_ICONS[c]}</span>
                  <span className="text-[9px] font-semibold leading-tight">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Bill Title *</label>
            <input type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BSNL Broadband"
              className="input" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="999" min="1" className="input" required />
            </div>
            <div>
              <label className="label">Due on Day</label>
              <select value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}{
                    d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'
                  } of month</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {['monthly','quarterly','yearly'].map((f) => (
                <button key={f} type="button" onClick={() => setFrequency(f)}
                  className={`py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${
                    frequency === f
                      ? 'border-teal bg-teal-50 text-teal'
                      : 'border-teal-100 text-teal-400 hover:border-teal-200'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={autoPay}
                onChange={(e) => setAutoPay(e.target.checked)}
                className="w-4 h-4 accent-teal" />
              <span className="text-sm text-teal font-semibold">Auto Pay</span>
            </label>
          </div>

          <div>
            <label className="label">Notes</label>
            <input type="text" value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes..." className="input" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <span className="spinner" /> : isEdit ? '✓ Update' : '+ Add Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bill Card ─────────────────────────────────────────────────────────────────
function BillCard({ bill, onEdit, onDelete, onTogglePaid }) {
  const isDueThisMonth  = bill.isDueThisMonth;
  const daysUntilDue    = bill.daysUntilDue;
  const isUrgent        = isDueThisMonth && daysUntilDue <= 3 && !bill.isPaid;
  const isUpcoming      = isDueThisMonth && daysUntilDue <= 7 && !bill.isPaid;
  const isPaid          = !isDueThisMonth || bill.isPaid;

  return (
    <div className={`card card-hover p-4 flex items-center gap-4 ${
      isUrgent   ? 'border-red-200 bg-red-50/20'   :
      isUpcoming ? 'border-amber-200 bg-amber-50/20' : ''
    }`}>

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
        isPaid     ? 'bg-green-50' :
        isUrgent   ? 'bg-red-50'   :
        isUpcoming ? 'bg-amber-50' : 'bg-teal-50'
      }`}>
        {CATEGORY_ICONS[bill.category]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-teal text-sm font-playfair truncate">
            {bill.title}
          </h3>
          {bill.autoPay && (
            <span className="text-[9px] bg-teal-100 text-teal px-1.5 py-0.5 rounded font-semibold shrink-0">
              AUTO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-teal-400">
            Due {bill.dueDate}{
              bill.dueDate === 1 ? 'st' : bill.dueDate === 2 ? 'nd' :
              bill.dueDate === 3 ? 'rd' : 'th'
            } • {bill.frequency}
          </span>
          {isDueThisMonth && !isPaid && (
            <span className={`text-[10px] font-semibold ${
              isUrgent ? 'text-red-600' : isUpcoming ? 'text-amber-600' : 'text-teal-400'
            }`}>
              {isUrgent ? '🚨 Due soon!' : isUpcoming ? `⚠️ ${daysUntilDue}d left` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Amount + status */}
      <div className="text-right shrink-0">
        <p className="font-bold text-teal text-sm font-playfair">
          {formatCurrency(bill.amount)}
        </p>
        <span className={`text-[10px] font-semibold ${
          isPaid ? 'text-green-600' : 'text-amber-600'
        }`}>
          {isPaid ? '✅ Paid' : '⏳ Unpaid'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={() => onTogglePaid(bill)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isPaid
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
              : 'bg-green-50 hover:bg-green-100 text-green-700'
          }`}>
          {isPaid ? 'Undo' : '✓ Paid'}
        </button>
        <div className="flex gap-1">
          <button onClick={() => onEdit(bill)}
            className="flex-1 px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal text-xs transition-all">
            ✏️
          </button>
          <button onClick={() => onDelete(bill._id)}
            className="flex-1 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs transition-all">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Bills() {
  const [bills,       setBills]       = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [filterStatus,setFilterStatus]= useState('All');
  const [error,       setError]       = useState('');

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billService.getBills();
      setBills(res.data?.bills || []);
      setSummary({
        totalMonthly:    res.data?.totalMonthly    || 0,
        unpaidThisMonth: res.data?.unpaidThisMonth || 0,
        upcomingIn7Days: res.data?.upcomingIn7Days || 0,
      });
    } catch {
      setError('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleTogglePaid = async (bill) => {
    try {
      if (!bill.isDueThisMonth || bill.isPaid) {
        await billService.markUnpaid(bill._id);
      } else {
        await billService.markPaid(bill._id);
      }
      fetchBills();
    } catch {
      setError('Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await billService.deleteBill(deleteTarget);
      fetchBills();
    } catch {
      setError('Failed to delete');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = bills.filter((b) => {
    if (filterStatus === 'paid')   return !b.isDueThisMonth || b.isPaid;
    if (filterStatus === 'unpaid') return b.isDueThisMonth  && !b.isPaid;
    if (filterStatus === 'urgent') return b.isDueThisMonth  && !b.isPaid && b.daysUntilDue <= 7;
    return true;
  });

  return (
    <div className="page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Bills & Reminders</h1>
            <p className="page-subtitle">Never miss a payment again</p>
          </div>
          <button onClick={() => { setEditingBill(null); setShowModal(true); }}
            className="btn-primary">
            + Add Bill
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Monthly Total',      value: formatCurrency(summary.totalMonthly),    icon: '💰' },
              { label: 'Unpaid This Month',  value: summary.unpaidThisMonth,                 icon: '⏳',
                highlight: summary.unpaidThisMonth > 0 },
              { label: 'Due in 7 Days',      value: summary.upcomingIn7Days,                 icon: '⚠️',
                highlight: summary.upcomingIn7Days > 0 },
            ].map((s) => (
              <div key={s.label}
                className={`card p-5 ${s.highlight ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-xs text-teal-400 uppercase tracking-wider font-semibold">
                    {s.label}
                  </span>
                </div>
                <p className={`text-2xl font-bold font-playfair ${
                  s.highlight ? 'text-amber-600' : 'text-teal'
                }`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-1 p-1 bg-white border border-teal-100 rounded-xl w-fit">
          {[
            { val: 'All',    label: 'All'        },
            { val: 'unpaid', label: '⏳ Unpaid'  },
            { val: 'paid',   label: '✅ Paid'    },
            { val: 'urgent', label: '⚠️ Urgent'  },
          ].map((f) => (
            <button key={f.val} onClick={() => setFilterStatus(f.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === f.val ? 'bg-teal text-cream' : 'text-teal-500 hover:text-teal'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* Bills list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="card p-4 h-16 animate-pulse bg-teal-50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <span className="text-4xl mb-3 block">📄</span>
            <h3 className="text-lg font-bold text-teal font-playfair mb-2">
              No bills found
            </h3>
            <p className="text-sm text-teal-400 mb-4">
              Add your recurring bills to track payments
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              + Add First Bill
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((bill) => (
              <BillCard
                key={bill._id}
                bill={bill}
                onEdit={(b) => { setEditingBill(b); setShowModal(true); }}
                onDelete={setDeleteTarget}
                onTogglePaid={handleTogglePaid}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <BillModal
          bill={editingBill}
          onClose={() => { setShowModal(false); setEditingBill(null); }}
          onSaved={() => { setShowModal(false); setEditingBill(null); fetchBills(); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Bill"
        message="This bill reminder will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}