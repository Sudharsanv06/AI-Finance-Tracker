import React, { useState, useEffect } from 'react';
import {
  formatCurrency,
  formatDate,
  truncate,
} from '../utils/helpers';
import ApprovalActions from './ApprovalActions';
import ConfirmModal    from './ConfirmModal';
import expenseService  from '../services/expenseService';

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

export default function ExpenseTable({
  expenses,
  userRole,
  onRefresh,
  onEdit,
}) {
  const [expandedRow,  setExpandedRow]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading,setDeleteLoading]= useState(false);

  const [localExpenses, setLocalExpenses] = useState(expenses);

  // Sync with parent
  useEffect(() => {
    Promise.resolve().then(() => {
      setLocalExpenses(expenses);
    });
  }, [expenses]);

  const handleStatusChange = (id, newStatus) => {
    setLocalExpenses((prev) =>
      prev.map((e) =>
        e._id === id ? { ...e, approvalStatus: newStatus } : e
      )
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await expenseService.deleteExpense(deleteTarget);
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  if (!localExpenses.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-teal-400 text-sm">No expenses found</p>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-teal-100 bg-teal-50/50">
                {['Date','Description','Event',
                  'Category','Amount','Status & Actions',''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold
                               text-teal-500 uppercase tracking-wider
                               whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-teal-50">
              {localExpenses.map((expense) => (
                <React.Fragment key={expense._id}>
                  <tr
                    onClick={() =>
                      setExpandedRow(
                        expandedRow === expense._id
                          ? null
                          : expense._id
                      )
                    }
                    className="hover:bg-teal-50/30 transition-colors
                               cursor-pointer group"
                  >
                    {/* Date */}
                    <td className="px-4 py-3 text-sm text-teal-600
                                   whitespace-nowrap">
                      {formatDate(expense.date)}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-teal
                                    group-hover:text-teal-600
                                    transition-colors">
                        {truncate(expense.description, 35)}
                      </p>
                      {expense.notes && (
                        <p className="text-xs text-teal-400 mt-0.5">
                          {truncate(expense.notes, 30)}
                        </p>
                      )}
                    </td>

                    {/* Event */}
                    <td className="px-4 py-3 text-sm text-teal-500
                                   whitespace-nowrap">
                      {truncate(expense.eventId?.name || '—', 20)}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1
                                       rounded-lg bg-teal-50
                                       text-teal border border-teal-100 flex items-center gap-1.5 w-fit">
                        <span>{CATEGORY_ICONS[expense.category] || CATEGORY_ICONS.Others}</span>
                        <span>{expense.category}</span>
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-sm font-bold
                                   text-teal whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </td>

                    {/* Approval Actions */}
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ApprovalActions
                        expense={expense}
                        userRole={userRole}
                        onStatusChange={handleStatusChange}
                      />
                    </td>

                    {/* Edit / Delete */}
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit && onEdit(expense)}
                          className="text-teal-300 hover:text-teal transition-colors text-sm"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(expense._id)}
                          className="text-teal-300 hover:text-red-500
                                     transition-colors text-sm"
                          title="Delete"
                        >
                          <svg className="w-4 h-4 text-red-500 hover:text-red-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row detail */}
                  {expandedRow === expense._id && (
                    <tr
                      className="bg-teal-50/20"
                    >
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4
                                        gap-4 text-xs">
                          <div>
                            <p className="text-teal-400 uppercase
                                          tracking-wider mb-1">
                              Submitted By
                            </p>
                            <p className="font-semibold text-teal">
                              {expense.submittedBy?.name || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-teal-400 uppercase
                                          tracking-wider mb-1">
                              Payment Method
                            </p>
                            <p className="font-semibold text-teal">
                              {expense.paymentMethod || '—'}
                            </p>
                          </div>
                          {expense.approvedBy && (
                            <div>
                              <p className="text-teal-400 uppercase
                                            tracking-wider mb-1">
                                Reviewed By
                              </p>
                              <p className="font-semibold text-teal">
                                {expense.approvedBy?.name}
                              </p>
                            </div>
                          )}
                          {expense.rejectionReason && (
                            <div className="col-span-2">
                              <p className="text-red-400 uppercase
                                            tracking-wider mb-1">
                                Rejection Reason
                              </p>
                              <p className="font-semibold text-red-600">
                                {expense.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Expense"
        message="This expense will be permanently deleted."
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}