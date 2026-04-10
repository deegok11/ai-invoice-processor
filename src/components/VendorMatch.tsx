import { useMemo } from 'react';
import type { Vendor, VendorMatchResult } from '../types';
import { CONFIDENCE_THRESHOLD } from '../constants';
import { getAllVendorNames } from '../utils/fuzzyMatch';

interface VendorMatchProps {
  match: VendorMatchResult;
  vendors: Vendor[];
  onConfirm: () => void;
  onOverride: (vendorName: string) => void;
}

export function VendorMatch({ match, vendors, onConfirm, onOverride }: VendorMatchProps) {
  const isLowConfidence = match.confidence < CONFIDENCE_THRESHOLD;
  const allVendors = useMemo(() => getAllVendorNames(vendors), [vendors]);

  return (
    <div className={`vendor-match ${isLowConfidence ? 'low-confidence-match' : ''}`}>
      <h3>Vendor Matching</h3>

      <div className="match-details">
        <div className="match-row">
          <span className="match-label">Extracted Vendor:</span>
          <span className="match-value">{match.vendorName || '—'}</span>
        </div>

        <div className="match-row">
          <span className="match-label">Best Match:</span>
          <span className={`match-value ${isLowConfidence ? 'low-confidence' : 'high-confidence'}`}>
            {match.matchedVendor || 'No match found'}
          </span>
        </div>

        <div className="match-row">
          <span className="match-label">Confidence:</span>
          <span className={`confidence-badge ${isLowConfidence ? 'low' : 'high'}`}>
            {match.confidence}%
          </span>
        </div>

        {isLowConfidence && (
          <div className="low-confidence-warning">
            ⚠ Confidence is below {CONFIDENCE_THRESHOLD}%. Please verify or override the vendor.
          </div>
        )}
      </div>

      <div className="match-actions">
        {match.matchedVendor && (
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={match.confirmed}
          >
            {match.confirmed ? '✓ Confirmed' : 'Confirm Match'}
          </button>
        )}

        <div className="override-section">
          <label>Override with:</label>
          <select
            onChange={(e) => onOverride(e.target.value)}
            value={match.overridden ? match.matchedVendor : ''}
            // disabled={match.confirmed}
          >
            <option value="">Select vendor...</option>
            {allVendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
