import { useState, useEffect, useCallback } from 'react';
import { useAuth }      from '../context/AuthContext';
import eventService     from '../services/eventService';
import EventCard        from '../components/EventCard';
import EventForm        from '../components/EventForm';
import EmptyState       from '../components/EmptyState';
import ConfirmModal     from '../components/ConfirmModal';
import { formatCurrency } from '../utils/helpers';

const STATUS_FILTERS = ['All','active','upcoming','completed','draft'];

function Skeleton() {
  return (
    <div className="card p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-5 bg-teal-100 rounded w-1/2" />
        <div className="h-5 bg-teal-100 rounded-full w-16" />
      </div>
      <div className="h-3 bg-teal-50 rounded w-1/3" />
      <div className="h-2 bg-teal-50 rounded-full w-full" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-12 bg-teal-50 rounded-xl" />
        <div className="h-12 bg-teal-50 rounded-xl" />
      </div>
      <div className="h-9 bg-teal-50 rounded-xl" />
    </div>
  );
}

export default function Events() {
  const { user }                              = useAuth();
  const [events,       setEvents]             = useState([]);
  const [loading,      setLoading]            = useState(true);
  const [error,        setError]              = useState('');
  const [activeFilter, setActiveFilter]       = useState('All');
  const [search,       setSearch]             = useState('');
  const [showForm,     setShowForm]           = useState(false);
  const [editingEvent, setEditingEvent]       = useState(null);
  const [deleteTarget, setDeleteTarget]       = useState(null);
  const [deleteLoading,setDeleteLoading]      = useState(false);

  const userRole  = user?.role || 'Organizer';
  const canCreate = userRole === 'Organizer' || userRole === 'FinanceAdmin';

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await eventService.getEvents();
      setEvents(res.data?.events || []);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Filtered list
  const filtered = events.filter((e) => {
    const matchStatus = activeFilter === 'All' || e.status === activeFilter;
    const q           = search.toLowerCase();
    const matchSearch = !q ||
      e.name?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Stats
  const totalBudget = events.reduce((s, e) => s + (e.totalBudget || 0), 0);
  const totalSpent  = events.reduce((s, e) => s + (e.spentAmount  || 0), 0);
  const overCount   = events.filter(
    (e) => e.spentAmount > e.totalBudget
  ).length;

  const handleEdit   = (event) => { setEditingEvent(event); setShowForm(true); };
  const handleSaved  = () => { setShowForm(false); setEditingEvent(null); fetchEvents(); };
  const handleClose  = () => { setShowForm(false); setEditingEvent(null); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await eventService.deleteEvent(deleteTarget);
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page">
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Events</h1>
            <p className="page-subtitle">
              {loading
                ? 'Loading...'
                : `${events.length} event${events.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => { setEditingEvent(null); setShowForm(true); }}
              className="btn-primary"
            >
              + New Event
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Events',  value: events.length,          icon: '📅' },
            { label: 'Total Budget',  value: formatCurrency(totalBudget), icon: '💰' },
            { label: 'Total Spent',   value: formatCurrency(totalSpent),  icon: '💸' },
          ].map((s) => (
            <div key={s.label}
                 className="card p-4 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-xs text-teal-400 uppercase
                              tracking-wider">{s.label}</p>
                <p className="text-lg font-bold text-teal
                              font-playfair">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Over budget alert */}
        {overCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl
                          px-4 py-3 text-sm text-red-600 font-semibold
                          flex items-center gap-2">
            ⚠️ {overCount} event{overCount > 1 ? 's' : ''} over budget
          </div>
        )}

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 p-1 bg-white border
                          border-teal-100 rounded-xl overflow-x-auto">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold
                            transition-all whitespace-nowrap capitalize ${
                  activeFilter === f
                    ? 'bg-teal text-cream shadow-sm'
                    : 'text-teal-500 hover:text-teal'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2
                             text-teal-300 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="input pl-9"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl
                          px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2
                          xl:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📅"
            title={activeFilter === 'All' ? 'No events yet' : `No ${activeFilter} events`}
            description={
              canCreate
                ? 'Create your first event to start tracking budgets.'
                : 'No events found.'
            }
            action={
              canCreate
                ? { label: '+ New Event',
                    onClick: () => setShowForm(true) }
                : null
            }
          />
        ) : (
          <>
            <p className="text-xs text-teal-400">
              Showing {filtered.length} of {events.length} events
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2
                            xl:grid-cols-3 gap-4">
              {filtered.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  userRole={userRole}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <EventForm
          event={editingEvent}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Event"
        message="This event and all linked expenses will be deleted permanently."
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}