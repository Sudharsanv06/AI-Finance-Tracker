import { useNavigate } from 'react-router-dom';
import {
  formatCurrency,
  formatDate,
  getUtilization,
  getUtilizationBarColor,
  getStatusBadgeClass,
} from '../utils/helpers';
import BudgetRing from './BudgetRing';

export default function EventCard({ event, onEdit, onDelete, userRole }) {
  const navigate    = useNavigate();
  const utilization = getUtilization(event.spentAmount, event.totalBudget);
  const barColor    = getUtilizationBarColor(utilization);
  const isOver      = event.spentAmount > event.totalBudget;

  const canEdit = true;

  return (
    <div className="card card-hover p-5 animate-fadeIn flex flex-col gap-4">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-teal text-base font-playfair
                         truncate leading-snug">
            {event.name}
          </h3>
          {event.category && (
            <p className="text-xs text-teal-400 mt-0.5">{event.category}</p>
          )}
        </div>
        <span className={getStatusBadgeClass(event.status)}>
          {event.status}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-teal-400">
        <svg className="w-4 h-4 text-teal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{formatDate(event.date)}</span>
      </div>

      {/* ── Budget Ring + Stats ──────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <BudgetRing spent={event.spentAmount} total={event.totalBudget} />

        <div className="flex-1 space-y-2">
          {/* Budget bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-teal-400">Budget Used</span>
              <span className={`font-semibold ${
                isOver ? 'text-red-600' : 'text-teal'
              }`}>
                {utilization}%
              </span>
            </div>
            <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all
                            duration-500 ${barColor}`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </div>

          {/* Amount chips */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-teal-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-teal-400 uppercase
                            tracking-wide">Budget</p>
              <p className="text-xs font-bold text-teal truncate">
                {formatCurrency(event.totalBudget)}
              </p>
            </div>
            <div className={`rounded-lg p-2 text-center ${
              isOver ? 'bg-red-50' : 'bg-green-50'
            }`}>
              <p className="text-[10px] text-teal-400 uppercase
                            tracking-wide">Spent</p>
              <p className={`text-xs font-bold truncate ${
                isOver ? 'text-red-600' : 'text-green-700'
              }`}>
                {formatCurrency(event.spentAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Over Budget Warning ──────────────────────────────────── */}
      {isOver && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 font-semibold flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Budget exceeded by {formatCurrency(event.spentAmount - event.totalBudget)}</span>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div className="flex gap-2 pt-1 border-t border-teal-50">
        <button
          onClick={() => navigate(`/expenses?eventId=${event._id}`)}
          className="flex-1 btn-secondary text-xs py-2"
        >
          View Expenses
        </button>
        {canEdit && (
          <button
            onClick={() => onEdit && onEdit(event)}
            className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100
                       text-teal text-xs font-semibold transition-all"
          >
            Edit
          </button>
        )}
        {true && (
          <button
            onClick={() => onDelete && onDelete(event._id)}
            className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100
                       text-red-600 text-xs font-semibold transition-all"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}