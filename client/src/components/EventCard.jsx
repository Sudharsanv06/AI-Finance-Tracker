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

  const canEdit =
    userRole === 'FinanceAdmin' ||
    (userRole === 'Organizer' &&
      event.createdBy?._id ===
        JSON.parse(localStorage.getItem('user') || '{}')._id);

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

      {/* ── Date ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs text-teal-400">
        <span>📅</span>
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
        <div className="bg-red-50 border border-red-200 rounded-xl
                        px-3 py-2 text-xs text-red-600 font-semibold
                        flex items-center gap-1.5">
          ⚠️ Budget exceeded by {formatCurrency(event.spentAmount - event.totalBudget)}
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
        {userRole === 'FinanceAdmin' && (
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