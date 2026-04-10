import { useMemo } from 'react';
import type { AuditEntry } from '../types';

interface AuditLogProps {
  entries: AuditEntry[];
}

export function AuditLog({ entries }: AuditLogProps) {
  const reversedEntries = useMemo(() => entries.toReversed(), [entries]);

  if (entries.length === 0) {
    return (
      <div className="audit-log">
        <h3>Audit Log</h3>
        <p className="audit-empty">No actions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="audit-log">
      <h3>Audit Log</h3>
      <div className="audit-entries">
        {reversedEntries.map((entry) => (
          <div key={entry.id} className="audit-entry">
            <div className="audit-time">
              {entry.timestamp.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            <div className="audit-content">
              <span className="audit-action">{entry.action}</span>
              {entry.user && <span className="audit-user">{entry.user}</span>}
              <span className="audit-details">{entry.details}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
