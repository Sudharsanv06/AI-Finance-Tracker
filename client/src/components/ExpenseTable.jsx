import { useState } from 'react';
import {
  formatCurrency,
  formatDate,
  getStatusBadgeClass,
  truncate,
} from '../utils/helpers';
import ApprovalActions from './ApprovalActions';
import ConfirmModal    from './ConfirmModal';
import expenseService  from '../services/expenseService';

export default function ExpenseTable({
  expenses,
  userRole,
  onRefresh,
}) {
  const [expandedRow,  setExpandedRow]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading,setDeleteLoading]= useState(false);

  const [localExpenses, setLocalExpenses] = useState(expenses);

  // Sync with parent
  useState(() => {
    setLocalExpenses(expenses);
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
                <>
                  <tr
                    key={expense._id}
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
                                       text-teal border border-teal-100">
                        {expense.category}
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

                    {/* Delete */}
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(userRole === 'FinanceAdmin' ||
                        expense.submittedBy?._id ===
                          JSON.parse(
                            localStorage.getItem('user') || '{}'
                          )._id) && (
                        <button
                          onClick={() => setDeleteTarget(expense._id)}
                          className="text-teal-300 hover:text-red-500
                                     transition-colors text-sm"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded row detail */}
                  {expandedRow === expense._id && (
                    <tr
                      key={`${expense._id}-expanded`}
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
                </>
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