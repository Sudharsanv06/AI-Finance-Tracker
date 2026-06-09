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
  SIP:           '🔄',
  FD:            '🏦',
  Stocks:        '📈',
  Gold:          '🥇',
  PPF:           '🛡️',
  NPS:           '👴',
  'Mutual Fund': '📊',
  'Real Estate': '🏠',
  Crypto:        '₿',
  Other:         '💼',
};

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
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            ⚠️ {error}
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
                  {s === 'active' ? '✅' : s === 'matured' ? '🎯' : '🔴'} {s}
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
            {TYPE_ICONS[investment.type]}
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
    setLoading(true);
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

  useEffect(() => { fetchAll(1); }, [fetchAll]);

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
              label:     'Total Invested',
              value:     formatCurrency(summary?.totalInvested || 0),
              icon:      '💰',
              highlight: false,
            },
            {
              label:     'Current Value',
              value:     formatCurrency(summary?.totalCurrentValue || 0),
              icon:      '📊',
              highlight: false,
            },
            {
              label:     'Total Returns',
              value:     `${isProfit ? '+' : ''}${formatCurrency(summary?.totalReturns || 0)}`,
              icon:      isProfit ? '📈' : '📉',
              highlight: !isProfit,
              green:     isProfit && (summary?.totalReturns || 0) > 0,
            },
            {
              label:     'Returns %',
              value:     `${isProfit ? '+' : ''}${summary?.returnsPercent || 0}%`,
              icon:      '🎯',
              highlight: false,
            },
          ].map((s) => (
            <div key={s.label}
              className={`card p-5 ${s.highlight ? 'border-red-200 bg-red-50' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
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
              <span className="text-2xl">🔄</span>
              <div>
                <p className="text-xs text-teal-400 uppercase tracking-wider">Monthly SIP</p>
                <p className="text-lg font-bold text-teal font-playfair">
                  {formatCurrency(summary.monthlyContribution || 0)}
                </p>
              </div>
            </div>
            {[
              { label: 'Active',    value: summary.counts?.active    || 0, icon: '✅' },
              { label: 'Matured',   value: summary.counts?.matured   || 0, icon: '🎯' },
              { label: 'Withdrawn', value: summary.counts?.withdrawn || 0, icon: '🔴' },
            ].map((s) => (
              <div key={s.label} className="card p-4 flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
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
                      <span className="text-sm text-teal font-medium">
                        {TYPE_ICONS[type]} {type}
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
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
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
          <div className="card p-12 text-center">
            <span className="text-4xl mb-3 block">📊</span>
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