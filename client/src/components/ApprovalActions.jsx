import { useState } from 'react';
import expenseService from '../services/expenseService';

export default function ApprovalActions({
  expense,
  userRole,
  onStatusChange,
}) {
  const [loading,      setLoading]      = useState(null);
  const [showReject,   setShowReject]   = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const status = expense.approvalStatus;

  const statusConfig = {
    Pending:  {
      label: 'Pending',
      cls:   'badge-pending',
      dot:   'bg-amber-500',
    },
    Approved: {
      label: 'Approved',
      cls:   'badge-approved',
      dot:   'bg-green-500',
    },
    Rejected: {
      label: 'Rejected',
      cls:   'badge-rejected',
      dot:   'bg-red-500',
    },
    Paid:     {
      label: 'Paid',
      cls:   'badge-paid',
      dot:   'bg-teal',
    },
  };

  const s = statusConfig[status] || statusConfig.Pending;

  const handleApprove = async () => {
    setLoading('approve');
    try {
      await expenseService.approveExpense(expense._id);
      onStatusChange && onStatusChange(expense._id, 'Approved');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setShowReject(true);
      return;
    }
    setLoading('reject');
    try {
      await expenseService.rejectExpense(expense._id, rejectReason);
      onStatusChange && onStatusChange(expense._id, 'Rejected');
      setShowReject(false);
      setRejectReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    } finally {
      setLoading(null);
    }
  };

  const handlePay = async () => {
    setLoading('pay');
    try {
      await expenseService.markAsPaid(expense._id);
      onStatusChange && onStatusChange(expense._id, 'Paid');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">

      {/* Status badge */}
      <span className={`badge ${s.cls} self-start`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>

      {/* Reject reason input */}
      {showReject && (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="input text-xs py-1.5 flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleReject()}
            autoFocus
          />
          <button
            onClick={() => {
              setShowReject(false);
              setRejectReason('');
            }}
            className="px-2 py-1 rounded-lg bg-teal-50 text-teal
                       text-xs hover:bg-teal-100 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1.5 flex-wrap">

        {/* Approver: approve + reject pending */}
        {userRole === 'Approver' && status === 'Pending' && (
          <>
            <button
              onClick={handleApprove}
              disabled={!!loading}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold
                         bg-green-50 hover:bg-green-100 text-green-700
                         border border-green-200 disabled:opacity-50
                         transition-all flex items-center gap-1"
            >
              {loading === 'approve'
                ? <span className="spinner w-3 h-3" />
                : '✓'} Approve
            </button>
            <button
              onClick={handleReject}
              disabled={!!loading}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold
                         bg-red-50 hover:bg-red-100 text-red-600
                         border border-red-200 disabled:opacity-50
                         transition-all flex items-center gap-1"
            >
              {loading === 'reject'
                ? <span className="spinner w-3 h-3" />
                : '✕'} Reject
            </button>
          </>
        )}

        {/* FinanceAdmin: full control */}
        {userRole === 'FinanceAdmin' && (
          <>
            {status === 'Pending' && (
              <button
                onClick={handleApprove}
                disabled={!!loading}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold
                           bg-green-50 hover:bg-green-100 text-green-700
                           border border-green-200 disabled:opacity-50
                           transition-all flex items-center gap-1"
              >
                {loading === 'approve'
                  ? <span className="spinner w-3 h-3" />
                  : '✓'} Approve
              </button>
            )}
            {status === 'Approved' && (
              <button
                onClick={handlePay}
                disabled={!!loading}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold
                           bg-teal-50 hover:bg-teal-100 text-teal
                           border border-teal-200 disabled:opacity-50
                           transition-all flex items-center gap-1"
              >
                {loading === 'pay'
                  ? <span className="spinner w-3 h-3" />
                  : '💳'} Mark Paid
              </button>
            )}
            {(status === 'Pending' || status === 'Approved') && (
              <button
                onClick={handleReject}
                disabled={!!loading}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold
                           bg-red-50 hover:bg-red-100 text-red-600
                           border border-red-200 disabled:opacity-50
                           transition-all flex items-center gap-1"
              >
                {loading === 'reject'
                  ? <span className="spinner w-3 h-3" />
                  : '✕'} Reject
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}