import type { Vendor, ExtractedRecord } from './types';

export const MASTER_VENDOR_LIST: Vendor[] = [
  { id: 'v1',  name: 'Tata Consultancy Services', aliases: ['TCS', 'Tata CS'],        gst: '27AABCT1234C1Z5' },
  { id: 'v2',  name: 'Infosys Limited',           aliases: ['Infosys', 'Infosys Ltd'], gst: '29AABCI1234D1Z3' },
  { id: 'v3',  name: 'Reliance Industries',        aliases: ['Reliance', 'RIL'],        gst: '27AAACR1234E1Z6' },
  { id: 'v4',  name: 'Wipro Technologies',         aliases: ['Wipro', 'Wipro Tech'],    gst: '29AABCW1234F1Z2' },
  { id: 'v5',  name: 'HCL Technologies',           aliases: ['HCL', 'HCL Tech'],        gst: '06AABCH1234G1Z9' },
  { id: 'v6',  name: 'Mahindra & Mahindra',        aliases: ['Mahindra', 'M&M'],        gst: '27AABCM1234H1Z8' },
  { id: 'v7',  name: 'Larsen & Toubro',            aliases: ['L&T', 'LnT'],             gst: '27AAACL1234I1Z4' },
  { id: 'v8',  name: 'Bajaj Electronics',          aliases: ['Bajaj Elec', 'Bajaj'],    gst: '27AABCB1234J1Z7' },
  { id: 'v9',  name: 'Godrej Industries',          aliases: ['Godrej', 'Godrej Ind'],   gst: '27AABCG1234K1Z1' },
  { id: 'v10', name: 'Bharti Airtel',              aliases: ['Airtel', 'Bharti'],       gst: '07AABCB1234L1Z0' },
];

export const DEFAULT_EXTRACTED_RECORDS: ExtractedRecord[] = [
  {
    id: 'er1',
    fileName: 'tcs_invoice_march2025.pdf',
    extractedAt: new Date('2025-03-15T10:30:00'),
    data: {
      vendorName: 'Tata Consultancy Services',
      invoiceNo: 'TCS-2025-0312',
      date: '2025-03-15',
      lineItems: [
        { description: 'Software Development Services', quantity: 160, unitPrice: 1500, amount: 240000 },
        { description: 'Cloud Infrastructure Support',  quantity: 1,   unitPrice: 35000, amount: 35000  },
      ],
      tax: 49950,
      total: 324950,
    },
  },
  {
    id: 'er2',
    fileName: 'airtel_feb_bill.pdf',
    extractedAt: new Date('2025-02-28T14:15:00'),
    data: {
      vendorName: 'Bharti Airtel',
      invoiceNo: 'AIR-B-20250228',
      date: '2025-02-28',
      lineItems: [
        { description: 'Enterprise Leased Line – 1 Gbps', quantity: 1, unitPrice: 45000, amount: 45000 },
        { description: 'Managed Firewall Service',         quantity: 1, unitPrice: 8000,  amount: 8000  },
      ],
      tax: 9540,
      total: 62540,
    },
  },
  {
    id: 'er3',
    fileName: 'infosys_consulting_jan.pdf',
    extractedAt: new Date('2025-01-20T09:00:00'),
    data: {
      vendorName: 'Infosys Limited',
      invoiceNo: 'INF-JAN-4421',
      date: '2025-01-20',
      lineItems: [
        { description: 'IT Consulting – Digital Transformation', quantity: 80,  unitPrice: 2200, amount: 176000 },
        { description: 'Data Analytics Platform Setup',           quantity: 1,   unitPrice: 75000, amount: 75000 },
        { description: 'Training & Documentation',                quantity: 20,  unitPrice: 1800, amount: 36000  },
      ],
      tax: 52380,
      total: 339380,
    },
  },
  {
    id: 'er4',
    fileName: 'bajaj_electronics_order.pdf',
    extractedAt: new Date('2025-03-05T11:45:00'),
    data: {
      vendorName: 'Bajaj Electronics',
      invoiceNo: 'BAJE-ORD-2025-189',
      date: '2025-03-05',
      lineItems: [
        { description: 'LED Monitors 27"',    quantity: 10, unitPrice: 18000, amount: 180000 },
        { description: 'Keyboard + Mouse Set', quantity: 15, unitPrice: 2500,  amount: 37500  },
        { description: 'UPS 600VA',            quantity: 5,  unitPrice: 4200,  amount: 21000  },
      ],
      tax: 43290,
      total: 281790,
    },
  },
  {
    id: 'er5',
    fileName: 'wipro_q4_services.pdf',
    extractedAt: new Date('2025-03-31T16:00:00'),
    data: {
      vendorName: 'Wipro Technologies',
      invoiceNo: 'WIP-Q4-2025-007',
      date: '2025-03-31',
      lineItems: [
        { description: 'Application Maintenance & Support', quantity: 1, unitPrice: 120000, amount: 120000 },
        { description: 'Security Audit Services',           quantity: 1, unitPrice: 55000,  amount: 55000  },
      ],
      tax: 31500,
      total: 206500,
    },
  },
];

export const APPROVAL_THRESHOLDS = {
  AUTO_APPROVE_MAX: 10000,
  MANAGER_APPROVE_MAX: 100000,
} as const;

export const CONFIDENCE_THRESHOLD = 80;
