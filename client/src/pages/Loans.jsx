import { useState, useEffect, useCallback } from 'react';
import loanService   from '../services/loanService';
import ConfirmModal  from '../components/ConfirmModal';
import Pagination    from '../components/Pagination';
import { formatCurrency, formatDate } from '../utils/helpers';

const CATEGORIES = [
  'Home Loan','Car Loan','Personal Loan','Education Loan',
  'Business Loan','Gold Loan','Friend/Family','Other',
];

const CATEGORY_ICONS = {
  'Home Loan':       '🏠',
  'Car Loan':        '🚗',
  'Personal Loan':   '👤',
  'Education Loan':  '🎓',
  'Business Loan':   '🏢',
  'Gold Loan':       '🥇',
  'Friend/Family':   '👨‍👩‍👦',
  'Other':           '💰',
};

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
      <h2 className="section-title mb-4">🧮 EMI Calculator</h2>
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
            { label: 'Monthly EMI',      value: result.emi,           icon: '📅' },
            { label: 'Total Payable',    value: result.totalPayable,  icon: '💰' },
            { label: 'Total Interest',   value: result.totalInterest, icon: '📊' },
          ].map((s) => (
            <div key={s.label}
              className="bg-teal-50 rounded-xl p-4 text-center border border-teal-100">
              <span className="text-2xl block mb-1">{s.icon}</span>
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
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Type selector */}
          <div>
            <label className="label">Loan Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'taken', label: 'Loan Taken', icon: '⬇️', desc: 'I borrowed money' },
                { val: 'given', label: 'Loan Given', icon: '⬆️', desc: 'I lent money' },
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
              <span className="text-2xl">📅</span>
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
            Record Payment
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 flex items-center justify-center text-teal">
            ✕
          </button>
        </div>

        <div className="bg-teal-50 rounded-xl p-3 mb-4 text-xs">
          <p className="text-teal-400">Loan: <strong className="text-teal">{loan?.title}</strong></p>
          <p className="text-teal-400 mt-1">
            Remaining: <strong className="text-teal">
              {formatCurrency(loan?.remainingAmount || 0)}
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
            <label className="label">Payment Amount (₹) *</label>
            <input type="number" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={loan?.emiAmount || '0'}
              min="1" className="input" required />
          </div>
          <div>
            <label className="label">Payment Date</label>
            <input type="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input" />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input type="text" value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. EMI for June"
              className="input" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <span className="spinner" /> : '✓ Record'}
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

  const statusConfig = {
    active:    { label: 'Active',    cls: 'badge-active'   },
    completed: { label: 'Completed', cls: 'badge-approved' },
    defaulted: { label: 'Defaulted', cls: 'badge-rejected' },
  };
  const s = statusConfig[loan.status] || statusConfig.active;

  return (
    <div className="card card-hover p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
            isTaken ? 'bg-red-50' : 'bg-green-50'
          }`}>
            {CATEGORY_ICONS[loan.category]}
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
            {isTaken ? '⬇️ Taken' : '⬆️ Given'}
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
            {loan.paidEMIs || 0}/{loan.tenureMonths}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-teal-50">
        {loan.status === 'active' && (
          <button onClick={() => onPayment(loan)}
            className="flex-1 btn-primary text-xs py-2">
            💳 Pay EMI
          </button>
        )}
        <button onClick={() => onEdit(loan)}
          className="flex-1 btn-secondary text-xs py-2">
          Edit
        </button>
        <button onClick={() => onDelete(loan._id)}
          className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all">
          🗑️
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
    setLoading(true);
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

  useEffect(() => { fetchAll(1); }, [fetchAll]);

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
            { label: 'Total Borrowed',  value: summary?.totalTaken          || 0, icon: '⬇️', red: true  },
            { label: 'Total Lent',      value: summary?.totalGiven          || 0, icon: '⬆️', red: false },
            { label: 'Still Owe',       value: summary?.totalRemainingTaken || 0, icon: '😟', red: true  },
            { label: 'Yet to Recover',  value: summary?.totalRemainingGiven || 0, icon: '🤝', red: false },
          ].map((s) => (
            <div key={s.label}
              className={`card p-5 ${s.red && s.value > 0 ? 'border-red-200 bg-red-50/30' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
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
            <span className="text-3xl">📅</span>
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
                {t === 'All' ? 'All' : t === 'taken' ? '⬇️ Taken' : '⬆️ Given'}
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
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
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
            <span className="text-4xl mb-3 block">🤝</span>
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