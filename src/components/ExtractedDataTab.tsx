import { useState, useCallback } from 'react';
import type { ExtractedRecord, InvoiceData } from '../types';
import { InvoiceTable } from './InvoiceTable';
import { formatCurrency } from '../utils/approval';

interface ExtractedDataTabProps {
  records: ExtractedRecord[];
  onUpdate: (id: string, data: InvoiceData) => void;
  onDelete: (id: string) => void;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function ExtractedDataTab({ records, onUpdate, onDelete }: ExtractedDataTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (records.length === 0) {
    return (
      <div className="extracted-tab">
        <div className="extracted-tab-header">
          <h3 className="extracted-tab-title">📋 Extracted Invoice Data</h3>
          <p className="extracted-tab-subtitle">No invoices extracted yet in this session.</p>
        </div>
        <div className="extracted-empty">
          <span className="extracted-empty-icon">📄</span>
          <p>Switch to <strong>Process Invoice</strong> to upload and extract your first invoice.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="extracted-tab">
      <div className="extracted-tab-header">
        <h3 className="extracted-tab-title">📋 Extracted Invoice Data</h3>
        <p className="extracted-tab-subtitle">{records.length} invoice{records.length !== 1 ? 's' : ''} extracted this session</p>
      </div>

      <div className="extracted-list">
        {records.map((record) => (
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
