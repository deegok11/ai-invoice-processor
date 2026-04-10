export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Vendor {
  id: string;
  name: string;
  aliases: string[];
  gst: string;
}

export interface InvoiceData {
  vendorName: string;
  invoiceNo: string;
  date: string;
  lineItems: LineItem[];
  tax: number;
  total: number;
}

export interface VendorMatchResult {
  vendorName: string;
  matchedVendor: string;
  confidence: number;
  confirmed: boolean;
  overridden: boolean;
}

export type ApprovalLevel = 'auto' | 'manager' | 'manager_finance';

export type ApprovalStatus = 'pending' | 'manager_approved' | 'approved' | 'rejected';

export interface ApprovalState {
  level: ApprovalLevel;
  status: ApprovalStatus;
  managerApproved: boolean;
  financeApproved: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
}

export interface ExtractedRecord {
  id: string;
  fileName: string;
  extractedAt: Date;
  data: InvoiceData;
}

export type AppStep = 'upload' | 'preview' | 'extracted' | 'matched' | 'approval' | 'complete';
