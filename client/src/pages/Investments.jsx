import { useState, useEffect, useCallback } from 'react';
import investmentService from '../services/investmentService';
import ConfirmModal      from '../components/ConfirmModal';
import Pagination        from '../components/Pagination';
import BudgetRing        from '../components/BudgetRing';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const TYPES = [
  'SIP','FD','Stocks','Gold','PPF',
  'NPS','Mutual Fund','Real Estate','Crypto','Other',
];

const TYPE_ICONS = {
  SIP: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  FD: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Stocks: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Gold: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" />
    </svg>
  ),
  PPF: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  NPS: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'Mutual Fund': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  'Real Estate': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Crypto: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2zm2 4h6v6H9V9z" />
    </svg>
  ),
  Other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
    </svg>
  ),
};


const getTypeColor = (type) => {
  const map = {
    SIP:           'bg-blue-500',
    FD:            'bg-amber-500',
    Stocks:        'bg-teal',
    Gold:          'bg-yellow-500',
    PPF:           'bg-emerald-500',
    NPS:           'bg-indigo-500',
    'Mutual Fund': 'bg-purple-500',
    'Real Estate': 'bg-cyan-500',
    Crypto:        'bg-rose-500',
    Other:         'bg-slate-400',
  };
  return map[type] || 'bg-teal';
};

