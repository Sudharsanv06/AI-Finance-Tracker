import { useState, useEffect, useCallback } from 'react';
import incomeService  from '../services/incomeService';
import familyService  from '../services/familyService';
import ConfirmModal   from '../components/ConfirmModal';
import Pagination     from '../components/Pagination';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const SOURCES = [
  'Salary','Freelance','Business','Rental',
  'Investment Returns','Bonus','Gift','Other',
];

const SOURCE_ICONS = {
  Salary:               '💼',
  Freelance:            '💻',
  Business:             '🏢',
  Rental:               '🏠',
  'Investment Returns': '📈',
  Bonus:                '🎁',
  Gift:                 '🎀',
  Other:                '💰',
};

// ── Income Form Modal ─────────────────────────────────────────────────────────
function IncomeModal({ income, members, onClose, onSaved }) {
  const isEdit = !!income?._id;

  const [source,       setSource]       = useState(income?.source      || 'Salary');
  const [amount,       setAmount]       = useState(income?.amount      || '');
  const [date,         setDate]         = useState(
    income?.date
      ? new Date(income.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [description,  setDescription]  = useState(income?.description || '');
  const [isRecurring,  setIsRecurring]  = useState(income?.isRecurring || false);
  const [frequency,    setFrequency]    = useState(income?.frequency   || 'monthly');
  const [familyMember, setFamilyMember] = useState(income?.familyMember?._id || '');
  const [notes,        setNotes]        = useState(income?.notes       || '');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || isNaN(amount)) return setError('Valid amount is required');
    if (parseFloat(amount) <= 0)  return setError('Amount must be greater than 0');

    setLoading(true);
    try {
      const payload = {
        source, amount: parseFloat(amount), date,
        description, isRecurring, frequency,
        familyMember: familyMember || null, notes,
      };
      isEdit
        ? await incomeService.updateIncome(income._id, payload)
        : await incomeService.createIncome(payload);
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
              {isEdit ? 'Edit Income' : 'Add Income'}
            </h2>
            <p className="text-xs text-teal-400 mt-0.5">
              Record your income source
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

          {/* Source selector */}
          <div>
            <label className="label">Income Source *</label>
            <div className="grid grid-cols-4 gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all ${
                    source === s
                      ? 'border-teal bg-teal-50 text-teal'
                      : 'border-teal-100 text-teal-400 hover:border-teal-200'
                  }`}
                >
                  <span className="text-lg">{SOURCE_ICONS[s]}</span>
                  <span className="text-[9px] font-semibold leading-tight">{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000" min="1" className="input" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={date}
                onChange={(e) => setDate(e.target.value)} className="input" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <input type="text" value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly salary from Company" className="input" />
          </div>

          {/* Family member */}
          {members.length > 0 && (
            <div>
              <label className="label">Family Member (optional)</label>
              <select value={familyMember}
                onChange={(e) => setFamilyMember(e.target.value)}
                className="input">
                <option value="">Select member...</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.relation})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recurring */}
          <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl">
            <input type="checkbox" id="recurring" checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 accent-teal" />
            <label htmlFor="recurring" className="text-sm font-semibold text-teal cursor-pointer">
              Recurring Income
            </label>
            {isRecurring && (
              <select value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="input ml-auto w-auto py-1.5 text-xs">
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} placeholder="Any additional notes..."
              className="input resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <span className="spinner" /> : isEdit ? '✓ Update' : '+ Add Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-teal-100 rounded-xl px-4 py-3 shadow-teal-md">
      <p className="text-xs text-teal-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-teal">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Income() {
  const [incomes,      setIncomes]      = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [members,      setMembers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editingIncome,setEditingIncome]= useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pagination,   setPagination]   = useState(null);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [filterSource, setFilterSource] = useState('All');
  const [error,        setError]        = useState('');

  const fetchAll = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterSource !== 'All') params.source = filterSource;

      const [incRes, sumRes, famRes] = await Promise.all([
        incomeService.getIncome(params),
        incomeService.getSummary(),
        familyService.getMembers(),
      ]);

      setIncomes(incRes.data?.incomes || []);
      setPagination(incRes.data?.pagination || null);
      setSummary(sumRes.data || null);
      setMembers(famRes.data?.members || []);
      setCurrentPage(page);
    } catch {
      setError('Failed to load income data');
    } finally {
      setLoading(false);
    }
  }, [filterSource]);

  useEffect(() => { fetchAll(1); }, [fetchAll]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await incomeService.deleteIncome(deleteTarget);
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
            <h1 className="page-title">Income</h1>
            <p className="page-subtitle">Track all your income sources</p>
          </div>
          <button onClick={() => { setEditingIncome(null); setShowModal(true); }}
            className="btn-primary">
            + Add Income
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'This Month',  value: summary?.monthlyTotal || 0, icon: '📅' },
            { label: 'This Year',   value: summary?.yearlyTotal  || 0, icon: '📆' },
            { label: 'All Time',    value: summary?.allTimeTotal || 0, icon: '💰' },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
                <span className="text-xs text-teal-400 uppercase tracking-wider font-semibold">
                  {s.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-teal font-playfair">
                {formatCurrency(s.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Chart */}
        {summary?.chartData?.length > 0 && (
          <div className="card p-6">
            <h2 className="section-title mb-4">Last 6 Months</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.chartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#5a8a87', fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a8a87', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}
                  width={48} />
                <Tooltip content={<CustomTooltip />}
                  cursor={{ fill: '#004643', opacity: 0.05 }} />
                <Bar dataKey="income" fill="#004643" radius={[6,6,0,0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Source breakdown */}
        {summary?.bySource && Object.keys(summary.bySource).length > 0 && (
          <div className="card p-6">
            <h2 className="section-title mb-4">By Source</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(summary.bySource).map(([source, amount]) => (
                <div key={source}
                  className="bg-teal-50 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-xl">{SOURCE_ICONS[source] || '💰'}</span>
                  <div>
                    <p className="text-xs text-teal-400 font-medium">{source}</p>
                    <p className="text-sm font-bold text-teal">
                      {formatCurrency(amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-1 p-1 bg-white border border-teal-100 rounded-xl overflow-x-auto">
          {['All', ...SOURCES].map((s) => (
            <button key={s} onClick={() => setFilterSource(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterSource === s ? 'bg-teal text-cream' : 'text-teal-500 hover:text-teal'
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

        {/* Income List */}
        {loading ? (
          <div className="card p-8 text-center">
            <div className="spinner mx-auto mb-2 border-teal" />
            <p className="text-sm text-teal-400">Loading income...</p>
          </div>
        ) : incomes.length === 0 ? (
          <div className="card p-12 text-center">
            <span className="text-4xl mb-3 block">💰</span>
            <h3 className="text-lg font-bold text-teal font-playfair mb-2">
              No income recorded
            </h3>
            <p className="text-sm text-teal-400 mb-4">
              Start by adding your first income source
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              + Add Income
            </button>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-teal-100 bg-teal-50/50">
                      {['Date','Source','Description','Member','Amount','Recurring',''].map((h) => (
                        <th key={h}
                          className="px-4 py-3 text-xs font-semibold text-teal-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50">
                    {incomes.map((inc) => (
                      <tr key={inc._id}
                        className="hover:bg-teal-50/30 transition-colors group">
                        <td className="px-4 py-3 text-sm text-teal-600 whitespace-nowrap">
                          {formatDate(inc.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 text-sm font-semibold text-teal">
                            {SOURCE_ICONS[inc.source]} {inc.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-teal-500">
                          {inc.description || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-teal-500">
                          {inc.familyMember?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-teal whitespace-nowrap">
                          {formatCurrency(inc.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {inc.isRecurring ? (
                            <span className="badge badge-active text-xs">
                              🔄 {inc.frequency}
                            </span>
                          ) : (
                            <span className="text-xs text-teal-300">One-time</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setEditingIncome(inc); setShowModal(true); }}
                              className="text-teal-300 hover:text-teal transition-colors text-sm">
                              ✏️
                            </button>
                            <button
                              onClick={() => setDeleteTarget(inc._id)}
                              className="text-teal-300 hover:text-red-500 transition-colors text-sm">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
        <IncomeModal
          income={editingIncome}
          members={members}
          onClose={() => { setShowModal(false); setEditingIncome(null); }}
          onSaved={() => { setShowModal(false); setEditingIncome(null); fetchAll(1); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Income"
        message="This income record will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}