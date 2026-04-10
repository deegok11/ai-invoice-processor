import { APPROVAL_THRESHOLDS } from '../constants';
import type { ApprovalLevel } from '../types';

export function determineApprovalLevel(total: number): ApprovalLevel {
  if (total < APPROVAL_THRESHOLDS.AUTO_APPROVE_MAX) {
    return 'auto';
  }
  if (total <= APPROVAL_THRESHOLDS.MANAGER_APPROVE_MAX) {
    return 'manager';
  }
  return 'manager_finance';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
