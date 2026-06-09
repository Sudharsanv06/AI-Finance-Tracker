import { useState, useEffect, useCallback } from 'react';
import familyService from '../services/familyService';
import incomeService from '../services/incomeService';
import ConfirmModal  from '../components/ConfirmModal';
import { formatCurrency } from '../utils/helpers';

const RELATIONS = ['Self','Spouse','Parent','Child','Sibling','Other'];

const RELATION_ICONS = {
  Self:    '👤',
  Spouse:  '💑',
  Parent:  '👨‍👩‍👦',
  Child:   '👶',
  Sibling: '👫',
  Other:   '🧑',
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
  const [monthlyIncome, setMonthlyIncome] = useState(member?.monthlyIncome || '');
  const [color,         setColor]         = useState(member?.color         || '#004643');
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
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        color,
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

          <div>
            <label className="label">Monthly Income (₹)</label>
            <input type="number" value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="50000" min="0" className="input" />
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
function MemberCard({ member, onEdit, onDelete }) {
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
          <span className="text-xs text-teal-400">
            {RELATION_ICONS[member.relation]} {member.relation}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-teal-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-teal-400 uppercase tracking-wide mb-0.5">
            Monthly Income
          </p>
          <p className="text-sm font-bold text-teal">
            {formatCurrency(member.monthlyIncome || 0)}
          </p>
        </div>
        <div className="bg-teal-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-teal-400 uppercase tracking-wide mb-0.5">
            Recorded This Month
          </p>
          <p className="text-sm font-bold text-teal">
            {formatCurrency(member.recordedIncome || 0)}
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-teal-50">
        <button onClick={() => onEdit(member)}
          className="flex-1 btn-secondary text-xs py-2">
          Edit
        </button>
        <button onClick={() => onDelete(member._id)}
          className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-all">
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Family() {
  const [members,      setMembers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editingMember,setEditingMember]= useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [summary,      setSummary]      = useState(null);
  const [error,        setError]        = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [famRes, sumRes] = await Promise.all([
        familyService.getMembers(),
        incomeService.getSummary(),
      ]);
      setMembers(famRes.data?.members || []);
      setSummary(sumRes.data || null);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await familyService.deleteMember(deleteTarget);
      fetchAll();
    } catch {
      setError('Failed to delete');
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalFamilyIncome = members.reduce(
    (s, m) => s + (m.monthlyIncome || 0), 0
  );

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

        {/* Family Summary */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Family Financial Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-teal-50 rounded-xl p-4 text-center">
              <p className="text-xs text-teal-400 uppercase tracking-wider mb-1">
                Family Members
              </p>
              <p className="text-2xl font-bold text-teal font-playfair">
                {members.length}
              </p>
            </div>
            <div className="bg-teal-50 rounded-xl p-4 text-center">
              <p className="text-xs text-teal-400 uppercase tracking-wider mb-1">
                Combined Monthly
              </p>
              <p className="text-2xl font-bold text-teal font-playfair">
                {formatCurrency(totalFamilyIncome)}
              </p>
            </div>
            <div className="bg-teal-50 rounded-xl p-4 text-center">
              <p className="text-xs text-teal-400 uppercase tracking-wider mb-1">
                This Month Income
              </p>
              <p className="text-2xl font-bold text-teal font-playfair">
                {formatCurrency(summary?.monthlyTotal || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
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
            <span className="text-4xl mb-3 block">👨‍👩‍👧‍👦</span>
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
                onEdit={(m) => { setEditingMember(m); setShowModal(true); }}
                onDelete={setDeleteTarget}
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
        message="This member will be removed from your family group."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}