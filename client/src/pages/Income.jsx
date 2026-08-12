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
  Salary: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Freelance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Business: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Rental: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  'Investment Returns': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Bonus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0H4v13a2 2 0 002 2h12a2 2 0 002-2V8H12z" />
    </svg>
  ),
  Gift: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </svg>
  ),
};


const getSourceColor = (src) => {
  const map = {
    Salary:               'bg-blue-500',
    Freelance:            'bg-indigo-500',
    Business:             'bg-emerald-500',
    Rental:               'bg-cyan-500',
    'Investment Returns': 'bg-teal',
    Bonus:                'bg-amber-500',
    Gift:                 'bg-pink-500',
    Other:                'bg-slate-400',
  };
  return map[src] || 'bg-teal';
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

// ── Income Form Modal ─────────────────────────────────────────────────────────
function IncomeModal({ income, members, onClose, onSaved }) {
  const isEdit = !!income?._id;
  const assignableMembers = members.filter(m => !m.archived || m._id === (income?.familyMember?._id || income?.familyMember));

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
    if (!familyMember)            return setError('Family member is required');

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
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
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
              <label className="label">Family Member *</label>
              <select value={familyMember}
                onChange={(e) => setFamilyMember(e.target.value)}
                className="input">
                <option value="">Select member...</option>
                {assignableMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.relation})
                  </option>
                ))}
              </select>
              {isEdit && income.isTemplate && (
                <p className="text-[11px] text-amber-600 font-semibold mt-1.5 leading-normal">
                  ⚠️ This is a recurring income template. Changing the family member will apply to
                  future occurrences only — past entries won't be affected.
                </p>
              )}
              {isEdit && income.parentRecurringId && (
                <p className="text-[11px] text-slate-500 font-semibold mt-1.5 leading-normal">
                  ℹ️ This is a single occurrence of a recurring income. Changes here apply only to this entry.
                </p>
              )}
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
    Promise.resolve().then(() => {
      setLoading(true);
      setError('');
    });
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

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAll(1);
    });
  }, [fetchAll]);

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
            { label: 'This Month',  value: summary?.monthlyTotal || 0, icon: <CalendarIcon className="w-5 h-5 text-teal" /> },
            { label: 'This Year',   value: summary?.yearlyTotal  || 0, icon: <CalendarIcon className="w-5 h-5 text-teal" /> },
            { label: 'All Time',    value: summary?.allTimeTotal || 0, icon: <WalletIcon className="w-5 h-5 text-teal" /> },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <span>{s.icon}</span>
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
                  <span className={`w-3 h-3 rounded-full shrink-0 ${getSourceColor(source)}`} />
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
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Income List */}
        {loading ? (
          <div className="card p-8 text-center">
            <div className="spinner mx-auto mb-2 border-teal" />
            <p className="text-sm text-teal-400">Loading income...</p>
          </div>
        ) : incomes.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center">
            <svg className="w-12 h-12 text-teal-300 mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a3 3 0 00-3-3H3m18 3v3a3 3 0 01-3 3H3M21 12H18a2 2 0 110-4h3" />
            </svg>
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
                        <td className="px-4 py-3 flex items-center gap-2">
                            <span className="text-teal shrink-0">{SOURCE_ICONS[inc.source] || SOURCE_ICONS.Other}</span>
                            <span>{inc.source}</span>
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
                              {inc.frequency}
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
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(inc._id)}
                              className="text-teal-300 hover:text-red-500 transition-colors text-sm flex items-center justify-center">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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