import { useState, useEffect } from 'react';
import eventService from '../services/eventService';

const CATEGORIES = [
  'Conference','Wedding','Corporate','Venue','Catering',
  'Decoration','Entertainment','Marketing','Equipment',
  'Staff','Transportation','Others',
];

const STATUSES = ['active','upcoming','draft','completed','cancelled'];

export default function EventForm({ event, onClose, onSaved }) {
  const isEdit = !!event?._id;

  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [date,        setDate]        = useState('');
  const [category,    setCategory]    = useState('Conference');
  const [totalBudget, setTotalBudget] = useState('');
  const [status,      setStatus]      = useState('active');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  // Populate form when editing
  useEffect(() => {
    if (event) {
      setName(event.name || '');
      setDescription(event.description || '');
      setDate(
        event.date
          ? new Date(event.date).toISOString().split('T')[0]
          : ''
      );
      setCategory(event.category  || 'Conference');
      setTotalBudget(event.totalBudget || '');
      setStatus(event.status || 'active');
    }
  }, [event]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim())                         return setError('Event name is required');
    if (!totalBudget || isNaN(totalBudget))   return setError('Valid budget is required');
    if (parseFloat(totalBudget) <= 0)         return setError('Budget must be greater than 0');

    setLoading(true);
    try {
      const payload = {
        name:        name.trim(),
        description: description.trim(),
        date,
        category,
        totalBudget: parseFloat(totalBudget),
        status,
      };

      isEdit
        ? await eventService.updateEvent(event._id, payload)
        : await eventService.createEvent(payload);

      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center
                    justify-center p-4 animate-fadeIn">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-teal/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl
                      shadow-teal-lg border border-teal-100
                      p-6 animate-scaleIn max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-teal font-playfair">
              {isEdit ? 'Edit Event' : 'New Event'}
            </h2>
            <p className="text-xs text-teal-400 mt-0.5">
              {isEdit
                ? 'Update event details'
                : 'Create a new tracked event'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-100
                       flex items-center justify-center text-teal
                       transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50
                          border border-red-200 text-red-600 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Name */}
          <div>
            <label className="label">Event Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual Tech Conference 2025"
              className="input"
              required
            />
          </div>

          {/* Date + Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Event Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Total Budget (₹) *</label>
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder="50000"
                min="1"
                className="input"
                required
              />
            </div>
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input capitalize"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the event..."
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                isEdit ? '✓ Update Event' : '+ Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}