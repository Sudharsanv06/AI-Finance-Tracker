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
  Rent: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Electricity: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  Water: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v.01M12 12V3M5 12a7 7 0 0014 0c0-5.25-7-9-7-9S5 6.75 5 12z" />
    </svg>
  ),
  Internet: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-4-4a5.5 5.5 0 018 0M4.5 10a10.5 10.5 0 0115 0" />
    </svg>
  ),
  Phone: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Insurance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Subscription: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  EMI: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Gas: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  'Credit Card': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  Other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </svg>
  ),
};


const getCategoryColor = (cat) => {
  const map = {
    Rent:           'bg-blue-500',
    Electricity:    'bg-amber-500',
    Water:          'bg-cyan-500',
    Internet:       'bg-indigo-500',
    Phone:          'bg-purple-500',
    Insurance:      'bg-emerald-500',
    Subscription:   'bg-pink-500',
    EMI:            'bg-rose-500',
    Gas:            'bg-orange-500',
    'Credit Card':  'bg-red-500',
    Other:          'bg-slate-400',
  };
  return map[cat] || 'bg-teal';
};

const WalletIcon = () => (
  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a3 3 0 00-3-3H3m18 3v3a3 3 0 01-3 3H3M21 12H18a2 2 0 110-4h3" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" d="M12 6v6l4 2" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
  </svg>
);

// ── Bill Form Modal ───────────────────────────────────────────────────────────
function BillModal({ bill, onClose, onSaved }) {
  const isEdit = !!bill?._id;

  const [title,       setTitle]       = useState(bill?.title       || '');
  const [amount,      setAmount]      = useState(bill?.amount      || '');
  const [category,    setCategory]    = useState(bill?.category    || 'Other');
  const [dueDate,     setDueDate]     = useState(bill?.dueDate     || 1);
  const [isRecurring] = useState(bill?.isRecurring !== false);
  const [frequency,   setFrequency]   = useState(bill?.frequency   || 'monthly');
  const [autoPay,     setAutoPay]     = useState(bill?.autoPay     || false);
  const [calendarDate, setCalendarDate] = useState(() => {
    if (bill?.autoPay && bill?.dueDate) {
      const year = new Date().getFullYear();
      const month = bill.dueMonth ? String(bill.dueMonth).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(bill.dueDate).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
  });
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
      let finalDueDate = parseInt(dueDate);
      let finalDueMonth = undefined;

      if (autoPay) {
        if (!calendarDate) {
          setLoading(false);
          return setError('Autopay date is required');
        }
        const d = new Date(calendarDate);
        finalDueDate = d.getDate();
        if (frequency !== 'monthly') {
          finalDueMonth = d.getMonth() + 1;
        }
      }

      const payload = {
        title: title.trim(), amount: parseFloat(amount),
        category, dueDate: finalDueDate,
        dueMonth: finalDueMonth,
        isRecurring, frequency: autoPay ? frequency : 'monthly',
        autoPay, notes,
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

          <div>
            <label className="label">Amount (₹) *</label>
            <input type="number" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="999" min="1" className="input" required />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={autoPay}
                onChange={(e) => setAutoPay(e.target.checked)}
                className="w-4 h-4 accent-teal" />
              <span className="text-sm text-teal font-semibold">Auto Pay</span>
            </label>
          </div>

          {autoPay ? (
            <>
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

              <div>
                <label className="label">Autopay Date</label>
                <input type="date" value={calendarDate}
                  onChange={(e) => setCalendarDate(e.target.value)}
                  className="input" required />
              </div>
            </>
          ) : (
            <div>
              <label className="label">Due on Day of Month</label>
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
          )}

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
  const isPaid          = bill.isPaid;

  return (
    <div className={`card card-hover p-4 flex items-center gap-4 ${
      isUrgent   ? 'border-red-200 bg-red-50/20'   :
      isUpcoming ? 'border-amber-200 bg-amber-50/20' : ''
    }`}>

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-teal shrink-0 ${
        isPaid     ? 'bg-green-50' :
        isUrgent   ? 'bg-red-50'   :
        isUpcoming ? 'bg-amber-50' : 'bg-teal-50'
      }`}>
        {CATEGORY_ICONS[bill.category] || CATEGORY_ICONS.Other}
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
              {isUrgent ? 'Due soon!' : isUpcoming ? `${daysUntilDue}d left` : ''}
            </span>
          )}
        </div>
        {bill.upcomingDates && bill.upcomingDates.length > 0 && (
          <div className="mt-2 flex flex-col gap-1 text-[10px] border-t border-teal-50 pt-2">
            <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider mb-0.5">
              Upcoming Cycles
            </span>
            {bill.upcomingDates.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-teal-50/30 rounded px-2 py-1 text-teal">
                <span>{item.formattedDate}</span>
                <span className={`font-bold ${item.daysLeft <= 3 ? 'text-red-600' : item.daysLeft <= 7 ? 'text-amber-600' : 'text-teal-500'}`}>
                  {item.daysLeft} days left
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Amount + status */}
      <div className="text-right shrink-0">
        <p className="font-bold text-teal text-sm font-playfair">
          {formatCurrency(bill.amount)}
        </p>
        <span className={`text-[10px] font-semibold ${
          isPaid ? 'text-green-600' : !isDueThisMonth ? 'text-blue-500' : 'text-amber-600'
        }`}>
          {isPaid ? 'Paid' : !isDueThisMonth ? 'Upcoming' : 'Unpaid'}
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
          {isPaid ? 'Undo' : 'Paid'}
        </button>
        <div className="flex gap-1">
          <button onClick={() => onEdit(bill)}
            className="flex-1 px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal text-xs transition-all flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button onClick={() => onDelete(bill._id)}
            className="flex-1 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs transition-all flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
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
    Promise.resolve().then(() => {
      setLoading(true);
      setError('');
    });
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

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchBills();
    });
  }, [fetchBills]);

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
    if (filterStatus === 'paid')   return b.isPaid;
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
              { label: 'Monthly Total',      value: formatCurrency(summary.totalMonthly),    icon: <WalletIcon /> },
              { label: 'Unpaid This Month',  value: summary.unpaidThisMonth,                 icon: <ClockIcon />,
                highlight: summary.unpaidThisMonth > 0 },
              { label: 'Due in 7 Days',      value: summary.upcomingIn7Days,                 icon: <WarningIcon />,
                highlight: summary.upcomingIn7Days > 0 },
            ].map((s) => (
              <div key={s.label}
                className={`card p-5 ${s.highlight ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{s.icon}</span>
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
            { val: 'unpaid', label: 'Unpaid'  },
            { val: 'paid',   label: 'Paid'    },
            { val: 'urgent', label: 'Urgent'  },
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
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
            <span>{error}</span>
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
          <div className="card p-12 text-center flex flex-col items-center">
            <svg className="w-12 h-12 text-teal-300 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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