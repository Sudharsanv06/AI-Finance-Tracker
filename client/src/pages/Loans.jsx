import { useState, useEffect, useCallback } from 'react';
import loanService   from '../services/loanService';
import ConfirmModal  from '../components/ConfirmModal';
import Pagination    from '../components/Pagination';
import { formatCurrency } from '../utils/helpers';

const CATEGORIES = [
  'Home Loan','Car Loan','Personal Loan','Education Loan',
  'Business Loan','Gold Loan','Friend/Family','Other',
];

const CATEGORY_ICONS = {
  'Home Loan': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  'Car Loan': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm0 0h5a2 2 0 002-2v-4a2 2 0 00-2-2H9m-4 6H3m14-1H3M13 13V9a2 2 0 012-2h3.5a1.5 1.5 0 011.5 1.5V13a2 2 0 01-2 2H17m-4-1h4m1 3a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  ),
  'Personal Loan': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  'Education Loan': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6M4 11v6a1 1 0 001 1h2a1 1 0 001-1v-6" />
    </svg>
  ),
  'Business Loan': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  'Gold Loan': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
    </svg>
  ),
  'Friend/Family': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </svg>
  ),
};

const statusConfig = {
  active: {
    label: 'Active',
    cls: 'bg-blue-50 text-blue-600 border border-blue-100'
  },
  completed: {
    label: 'Completed',
    cls: 'bg-green-50 text-green-700 border border-green-100'
  },
  defaulted: {
    label: 'Defaulted',
    cls: 'bg-red-50 text-red-600 border border-red-100'
  }
};



const getCategoryColor = (cat) => {
  const map = {
    'Home Loan':      'bg-blue-500',
    'Car Loan':       'bg-amber-500',
    'Personal Loan':  'bg-teal',
    'Education Loan': 'bg-indigo-500',
    'Business Loan':  'bg-emerald-500',
    'Gold Loan':      'bg-yellow-500',
    'Friend/Family':  'bg-purple-500',
    'Other':          'bg-slate-400',
  };
  return map[cat] || 'bg-teal';
};

const CalendarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
  </svg>
);

const WalletIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a3 3 0 00-3-3H3m18 3v3a3 3 0 01-3 3H3M21 12H18a2 2 0 110-4h3" />
  </svg>
);

const TrendingIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ArrowDownIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
  </svg>
);

const ArrowUpIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
  </svg>
);

const AlertIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
  </svg>
);

const HandshakeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

