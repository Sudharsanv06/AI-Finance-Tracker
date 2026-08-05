import { useState, useEffect } from 'react';
import expenseService from '../services/expenseService';
import eventService   from '../services/eventService';
import api            from '../services/api';

const CATEGORIES = [
  'Venue','Catering','Decoration','Entertainment',
  'Marketing','Equipment','Staff','Transportation','Others',
];

const CATEGORY_ICONS = {
  Venue: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Catering: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5v14M7 5v14" />
    </svg>
  ),
  Decoration: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Entertainment: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  Marketing: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  Equipment: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Staff: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Transportation: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm0 0h5a2 2 0 002-2v-4a2 2 0 00-2-2H9m-4 6H3m14-1H3M13 13V9a2 2 0 012-2h3.5a1.5 1.5 0 011.5 1.5V13a2 2 0 01-2 2H17m-4-1h4m1 3a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  ),
  Others: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </svg>
  ),
};

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
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
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

          {/* Category Selector */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all ${
                    category === c
                      ? 'border-teal bg-teal-50 text-teal'
                      : 'border-teal-100 text-teal-400 hover:border-teal-200'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_ICONS[c]}</span>
                  <span className="text-[9px] font-semibold leading-tight">{c}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
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