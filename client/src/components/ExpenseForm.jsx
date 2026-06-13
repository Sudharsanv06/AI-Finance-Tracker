import { useState, useEffect } from 'react';
import expenseService from '../services/expenseService';
import eventService   from '../services/eventService';
import api            from '../services/api';

const CATEGORIES = [
  'Venue','Catering','Decoration','Entertainment',
  'Marketing','Equipment','Staff','Transportation','Others',
];

const PAYMENT_METHODS = [
  'Cash','Bank Transfer','Credit Card','UPI','Cheque','Other',
];

export default function ExpenseForm({ onClose, onSaved, defaultEventId }) {
  const [description,   setDescription]   = useState('');
  const [amount,        setAmount]        = useState('');
  const [category,      setCategory]      = useState('Others');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date,          setDate]          = useState(
    new Date().toISOString().split('T')[0]
  );
  const [eventId,       setEventId]       = useState(defaultEventId || '');
  const [notes,         setNotes]         = useState('');
  const [events,        setEvents]        = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [categorizing,  setCategorizing]  = useState(false);

  // Load events for dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventService.getEvents();
        setEvents(res.data?.events || []);
        if (!defaultEventId && res.data?.events?.length > 0) {
          setEventId(res.data.events[0]._id);
        }
      } catch {
        setError('Failed to load events');
      }
    };
    fetchEvents();
  }, [defaultEventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim())            return setError('Description is required');
    if (!amount || isNaN(amount))       return setError('Valid amount is required');
    if (parseFloat(amount) <= 0)        return setError('Amount must be greater than 0');
    setLoading(true);
    try {
      await expenseService.createExpense({
        description: description.trim(),
        amount:      parseFloat(amount),
        category,
        paymentMethod,
        date,
        eventId:     eventId || null,
        notes:       notes.trim(),
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center
                    justify-center p-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-teal/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl
                      shadow-teal-lg border border-teal-100 p-6
                      animate-scaleIn max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-teal font-playfair">
              Add Expense
            </h2>
            <p className="text-xs text-teal-400 mt-0.5">
              Submit a new expense for approval
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-100
                       flex items-center justify-center text-teal
                       transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50
                          border border-red-200 text-red-600 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Event selector */}
          <div>
            <label className="label">Event (optional)</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="input"
            >
              <option value="">No Event (Optional)</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>{ev.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Venue booking deposit"
              className="input"
              required
            />
            {/* AI Categorize */}
            {description.trim().length > 3 && (
              <button
                type="button"
                disabled={categorizing}
                onClick={async () => {
                  setCategorizing(true);
                  try {
                    const res = await api.post('/ai/categorize', { description });
                    setCategory(res.data.data.category);
                  } catch {
                    // silently fail
                  } finally {
                    setCategorizing(false);
                  }
                }}
                className="mt-1.5 text-xs text-teal font-semibold
                           hover:underline flex items-center gap-1
                           disabled:opacity-50 transition-all"
              >
                {categorizing ? (
                  <><span className="spinner w-3 h-3 border-teal" /> Categorizing...</>
                ) : (
                  '🤖 Auto-categorize with AI'
                )}
              </button>
            )}
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                min="1"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Category + Payment */}
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
              <label className="label">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input"
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
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
              {loading
                ? <span className="spinner" />
                : '+ Submit Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}