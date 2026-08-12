import { useState, useEffect, useCallback } from 'react';
import familyService from '../services/familyService';
import incomeService from '../services/incomeService';
import ConfirmModal  from '../components/ConfirmModal';
import { formatCurrency, formatDate } from '../utils/helpers';

const RELATIONS = ['Spouse','Parent','Child','Sibling','Other'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const RELATION_ICONS = {
  Self: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Spouse: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Parent: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Child: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
    </svg>
  ),
  Sibling: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </svg>
  ),
};

const COLORS = [
  '#004643','#1a706b','#2d9e99','#f59e0b',
  '#8b5cf6','#ec4899','#ef4444','#10b981',
];

// ── Member Form Modal ─────────────────────────────────────────────────────────
function MemberModal({ member, onClose, onSaved }) {
  const isEdit = !!member?._id;

  const [name,          setName]          = useState(member?.name          || '');
  const [relation,      setRelation]      = useState(member?.relation      || 'Other');
  const [color,         setColor]         = useState(member?.color         || '#004643');
  const [date,          setDate]          = useState(
    member?.date 
      ? new Date(member.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Name is required');

    setLoading(true);
    try {
      const payload = {
        name: name.trim(), relation,
        monthlyIncome: 0,
        color,
        date,
      };
      isEdit
        ? await familyService.updateMember(member._id, payload)
        : await familyService.createMember(payload);
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
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-teal-lg border border-teal-100 p-6 animate-scaleIn">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-teal font-playfair">
            {isEdit ? 'Edit Member' : 'Add Family Member'}
          </h2>
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
          <div>
            <label className="label">Full Name *</label>
            <input type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya" className="input" />
          </div>

          {/* Relation */}
          {relation !== 'Self' && (
            <div>
              <label className="label">Relation</label>
              <div className="grid grid-cols-3 gap-2">
                {RELATIONS.map((r) => (
                  <button key={r} type="button" onClick={() => setRelation(r)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all ${
                      relation === r
                        ? 'border-teal bg-teal-50 text-teal'
                        : 'border-teal-100 text-teal-400 hover:border-teal-200'
                    }`}>
                    <span className="text-xl">{RELATION_ICONS[r]}</span>
                    <span className="text-[11px] font-semibold">{r}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Record Date */}
          <div>
            <label className="label">Start / Record Date</label>
            <input type="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input" />
          </div>

          {/* Color picker */}
          <div>
            <label className="label">Avatar Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-teal scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <span className="spinner" /> : isEdit ? '✓ Update' : '+ Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Member Card ───────────────────────────────────────────────────────────────
function MemberCard({ member, monthName, onEdit, onDelete }) {
  const initials = member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="card card-hover p-5 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center
                        text-white font-bold text-lg font-playfair shrink-0 shadow-md"
          style={{ backgroundColor: member.color || '#004643' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-teal text-base font-playfair truncate">
            {member.name}
          </h3>
          <span className="text-xs text-teal-400 flex items-center gap-1">
            <span className="w-4 h-4 shrink-0 text-teal-400">{RELATION_ICONS[member.relation]}</span>
            <span>{member.relation}</span>
          </span>
        </div>
      </div>

      <div className="bg-teal-50 rounded-xl p-3.5 flex flex-col gap-2">
        <div className="flex justify-between items-center pb-1 border-b border-teal-100/50">
          <span className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold">
            Recorded in {monthName}
          </span>
          <span className="text-sm font-extrabold text-teal">
            {formatCurrency(member.recordedIncome || 0)}
          </span>
        </div>

        {member.incomes && member.incomes.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {member.incomes.map((inc) => (
              <div key={inc._id} className="flex justify-between items-center text-xs pt-1 first:pt-0">
                <div className="min-w-0">
                  <p className="font-semibold text-teal truncate">{inc.source}</p>
                  <p className="text-[10px] text-teal-400">{formatDate(inc.date)}</p>
                </div>
                <span className="font-bold text-teal ml-2">{formatCurrency(inc.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-teal-400 italic text-center py-1">No incomes recorded</p>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-teal-50">
        <button onClick={() => onEdit(member)}
          className="flex-1 btn-secondary text-xs py-2">
          Edit
        </button>
        {member.relation !== 'Self' && (
          <button onClick={() => onDelete(member._id)}
            className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Family() {
  const now = new Date();
  const [members,      setMembers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editingMember,setEditingMember]= useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteImpact, setDeleteImpact] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [summary,      setSummary]      = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [error,        setError]        = useState('');

  const triggerDeleteFlow = async (memberId) => {
    const m = members.find(x => x._id === memberId);
    if (!m) return;
    
    setDeleteTarget(memberId);
    setImpactLoading(true);
    setDeleteImpact(null);
    try {
      const res = await familyService.getDeleteImpact(memberId);
      setDeleteImpact({
        name: m.name,
        incomeCount: res.data?.incomeCount || 0,
        totalAmount: res.data?.totalAmount || 0,
        activeRecurringCount: res.data?.activeRecurringCount || 0,
      });
    } catch (err) {
      console.error(err);
      setDeleteImpact({
        name: m.name,
        incomeCount: 0,
        totalAmount: 0,
        activeRecurringCount: 0,
      });
    } finally {
      setImpactLoading(false);
    }
  };

  const fetchAll = useCallback(async () => {
    Promise.resolve().then(() => {
      setLoading(true);
      setError('');
    });
    try {
      const [famRes, sumRes] = await Promise.all([
        familyService.getMembers({ month: selectedMonth, year: selectedYear }),
        incomeService.getSummary({ month: selectedMonth, year: selectedYear }),
      ]);
      setMembers(famRes.data?.members || []);
      setSummary(sumRes.data || null);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, setLoading, setMembers, setSummary, setError]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAll();
    });
  }, [fetchAll]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await familyService.deleteMember(deleteTarget);
      fetchAll();
    } catch {
      setError('Failed to delete');
    } finally {
      setDeleteTarget(null);
      setDeleteImpact(null);
    }
  };

  const totalFamilyIncome = members.reduce(
    (s, m) => s + (m.recordedIncome || 0), 0
  );

  const selfMember = members.find((m) => m.relation === 'Self');
  const myIncome = selfMember ? (selfMember.recordedIncome || 0) : 0;

  return (
    <div className="page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Family</h1>
            <p className="page-subtitle">
              {members.length} member{members.length !== 1 ? 's' : ''} in your family
            </p>
          </div>
          <button onClick={() => { setEditingMember(null); setShowModal(true); }}
            className="btn-primary">
            + Add Member
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 mb-6">
          <select value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="input w-auto py-1.5 px-3 text-sm">
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input w-auto py-1.5 px-3 text-sm">
            {[2023, 2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Family Summary */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Family Financial Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-teal-50 rounded-xl p-4 text-center">
              <p className="text-xs text-teal-400 uppercase tracking-wider mb-1 font-semibold">
                Family Members
              </p>
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-teal font-playfair truncate">
                {members.length}
              </p>
            </div>
            <div className="bg-teal-50 rounded-xl p-4 text-center">
              <p className="text-xs text-teal-400 uppercase tracking-wider mb-1 font-semibold">
                My Income ({MONTHS[selectedMonth - 1]} {selectedYear})
              </p>
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-teal font-playfair truncate" title={String(formatCurrency(myIncome))}>
                {formatCurrency(myIncome)}
              </p>
            </div>
            <div className="bg-teal-50 rounded-xl p-4 text-center">
              <p className="text-xs text-teal-400 uppercase tracking-wider mb-1 font-semibold">
                Combined Income ({MONTHS[selectedMonth - 1]} {selectedYear})
              </p>
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-teal font-playfair truncate" title={String(formatCurrency(totalFamilyIncome))}>
                {formatCurrency(totalFamilyIncome)}
              </p>
            </div>
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

        {/* Members Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="card p-5 h-44 animate-pulse bg-teal-50" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="card p-12 text-center">
            <svg className="w-12 h-12 text-teal-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-bold text-teal font-playfair mb-2">
              No family members yet
            </h3>
            <p className="text-sm text-teal-400 mb-4">
              Add family members to track combined finances
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              + Add Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <MemberCard
                key={member._id}
                member={member}
                monthName={MONTHS[selectedMonth - 1]}
                onEdit={(m) => { setEditingMember(m); setShowModal(true); }}
                onDelete={triggerDeleteFlow}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <MemberModal
          member={editingMember}
          onClose={() => { setShowModal(false); setEditingMember(null); }}
          onSaved={() => { setShowModal(false); setEditingMember(null); fetchAll(); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove Family Member"
        message={
          impactLoading
            ? "Calculating delete impact..."
            : deleteImpact
            ? `Deleting ${deleteImpact.name} will archive them and their ${deleteImpact.incomeCount} income records (${formatCurrency(deleteImpact.totalAmount)} total). ${deleteImpact.activeRecurringCount} active recurring income(s) will stop generating new entries. Their historical data stays intact. Continue?`
            : "This member will be removed from your family group."
        }
        confirmLabel={impactLoading ? "Loading..." : "Remove"}
        onConfirm={impactLoading ? () => {} : handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteImpact(null); }}
      />
    </div>
  );
}