// ── EMI Calculator Widget ─────────────────────────────────────────────────────
function EMICalculator() {
  const [principal,  setPrincipal]  = useState('');
  const [rate,       setRate]       = useState('');
  const [tenure,     setTenure]     = useState('');
  const [result,     setResult]     = useState(null);

  const calculate = () => {
    if (!principal || !tenure) return;
    const p   = parseFloat(principal);
    const r   = parseFloat(rate) || 0;
    const n   = parseInt(tenure);
    const emi = loanService.calculateEMI(p, r, n);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - p;

    setResult({ emi, totalPayable, totalInterest });
  };

  return (
    <div className="card p-6">
      <h2 className="section-title mb-4">EMI Calculator</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="label">Loan Amount (₹)</label>
          <input type="number" value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="500000" min="1"
            className="input" />
        </div>
        <div>
          <label className="label">Interest Rate (% per year)</label>
          <input type="number" value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="8.5" min="0" step="0.1"
            className="input" />
        </div>
        <div>
          <label className="label">Tenure (months)</label>
          <input type="number" value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            placeholder="24" min="1"
            className="input" />
        </div>
      </div>

      <button onClick={calculate} className="btn-primary w-full md:w-auto">
        Calculate EMI
      </button>

      {result && (
        <div className="mt-4 grid grid-cols-3 gap-4 animate-scaleIn">
          {[
            { label: 'Monthly EMI',      value: result.emi,           icon: <CalendarIcon className="w-5 h-5 text-teal" /> },
            { label: 'Total Payable',    value: result.totalPayable,  icon: <WalletIcon className="w-5 h-5 text-teal" /> },
            { label: 'Total Interest',   value: result.totalInterest, icon: <TrendingIcon className="w-5 h-5 text-teal" /> },
          ].map((s) => (
            <div key={s.label}
              className="bg-teal-50 rounded-xl p-4 text-center border border-teal-100 flex flex-col items-center">
              <span className="block mb-1">{s.icon}</span>
              <p className="text-lg font-bold text-teal font-playfair">
                {formatCurrency(s.value)}
              </p>
              <p className="text-xs text-teal-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Loan Form Modal ───────────────────────────────────────────────────────────
function LoanModal({ loan, onClose, onSaved }) {
  const isEdit = !!loan?._id;

  const [title,         setTitle]         = useState(loan?.title         || '');
  const [type,          setType]          = useState(loan?.type          || 'taken');
  const [loanFrom,      setLoanFrom]      = useState(loan?.loanFrom      || '');
  const [loanTo,        setLoanTo]        = useState(loan?.loanTo        || '');
  const [category,      setCategory]      = useState(loan?.category      || 'Personal Loan');
  const [principal,     setPrincipal]     = useState(loan?.principal     || '');
  const [interestRate,  setInterestRate]  = useState(loan?.interestRate  || '');
  const [tenureMonths,  setTenureMonths]  = useState(loan?.tenureMonths  || '12');
  const [startDate,     setStartDate]     = useState(
    loan?.startDate
      ? new Date(loan.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [notes,         setNotes]         = useState(loan?.notes         || '');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  // Live EMI preview
  const previewEMI = principal && tenureMonths
    ? loanService.calculateEMI(
        parseFloat(principal),
        parseFloat(interestRate) || 0,
        parseInt(tenureMonths)
      )
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim())  return setError('Title is required');
    if (!principal)     return setError('Principal amount is required');

    setLoading(true);
    try {
      const payload = {
        title: title.trim(), type, loanFrom, loanTo,
        category, principal: parseFloat(principal),
        interestRate: parseFloat(interestRate) || 0,
        tenureMonths: parseInt(tenureMonths)   || 12,
        startDate, notes,
      };
      isEdit
        ? await loanService.updateLoan(loan._id, payload)
        : await loanService.createLoan(payload);
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
          <div>
            <h2 className="text-xl font-bold text-teal font-playfair">
              {isEdit ? 'Edit Loan' : 'Add Loan'}
            </h2>
            <p className="text-xs text-teal-400 mt-0.5">
              Track borrowing and lending
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 flex items-center justify-center text-teal">
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

          {/* Type selector */}
          <div>
            <label className="label">Loan Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  val: 'taken',
                  label: 'Loan Taken',
                  icon: (
                    <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
                    </svg>
                  ),
                  desc: 'I borrowed money',
                },
                {
                  val: 'given',
                  label: 'Loan Given',
                  icon: (
                    <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                    </svg>
                  ),
                  desc: 'I lent money',
                },
              ].map((t) => (
                <button key={t.val} type="button" onClick={() => setType(t.val)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all ${
                    type === t.val
                      ? 'border-teal bg-teal-50 text-teal'
                      : 'border-teal-100 text-teal-400 hover:border-teal-200'
                  }`}>
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-xs font-bold">{t.label}</span>
                  <span className="text-[10px] opacity-70">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="label">Loan Title *</label>
            <input type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Home Loan from SBI"
              className="input" required />
          </div>

          {/* From / To */}
          <div>
            <label className="label">
              {type === 'taken' ? 'Borrowed From' : 'Lent To'}
            </label>
            <input type="text"
              value={type === 'taken' ? loanFrom : loanTo}
              onChange={(e) =>
                type === 'taken'
                  ? setLoanFrom(e.target.value)
                  : setLoanTo(e.target.value)
              }
              placeholder={
                type === 'taken'
                  ? 'e.g. SBI Bank, Dad'
                  : 'e.g. Ravi, Brother'
              }
              className="input" />
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all ${
                    category === c
                      ? 'border-teal bg-teal-50 text-teal'
                      : 'border-teal-100 text-teal-400 hover:border-teal-200'
                  }`}>
                  <span className="text-sm">{CATEGORY_ICONS[c]}</span>
                  <span className="text-[9px] font-semibold leading-tight">{c}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Principal + Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Principal Amount (₹) *</label>
              <input type="number" value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="500000" min="1" className="input" required />
            </div>
            <div>
              <label className="label">Interest Rate (% p.a.)</label>
              <input type="number" value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="8.5" min="0" step="0.1" className="input" />
            </div>
          </div>

          {/* Tenure + Start Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tenure (months)</label>
              <input type="number" value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                placeholder="24" min="1" className="input" />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input" />
            </div>
          </div>

          {/* EMI Preview */}
          {previewEMI && (
            <div className="bg-teal-50 rounded-xl p-4 flex items-center gap-3 border border-teal-100 animate-scaleIn">
              <svg className="w-6 h-6 text-teal shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <div>
                <p className="text-xs text-teal-400">Estimated Monthly EMI</p>
                <p className="text-xl font-bold text-teal font-playfair">
                  {formatCurrency(previewEMI)}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-teal-400">Total Payable</p>
                <p className="text-sm font-bold text-teal">
                  {formatCurrency(previewEMI * parseInt(tenureMonths || 1))}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} placeholder="Any notes about this loan..."
              className="input resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <span className="spinner" /> : isEdit ? '✓ Update' : '+ Add Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ loan, onClose, onSaved }) {
  const [amount,  setAmount]  = useState(loan?.emiAmount || '');
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0]);
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const totalPayable = (loan?.principal || 0) +
    ((loan?.principal || 0) * ((loan?.interestRate || 0) / 100) * ((loan?.tenureMonths || 12) / 12));
  const remainingPayable = Math.max(0, totalPayable - (loan?.totalPaid || 0));
  const isTaken = loan?.type === 'taken';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0)
      return setError('Valid amount is required');

    setLoading(true);
    try {
      await loanService.addPayment(loan._id, {
        amount: parseFloat(amount), date, note,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
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
            {isTaken ? 'Record EMI Payment' : 'Record Payment Received'}
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 flex items-center justify-center text-teal">
            ✕
          </button>
        </div>

        <div className="bg-teal-50 rounded-xl p-3 mb-4 text-xs">
          <p className="text-teal-400">Loan: <strong className="text-teal">{loan?.title}</strong></p>
          <p className="text-teal-400 mt-1">
            {isTaken ? 'Remaining Payable: ' : 'Remaining to Receive: '}
            <strong className="text-teal">
              {formatCurrency(remainingPayable)}
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
            <label className="label">{isTaken ? 'Payment Amount (₹) *' : 'Amount Received (₹) *'}</label>
            <input type="number" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={loan?.emiAmount || '0'}
              min="1" className="input" required />
          </div>
          <div>
            <label className="label">{isTaken ? 'Payment Date' : 'Receipt Date'}</label>
            <input type="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input" />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input type="text" value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isTaken ? 'e.g. EMI for June' : 'e.g. Received from borrower'}
              className="input" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <span className="spinner" /> : isTaken ? '✓ Pay / Record' : '✓ Record Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Loan Card ─────────────────────────────────────────────────────────────────
function LoanCard({ loan, onEdit, onDelete, onPayment }) {
  const totalPayable  = loan.principal +
    (loan.principal * (loan.interestRate / 100) * (loan.tenureMonths / 12));
  const progressPct   = Math.min(
    Math.round(((loan.totalPaid || 0) / totalPayable) * 100), 100
  );
  const remaining     = Math.max(0, totalPayable - (loan.totalPaid || 0));
  const isTaken       = loan.type === 'taken';

  const loanStatus    = loan.status || 'active';
  const s = statusConfig[loanStatus] || statusConfig.active;

  return (
    <div className="card card-hover p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
            isTaken ? 'bg-red-50' : 'bg-green-50'
          }`}>
            <span>{CATEGORY_ICONS[loan.category] || CATEGORY_ICONS.Other}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-teal text-sm font-playfair truncate">
              {loan.title}
            </h3>
            <p className="text-xs text-teal-400">
              {isTaken ? `From: ${loan.loanFrom || '—'}` : `To: ${loan.loanTo || '—'}`}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`badge ${s.cls}`}>{s.label}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isTaken ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
          }`}>
            {isTaken ? 'Taken' : 'Given'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-teal-400">Repayment Progress</span>
          <span className="font-bold text-teal">{progressPct}%</span>
        </div>
        <div className="h-2.5 bg-cream-dark rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPct >= 100
                ? 'bg-green-500'
                : progressPct >= 50
                ? 'bg-teal'
                : 'bg-amber-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-teal-50 rounded-lg p-2 text-center">
          <p className="text-teal-400 mb-0.5">Principal</p>
          <p className="font-bold text-teal text-[11px]">
            {formatCurrency(loan.principal)}
          </p>
        </div>
        <div className="bg-teal-50 rounded-lg p-2 text-center">
          <p className="text-teal-400 mb-0.5">Paid</p>
          <p className="font-bold text-green-600 text-[11px]">
            {formatCurrency(loan.totalPaid || 0)}
          </p>
        </div>
        <div className={`rounded-lg p-2 text-center ${
          remaining > 0 ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <p className="text-teal-400 mb-0.5">Remaining</p>
          <p className={`font-bold text-[11px] ${
            remaining > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* EMI info */}
      <div className="flex items-center justify-between text-xs bg-teal-50 rounded-xl p-3">
        <div>
          <p className="text-teal-400">Monthly EMI</p>
          <p className="font-bold text-teal">
            {formatCurrency(loan.emiAmount || 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-teal-400">Rate</p>
          <p className="font-bold text-teal">{loan.interestRate || 0}% p.a.</p>
        </div>
        <div className="text-right">
          <p className="text-teal-400">Payments</p>
          <p className="font-bold text-teal">
            {loan.payments?.length || 0}/{loan.tenureMonths}
          </p>
        </div>
      </div>

      {/* Payment History */}
      {loan.payments && loan.payments.length > 0 && (
        <div className="pt-3 border-t border-teal-50">
          <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-2">
            Payment History ({loan.payments.length})
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
            {loan.payments.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-teal-50/50 rounded-lg p-2 border border-teal-50">
                <div className="min-w-0">
                  <p className="font-semibold text-teal truncate">
                    {p.note || (isTaken ? 'EMI Payment' : 'Payment Received')}
                  </p>
                  <p className="text-[10px] text-teal-400">
                    {new Date(p.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`font-bold shrink-0 ${isTaken ? 'text-red-600' : 'text-green-700'}`}>
                  {isTaken ? '-' : '+'}{formatCurrency(p.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-teal-50">
        {loanStatus === 'active' && (
          <button onClick={() => onPayment(loan)}
            className="flex-1 btn-primary text-xs py-2">
            {isTaken ? 'Pay EMI' : 'Receive Payment'}
          </button>
        )}
        <button onClick={() => onEdit(loan)}
          className="flex-1 btn-secondary text-xs py-2">
          Edit
        </button>
        <button onClick={() => onDelete(loan._id)}
          className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all">
          <svg className="w-3.5 h-3.5 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Loans() {
  const [loans,       setLoans]       = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [paymentLoan, setPaymentLoan] = useState(null);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [pagination,  setPagination]  = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType,  setFilterType]  = useState('All');
  const [filterStatus,setFilterStatus]= useState('All');
  const [error,       setError]       = useState('');

  const fetchAll = useCallback(async (page = 1) => {
    Promise.resolve().then(() => {
      setLoading(true);
      setError('');
    });
    try {
      const params = { page, limit: 6 };
      if (filterType   !== 'All') params.type   = filterType;
      if (filterStatus !== 'All') params.status = filterStatus;

      const [loanRes, sumRes] = await Promise.all([
        loanService.getLoans(params),
        loanService.getSummary(),
      ]);

      setLoans(loanRes.data?.loans       || []);
      setPagination(loanRes.data?.pagination || null);
      setSummary(sumRes.data             || null);
      setCurrentPage(page);
    } catch {
      setError('Failed to load loans');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAll(1);
    });
  }, [fetchAll]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await loanService.deleteLoan(deleteTarget);
      fetchAll(currentPage);
    } catch {
      setError('Failed to delete');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Loans</h1>
            <p className="page-subtitle">
              Track borrowed and lent money with EMI
            </p>
          </div>
          <button
            onClick={() => { setEditingLoan(null); setShowModal(true); }}
            className="btn-primary">
            + Add Loan
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Borrowed',  value: summary?.totalTaken          || 0, icon: <ArrowDownIcon className="w-5 h-5 text-red-600" />, red: true  },
            { label: 'Total Lent',      value: summary?.totalGiven          || 0, icon: <ArrowUpIcon className="w-5 h-5 text-green-700" />, red: false },
            { label: 'Still Owe',       value: summary?.totalRemainingTaken || 0, icon: <AlertIcon className="w-5 h-5 text-red-600" />, red: true  },
            { label: 'Yet to Recover',  value: summary?.totalRemainingGiven || 0, icon: <HandshakeIcon className="w-5 h-5 text-teal" />, red: false },
          ].map((s) => (
            <div key={s.label}
              className={`card p-5 ${s.red && s.value > 0 ? 'border-red-200 bg-red-50/30' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <span>{s.icon}</span>
                <span className="text-xs text-teal-400 uppercase tracking-wider font-semibold">
                  {s.label}
                </span>
              </div>
              <p className={`text-2xl font-bold font-playfair ${
                s.red && s.value > 0 ? 'text-red-600' : 'text-teal'
              }`}>
                {formatCurrency(s.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Monthly EMI banner */}
        {(summary?.monthlyEMI || 0) > 0 && (
          <div className="card p-5 flex items-center gap-4 border-amber-200 bg-amber-50/30">
            <CalendarIcon className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-teal-600">
                Total Monthly EMI Obligation
              </p>
              <p className="text-2xl font-bold text-teal font-playfair">
                {formatCurrency(summary.monthlyEMI)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-teal-400">Active Loans</p>
              <p className="text-xl font-bold text-teal">
                {summary?.counts?.active || 0}
              </p>
            </div>
          </div>
        )}

        {/* EMI Calculator */}
        <EMICalculator />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 p-1 bg-white border border-teal-100 rounded-xl">
            {['All','taken','given'].map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  filterType === t ? 'bg-teal text-cream' : 'text-teal-500 hover:text-teal'
                }`}>
                {t === 'All' ? 'All' : t === 'taken' ? 'Taken' : 'Given'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 bg-white border border-teal-100 rounded-xl">
            {['All','active','completed','defaulted'].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  filterStatus === s ? 'bg-teal text-cream' : 'text-teal-500 hover:text-teal'
                }`}>
                {s}
              </button>
            ))}
          </div>
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

        {/* Loans Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="card p-5 h-64 animate-pulse bg-teal-50" />
            ))}
          </div>
        ) : loans.length === 0 ? (
          <div className="card p-12 text-center">
            <svg className="w-12 h-12 text-teal-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" />
            </svg>
            <h3 className="text-lg font-bold text-teal font-playfair mb-2">
              No loans recorded
            </h3>
            <p className="text-sm text-teal-400 mb-4">
              Track your borrowings and lendings with EMI
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              + Add Loan
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loans.map((loan) => (
                <LoanCard
                  key={loan._id}
                  loan={loan}
                  onEdit={(l) => { setEditingLoan(l); setShowModal(true); }}
                  onDelete={setDeleteTarget}
                  onPayment={(l) => { setPaymentLoan(l); setShowPayment(true); }}
                />
              ))}
            </div>
            <Pagination
              pagination={pagination}
              onPageChange={(p) => fetchAll(p)}
            />
          </>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <LoanModal
          loan={editingLoan}
          onClose={() => { setShowModal(false); setEditingLoan(null); }}
          onSaved={() => { setShowModal(false); setEditingLoan(null); fetchAll(1); }}
        />
      )}

      {showPayment && paymentLoan && (
        <PaymentModal
          loan={paymentLoan}
          onClose={() => { setShowPayment(false); setPaymentLoan(null); }}
          onSaved={() => { setShowPayment(false); setPaymentLoan(null); fetchAll(currentPage); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Loan"
        message="This loan and all payment records will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}