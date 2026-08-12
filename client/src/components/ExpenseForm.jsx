import { useState, useEffect } from 'react';
import expenseService from '../services/expenseService';
import eventService   from '../services/eventService';
import api            from '../services/api';

const BUDGET_CATEGORIES = [
  'Food & Dining','Transportation','Shopping',
  'Entertainment','Health','Education',
  'Utilities','Rent','Groceries',
  'Travel','Personal Care','Other',
];

const EVENT_CATEGORIES = [
  'Venue','Catering','Decoration','Entertainment',
  'Marketing','Equipment','Staff','Transportation','Others',
];

const CATEGORY_ICONS = {
  // Personal budget categories
  'Food & Dining': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5v14M7 5v14" />
    </svg>
  ),
  'Transportation': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm0 0h5a2 2 0 002-2v-4a2 2 0 00-2-2H9m-4 6H3m14-1H3M13 13V9a2 2 0 012-2h3.5a1.5 1.5 0 011.5 1.5V13a2 2 0 01-2 2H17m-4-1h4m1 3a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  ),
  'Shopping': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  'Entertainment': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'Health': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  'Education': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6M4 11v6a1 1 0 001 1h2a1 1 0 001-1v-6" />
    </svg>
  ),
  'Utilities': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'Rent': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  'Groceries': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  'Travel': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  'Personal Care': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  'Other': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </svg>
  ),

  // Event categories
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

export default function ExpenseForm({ onClose, onSaved, defaultEventId, expense }) {
  const isEdit = !!expense?._id;

  const [description,   setDescription]   = useState(expense?.description || '');
  const [amount,        setAmount]        = useState(expense?.amount      || '');
  const [eventId,       setEventId]       = useState(expense?.eventId?._id || expense?.eventId || defaultEventId || '');

  const categoriesList = eventId ? EVENT_CATEGORIES : BUDGET_CATEGORIES;
  const [category,      setCategory]      = useState(expense?.category    || (eventId ? 'Others' : 'Other'));
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod || 'Cash');
  const [date,          setDate]          = useState(
    expense?.date
      ? new Date(expense.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [notes,         setNotes]         = useState(expense?.notes       || '');
  const [events,        setEvents]        = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [categorizing,  setCategorizing]  = useState(false);

  // Auto-adjust category when eventId changes
  useEffect(() => {
    if (!categoriesList.includes(category)) {
      setCategory(categoriesList[0]);
    }
  }, [eventId, categoriesList, category]);

  // Load events for dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventService.getEvents();
        setEvents(res.data?.events || []);
      } catch {
        setError('Failed to load events');
      }
    };
    fetchEvents();
  }, [defaultEventId, expense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim())            return setError('Description is required');
    if (!amount || isNaN(amount))       return setError('Valid amount is required');
    if (parseFloat(amount) <= 0)        return setError('Amount must be greater than 0');
    setLoading(true);
    try {
      const payload = {
        description: description.trim(),
        amount:      parseFloat(amount),
        category,
        paymentMethod,
        date,
        eventId:     eventId || null,
        notes:       notes.trim(),
      };
      if (isEdit) {
        await expenseService.updateExpense(expense._id, payload);
      } else {
        await expenseService.createExpense(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'add'} expense`);
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
              {isEdit ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <p className="text-xs text-teal-400 mt-0.5">
              {isEdit ? 'Update details of this expense' : 'Submit a new expense for approval'}
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
                    const res = await api.post('/ai/categorize', { description, eventId });
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
              {categoriesList.map((c) => (
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
                : isEdit ? '✓ Update' : '+ Submit Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}