const WalletIcon = () => (
  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a3 3 0 00-3-3H3m18 3v3a3 3 0 01-3 3H3M21 12H18a2 2 0 110-4h3" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TrendingIcon = () => (
  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon = () => (
  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const PIE_COLORS = [
  '#004643','#1a706b','#2d9e99','#f59e0b',
  '#8b5cf6','#ec4899','#10b981','#3b82f6',
  '#ef4444','#6b7280',
];

// ── Investment Form Modal ─────────────────────────────────────────────────────
function InvestmentModal({ investment, onClose, onSaved }) {
  const isEdit = !!investment?._id;

  const [name,                setName]                = useState(investment?.name                || '');
  const [type,                setType]                = useState(investment?.type                || 'SIP');
  const [platform,            setPlatform]            = useState(investment?.platform            || '');
  const [investedAmount,      setInvestedAmount]      = useState(investment?.investedAmount      || '');
  const [currentValue,        setCurrentValue]        = useState(investment?.currentValue        || '');
  const [startDate,           setStartDate]           = useState(
    investment?.startDate
      ? new Date(investment.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [maturityDate,        setMaturityDate]        = useState(
    investment?.maturityDate
      ? new Date(investment.maturityDate).toISOString().split('T')[0]
      : ''
  );
  const [interestRate,        setInterestRate]        = useState(investment?.interestRate        || '');
  const [monthlyContribution, setMonthlyContribution] = useState(investment?.monthlyContribution || '');
  const [status,              setStatus]              = useState(investment?.status              || 'active');
  const [notes,               setNotes]               = useState(investment?.notes               || '');
  const [loading,             setLoading]             = useState(false);
  const [error,               setError]               = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim())     return setError('Name is required');
    if (!investedAmount)  return setError('Invested amount is required');

    setLoading(true);
    try {
      const payload = {
        name: name.trim(), type, platform,
        investedAmount:      parseFloat(investedAmount),
        currentValue:        parseFloat(currentValue)        || parseFloat(investedAmount),
        startDate,
        maturityDate:        maturityDate || null,
        interestRate:        parseFloat(interestRate)        || 0,
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        status, notes,
      };
      isEdit
        ? await investmentService.updateInvestment(investment._id, payload)
        : await investmentService.createInvestment(payload);
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
              {isEdit ? 'Edit Investment' : 'Add Investment'}
            </h2>
            <p className="text-xs text-teal-400 mt-0.5">
              Track your investment portfolio
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
            <label className="label">Investment Type *</label>
            <div className="grid grid-cols-5 gap-2">
              {TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all ${
                    type === t
                      ? 'border-teal bg-teal-50 text-teal'
                      : 'border-teal-100 text-teal-400 hover:border-teal-200'
                  }`}>
                  <span className="text-lg">{TYPE_ICONS[t]}</span>
                  <span className="text-[9px] font-semibold leading-tight">{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label">Investment Name *</label>
            <input type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HDFC Top 100 Fund SIP"
              className="input" required />
          </div>

          {/* Platform */}
          <div>
            <label className="label">Platform / Bank</label>
            <input type="text" value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="e.g. Zerodha, HDFC Bank, Groww"
              className="input" />
          </div>

          {/* Invested + Current Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Invested Amount (₹) *</label>
              <input type="number" value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                placeholder="100000" min="1" className="input" required />
            </div>
            <div>
              <label className="label">Current Value (₹)</label>
              <input type="number" value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="120000" min="0" className="input" />
            </div>
          </div>

          {/* Start + Maturity Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Maturity Date</label>
              <input type="date" value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)} className="input" />
            </div>
          </div>

          {/* Interest Rate + Monthly Contribution */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Interest Rate (%)</label>
              <input type="number" value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="8.5" min="0" step="0.1" className="input" />
            </div>
            <div>
              <label className="label">Monthly Contribution (₹)</label>
              <input type="number" value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="5000" min="0" className="input" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {['active','matured','withdrawn'].map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${
                    status === s
                      ? 'border-teal bg-teal-50 text-teal'
                      : 'border-teal-100 text-teal-400 hover:border-teal-200'
                  }`}>
                  <span className="flex items-center gap-1.5 justify-center">
                    <span className={`w-2 h-2 rounded-full ${
                      s === 'active' ? 'bg-green-500' :
                      s === 'matured' ? 'bg-teal' : 'bg-red-500'
                    }`} />
                    <span>{s}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} placeholder="Any notes about this investment..."
              className="input resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading
                ? <span className="spinner" />
                : isEdit ? '✓ Update' : '+ Add Investment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Investment Card ───────────────────────────────────────────────────────────
function InvestmentCard({ investment, onEdit, onDelete }) {
  const returns     = (investment.currentValue || 0) - investment.investedAmount;
  const returnsPercent = investment.investedAmount
    ? ((returns / investment.investedAmount) * 100).toFixed(1)
    : 0;
  const isProfit    = returns >= 0;

  const statusConfig = {
    active:    { label: 'Active',    cls: 'badge-active'   },
    matured:   { label: 'Matured',   cls: 'badge-approved' },
    withdrawn: { label: 'Withdrawn', cls: 'badge-rejected' },
  };
  const s = statusConfig[investment.status] || statusConfig.active;

  return (
    <div className="card card-hover p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center
                          justify-center text-xl shrink-0">
            <span>{TYPE_ICONS[investment.type] || TYPE_ICONS.Other}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-teal text-sm font-playfair truncate">
              {investment.name}
            </h3>
            <p className="text-xs text-teal-400">{investment.type}
              {investment.platform && ` • ${investment.platform}`}
            </p>
          </div>
        </div>
        <span className={`badge ${s.cls} shrink-0`}>{s.label}</span>
      </div>

      {/* Returns ring + stats */}
      <div className="flex items-center gap-4">
        <BudgetRing
          spent={investment.currentValue || 0}
          total={(investment.currentValue || 0) + Math.abs(returns) + 1}
          size={72}
        />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-teal-400">Invested</span>
            <span className="font-semibold text-teal">
              {formatCurrency(investment.investedAmount)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-teal-400">Current</span>
            <span className="font-semibold text-teal">
              {formatCurrency(investment.currentValue || 0)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-teal-400">Returns</span>
            <span className={`font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? '+' : ''}{formatCurrency(returns)}
              {' '}({isProfit ? '+' : ''}{returnsPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Extra details */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {investment.interestRate > 0 && (
          <div className="bg-teal-50 rounded-lg p-2">
            <p className="text-teal-400">Interest Rate</p>
            <p className="font-bold text-teal">{investment.interestRate}% p.a.</p>
          </div>
        )}
        {investment.monthlyContribution > 0 && (
          <div className="bg-teal-50 rounded-lg p-2">
            <p className="text-teal-400">Monthly SIP</p>
            <p className="font-bold text-teal">
              {formatCurrency(investment.monthlyContribution)}
            </p>
          </div>
        )}
        {investment.startDate && (
          <div className="bg-teal-50 rounded-lg p-2">
            <p className="text-teal-400">Start Date</p>
            <p className="font-bold text-teal">{formatDate(investment.startDate)}</p>
          </div>
        )}
        {investment.maturityDate && (
          <div className="bg-amber-50 rounded-lg p-2">
            <p className="text-amber-600">Matures On</p>
            <p className="font-bold text-amber-700">{formatDate(investment.maturityDate)}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-teal-50">
        <button onClick={() => onEdit(investment)}
          className="flex-1 btn-secondary text-xs py-2">
          Update Value
        </button>
        <button onClick={() => onDelete(investment._id)}
          className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all">
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Custom Pie Tooltip ────────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-teal-100 rounded-xl px-4 py-3 shadow-teal-md">
      <p className="text-xs text-teal-400 mb-1">{payload[0].name}</p>
      <p className="text-sm font-bold text-teal">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Investments() {
  const [investments,       setInvestments]       = useState([]);
  const [summary,           setSummary]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [showModal,         setShowModal]         = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [deleteTarget,      setDeleteTarget]      = useState(null);
  const [pagination,        setPagination]        = useState(null);
  const [currentPage,       setCurrentPage]       = useState(1);
  const [filterType,        setFilterType]        = useState('All');
  const [filterStatus,      setFilterStatus]      = useState('All');
  const [error,             setError]             = useState('');

  const fetchAll = useCallback(async (page = 1) => {
    Promise.resolve().then(() => {
      setLoading(true);
      setError('');
    });
    try {
      const params = { page, limit: 9 };
      if (filterType   !== 'All') params.type   = filterType;
      if (filterStatus !== 'All') params.status = filterStatus;

      const [invRes, sumRes] = await Promise.all([
        investmentService.getInvestments(params),
        investmentService.getSummary(),
      ]);

      setInvestments(invRes.data?.investments || []);
      setPagination(invRes.data?.pagination   || null);
      setSummary(sumRes.data                  || null);
      setCurrentPage(page);
    } catch {
      setError('Failed to load investments');
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
      await investmentService.deleteInvestment(deleteTarget);
      fetchAll(currentPage);
    } catch {
      setError('Failed to delete');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Pie chart data
  const pieData = summary?.byType
    ? Object.entries(summary.byType).map(([name, val]) => ({
        name,
        value: val.currentValue,
      }))
    : [];

  const isProfit = (summary?.totalReturns || 0) >= 0;

  return (
    <div className="page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Investments</h1>
            <p className="page-subtitle">Track your investment portfolio</p>
          </div>
          <button
            onClick={() => { setEditingInvestment(null); setShowModal(true); }}
            className="btn-primary">
            + Add Investment
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label:     'Invested Amount',
              value:     formatCurrency(summary?.totalInvested || 0),
              icon:      <WalletIcon />,
              highlight: false,
            },
            {
              label:     'Current Value',
              value:     formatCurrency(summary?.totalCurrentValue || 0),
              icon:      <ChartIcon />,
              highlight: false,
            },
            {
              label:     'Total Returns',
              value:     `${isProfit ? '+' : ''}${formatCurrency(summary?.totalReturns || 0)}`,
              icon:      isProfit ? <TrendingIcon /> : <TrendingDownIcon />,
              highlight: !isProfit,
              green:     isProfit && (summary?.totalReturns || 0) > 0,
            },
            {
              label:     'Returns %',
              value:     `${isProfit ? '+' : ''}${summary?.returnsPercent || 0}%`,
              icon:      <TargetIcon />,
              highlight: false,
            },
          ].map((s) => (
            <div key={s.label}
              className={`card p-5 ${s.highlight ? 'border-red-200 bg-red-50' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <span>{s.icon}</span>
                <span className="text-xs text-teal-400 uppercase tracking-wider font-semibold">
                  {s.label}
                </span>
              </div>
              <p className={`text-2xl font-bold font-playfair ${
                s.highlight ? 'text-red-600'
                : s.green    ? 'text-green-600'
                : 'text-teal'
              }`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Monthly contribution + counts */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4 flex items-center gap-3">
              <span className="shrink-0 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H20" />
                </svg>
              </span>
              <div>
                <p className="text-xs text-teal-400 uppercase tracking-wider">Monthly SIP</p>
                <p className="text-lg font-bold text-teal font-playfair">
                  {formatCurrency(summary.monthlyContribution || 0)}
                </p>
              </div>
            </div>
            {[
              { label: 'Active',    value: summary.counts?.active    || 0, icon: <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> },
              { label: 'Matured',   value: summary.counts?.matured   || 0, icon: <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> },
              { label: 'Withdrawn', value: summary.counts?.withdrawn || 0, icon: <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> },
            ].map((s) => (
              <div key={s.label} className="card p-4 flex items-center gap-3">
                <span className="shrink-0 flex items-center justify-center">{s.icon}</span>
                <div>
                  <p className="text-xs text-teal-400 uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg font-bold text-teal font-playfair">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Portfolio pie chart */}
        {pieData.length > 0 && (
          <div className="card p-6">
            <h2 className="section-title mb-4">Portfolio Allocation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend formatter={(value) => (
                    <span className="text-xs text-teal">{value}</span>
                  )} />
                </PieChart>
              </ResponsiveContainer>

              {/* Type breakdown */}
              <div className="space-y-2">
                {Object.entries(summary?.byType || {}).map(([type, val], i) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm text-teal font-medium flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${getTypeColor(type)}`} />
                        <span>{type}</span>
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-teal">
                          {formatCurrency(val.currentValue)}
                        </span>
                        <span className={`text-xs ml-2 ${
                          val.currentValue >= val.invested
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {val.currentValue >= val.invested ? '+' : ''}
                          {formatCurrency(val.currentValue - val.invested)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 p-1 bg-white border border-teal-100 rounded-xl overflow-x-auto">
            {['All', ...TYPES].map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  filterType === t ? 'bg-teal text-cream' : 'text-teal-500 hover:text-teal'
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 bg-white border border-teal-100 rounded-xl">
            {['All','active','matured','withdrawn'].map((s) => (
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
            <svg className="w-4 h-4 text-teal shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Investments Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="card p-5 h-56 animate-pulse bg-teal-50" />
            ))}
          </div>
        ) : investments.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center">
            <svg className="w-12 h-12 text-teal-300 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <h3 className="text-lg font-bold text-teal font-playfair mb-2">
              No investments yet
            </h3>
            <p className="text-sm text-teal-400 mb-4">
              Start tracking your investment portfolio
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              + Add Investment
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {investments.map((inv) => (
                <InvestmentCard
                  key={inv._id}
                  investment={inv}
                  onEdit={(i) => { setEditingInvestment(i); setShowModal(true); }}
                  onDelete={setDeleteTarget}
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

      {showModal && (
        <InvestmentModal
          investment={editingInvestment}
          onClose={() => { setShowModal(false); setEditingInvestment(null); }}
          onSaved={() => {
            setShowModal(false);
            setEditingInvestment(null);
            fetchAll(currentPage);
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Investment"
        message="This investment record will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}