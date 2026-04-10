import { useState, useCallback, useMemo } from 'react';
import type { ExtractedRecord, InvoiceData, ApprovalStatus, UserRole } from '../types';
import { InvoiceTable } from './InvoiceTable';
import { formatCurrency } from '../utils/approval';

export type ApprovalAction = 'manager_approve' | 'finance_approve' | 'reject';

interface ExtractedDataTabProps {
  records: ExtractedRecord[];
  userRole: UserRole;
  onUpdate: (id: string, data: InvoiceData) => void;
  onDelete: (id: string) => void;
  onApproveRecord: (id: string, action: ApprovalAction) => void;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const STATUS_BADGE: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'approval-badge--pending' },
  manager_approved: { label: 'Manager Approved', className: 'approval-badge--manager' },
  approved: { label: 'Approved', className: 'approval-badge--approved' },
  rejected: { label: 'Rejected', className: 'approval-badge--rejected' },
};

const ROLE_VIEW_CONFIG: Record<UserRole, { title: string; subtitle: (n: number) => string; emptyMsg: string }> = {
  manager: {
    title: '📋 Invoices Awaiting Your Approval',
    subtitle: (n) => `${n} invoice${n !== 1 ? 's' : ''} pending manager approval`,
    emptyMsg: 'No invoices are currently awaiting your approval.',
  },
  finance_head: {
    title: '📋 Invoices Awaiting Your Approval',
    subtitle: (n) => `${n} invoice${n !== 1 ? 's' : ''} pending finance approval`,
    emptyMsg: 'No invoices are currently awaiting your approval.',
  },
  employee: {
    title: '📋 Extracted Invoice Data',
    subtitle: (n) => `${n} invoice${n !== 1 ? 's' : ''} extracted this session`,
    emptyMsg: 'No invoices extracted yet in this session.',
  },
};

function isActionableForRole(record: ExtractedRecord, role: UserRole): boolean {
  const a = record.approval;
  if (!a || a.level === 'auto') return false;
  if (role === 'manager') {
    return a.status === 'pending';
  }
  if (role === 'finance_head') {
    return a.status === 'pending' || a.status === 'manager_approved';
  }
  return true; // employee sees everything
}

export function ExtractedDataTab({ records, userRole, onUpdate, onDelete, onApproveRecord }: ExtractedDataTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleRecords = useMemo(
    () => (userRole === 'employee' ? records : records.filter((r) => isActionableForRole(r, userRole))),
    [records, userRole]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleAction = useCallback(
    (e: React.MouseEvent, id: string, action: ApprovalAction) => {
      e.stopPropagation();
      onApproveRecord(id, action);
    },
    [onApproveRecord]
  );

  const config = ROLE_VIEW_CONFIG[userRole];

  if (visibleRecords.length === 0) {
    return (
      <div className="extracted-tab">
        <div className="extracted-tab-header">
          <h3 className="extracted-tab-title">{config.title}</h3>
          <p className="extracted-tab-subtitle">{config.emptyMsg}</p>
        </div>
        <div className="extracted-empty">
          <span className="extracted-empty-icon">{userRole === 'employee' ? '📄' : '✅'}</span>
          <p>
            {userRole === 'employee'
              ? <>Switch to <strong>Process Invoice</strong> to upload and extract your first invoice.</>
              : 'All invoices have been actioned — nothing pending your review.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="extracted-tab">
      <div className="extracted-tab-header">
        <h3 className="extracted-tab-title">{config.title}</h3>
        <p className="extracted-tab-subtitle">{config.subtitle(visibleRecords.length)}</p>
      </div>

      <div className="extracted-list">
        {visibleRecords.map((record) => (
          <div key={record.id} className={`extracted-record ${expandedId === record.id ? 'expanded' : ''}`}>
            <div className="extracted-record-summary" onClick={() => toggleExpand(record.id)}>
              <div className="extracted-record-chevron">
                {expandedId === record.id ? '▾' : '▸'}
              </div>
              <div className="extracted-record-info">
                <span className="extracted-record-filename">{record.fileName}</span>
                <span className="extracted-record-meta">
                  {record.data.vendorName || '—'} · Invoice #{record.data.invoiceNo || '—'} · {formatDateTime(record.extractedAt)}
                </span>
              </div>
              <div className="extracted-record-total">
                {formatCurrency(record.data.total)}
              </div>
              {record.approval ? (
                <span className={`approval-badge ${STATUS_BADGE[record.approval.status].className}`}>
                  {STATUS_BADGE[record.approval.status].label}
                </span>
              ) : (
                <span className="approval-badge approval-badge--none">No Approval</span>
              )}

              {/* Inline approval actions for manager / finance_head */}
              {record.approval &&
                record.approval.level !== 'auto' &&
                record.approval.status !== 'approved' &&
                record.approval.status !== 'rejected' && (
                  <div className="extracted-record-actions">
                    {!record.approval.managerApproved &&
                      record.approval.status === 'pending' &&
                      (userRole === 'manager' || userRole === 'finance_head') && (
                        <button
                          className="btn btn-primary btn-sm"
                          title="Approve as Manager"
                          onClick={(e) => handleAction(e, record.id, 'manager_approve')}
                        >
                          ✓ Manager Approve
                        </button>
                      )}

                    {record.approval.level === 'manager_finance' &&
                      record.approval.managerApproved &&
                      !record.approval.financeApproved &&
                      record.approval.status === 'manager_approved' &&
                      userRole === 'finance_head' && (
                        <button
                          className="btn btn-primary btn-sm"
                          title="Final approval as Finance Head"
                          onClick={(e) => handleAction(e, record.id, 'finance_approve')}
                        >
                          ✓ Finance Approve
                        </button>
                      )}

                    {(userRole === 'manager' || userRole === 'finance_head') && (
                      <button
                        className="btn btn-danger btn-sm"
                        title="Reject invoice"
                        onClick={(e) => handleAction(e, record.id, 'reject')}
                      >
                        ✕ Reject
                      </button>
                    )}
                  </div>
                )}

              <button
                className="btn btn-danger btn-sm extracted-record-delete"
                onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                title="Remove record"
              >
                ✕
              </button>
            </div>

            {expandedId === record.id && (
              <div className="extracted-record-body">
                <InvoiceTable
                  data={record.data}
                  onUpdate={(updated) => onUpdate(record.id, updated)}
                  editable={true}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
