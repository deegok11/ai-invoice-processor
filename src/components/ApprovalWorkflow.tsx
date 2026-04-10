import type { ApprovalState } from '../types';
import { formatCurrency } from '../utils/approval';

interface ApprovalWorkflowProps {
  total: number;
  approval: ApprovalState;
  onManagerApprove: () => void;
  onFinanceApprove: () => void;
  onReject: () => void;
}

export function ApprovalWorkflow({
  total,
  approval,
  onManagerApprove,
  onFinanceApprove,
  onReject,
}: ApprovalWorkflowProps) {
  const isTerminal = approval.status === 'approved' || approval.status === 'rejected';

  return (
    <div className="approval-workflow">
      <h3>Approval Workflow</h3>

      <div className="approval-info">
        <span>Invoice Total: <strong>{formatCurrency(total)}</strong></span>
        <span className={`approval-level level-${approval.level}`}>
          {approval.level === 'auto' && '✓ Auto-approved (< ₹10,000)'}
          {approval.level === 'manager' && 'Requires Manager Approval (₹10K – ₹1L)'}
          {approval.level === 'manager_finance' &&
            'Requires Manager + Finance Head Approval (> ₹1L)'}
        </span>
      </div>

      {/* Status Tracker */}
      <div className="status-tracker">
        <div className={`status-step ${approval.status !== 'rejected' ? 'active' : ''}`}>
          <div className="step-dot" />
          <span>Submitted</span>
        </div>
        <div className="status-line" />

        {approval.level === 'auto' ? (
          <>
            <div className={`status-step ${approval.status === 'approved' ? 'active' : ''}`}>
              <div className="step-dot" />
              <span>Auto-Approved</span>
            </div>
          </>
        ) : (
          <>
            <div
              className={`status-step ${
                approval.managerApproved || approval.status === 'approved' ? 'active' : ''
              } ${approval.status === 'rejected' ? 'rejected' : ''}`}
            >
              <div className="step-dot" />
              <span>Manager</span>
            </div>
            <div className="status-line" />

            {approval.level === 'manager_finance' && (
              <>
                <div
                  className={`status-step ${
                    approval.financeApproved || approval.status === 'approved' ? 'active' : ''
                  } ${approval.status === 'rejected' ? 'rejected' : ''}`}
                >
                  <div className="step-dot" />
                  <span>Finance Head</span>
                </div>
                <div className="status-line" />
              </>
            )}

            <div
              className={`status-step ${approval.status === 'approved' ? 'active approved' : ''} ${
                approval.status === 'rejected' ? 'active rejected' : ''
              }`}
            >
              <div className="step-dot" />
              <span>{approval.status === 'rejected' ? 'Rejected' : 'Approved'}</span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      {approval.level !== 'auto' && !isTerminal && (
        <div className="approval-actions">
          {!approval.managerApproved && (
            <button className="btn btn-primary" onClick={onManagerApprove}>
              Manager Approve
            </button>
          )}

          {approval.level === 'manager_finance' &&
            approval.managerApproved &&
            !approval.financeApproved && (
              <button className="btn btn-primary" onClick={onFinanceApprove}>
                Finance Head Approve
              </button>
            )}

          <button className="btn btn-danger" onClick={onReject}>
            Reject
          </button>
        </div>
      )}

      {isTerminal && (
        <div className={`approval-result ${approval.status}`}>
          {approval.status === 'approved' ? '✓ Invoice Approved' : '✕ Invoice Rejected'}
        </div>
      )}
    </div>
  );
}
