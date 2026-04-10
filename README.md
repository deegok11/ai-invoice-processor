# AI Invoice Processor

A single-page React + TypeScript application that processes invoices using AI (LLM) extraction, fuzzy vendor matching, tiered approval workflows, and a real-time audit log.

## Features

- **Document Upload** — Drag-and-drop or browse for PDF/image invoices
- **AI Data Extraction** — Sends documents to OpenAI GPT-4o or Google Gemini to extract structured invoice fields (vendor, invoice #, date, line items, tax, total)
- **Editable Review Table** — Extracted data displayed in a clean editable table for manual corrections before proceeding
- **Fuzzy Vendor Matching** — Extracted vendor name auto-matched against a hardcoded master list using Fuse.js; shows confidence %, highlights low-confidence matches (<80%), supports manual override
- **Tiered Approval Workflow** — Amount-based routing:
  - < ₹10,000 → Auto-approve
  - ₹10,000–₹1,00,000 → Manager approval required
  - \> ₹1,00,000 → Manager + Finance Head approval required
- **Visual Status Tracker** — Step-by-step progress from Pending → Approved/Rejected
- **Session Audit Log** — Timestamped activity feed of every action (upload, extraction, match, approvals)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| LLM | OpenAI GPT-4o / Google Gemini (client-side API calls) |
| PDF Parsing | pdfjs-dist |
| Fuzzy Search | Fuse.js |
| Styling | Plain CSS (no external UI library) |

## Setup Instructions

### Prerequisites

- Node.js >= 18
- An API key for **OpenAI** or **Google Gemini**

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Production Build

```bash
npm run build
npm run preview
```

### Usage

1. Enter your LLM API key (OpenAI or Gemini) on the configuration screen
2. Upload a PDF or image of an invoice
3. Review and edit the AI-extracted data
4. Confirm or override the fuzzy vendor match
5. Proceed through the approval workflow
6. View the audit trail in the sidebar

## Design Decisions

### Client-Side Architecture
The entire application runs in the browser — no backend server. API calls to OpenAI/Gemini are made directly from the client. This keeps deployment simple but means the API key is stored in browser memory (session only, never persisted to storage).

### LLM Integration Strategy
- **Images**: Sent as base64 to the vision-capable model (GPT-4o or Gemini) for layout-aware extraction
- **PDFs**: Rendered to high-resolution images (2× scale) client-side via pdfjs-dist canvas rendering, then sent as base64 images to the vision model. This ensures scanned and image-based PDFs are handled correctly, unlike text-layer extraction which fails on non-selectable content.

### Fuzzy Matching with Fuse.js
Fuse.js was chosen for client-side fuzzy search because it supports weighted multi-key search (vendor name + aliases), returns a normalized score, and has zero dependencies. The confidence threshold of 80% balances between catching close matches and flagging uncertain ones.

### Approval Workflow
The three-tier approval system uses simple threshold logic with state tracking. The status tracker visually shows progress through the approval chain. Auto-approval for small amounts reduces friction.

### State Management
React useState + useCallback was chosen over external state management libraries since the app is single-page with straightforward data flow. All state is session-scoped and resets on page refresh.

## Known Limitations

1. **API Key Exposure** — API keys are sent directly from the browser. In production, calls should be proxied through a backend to protect keys.
2. **No Persistence** — All data (invoices, approvals, audit log) lives in React state and is lost on page refresh. A real system would need a database.
3. **Single Invoice at a Time** — The app processes one invoice per session flow. A production system would need a queue/list view.
4. **PDF Image Rendering Cost** — PDFs are rendered to high-resolution images (2× scale) before sending to the LLM, which increases token usage compared to text-based extraction. Very large multi-page PDFs may be expensive to process.
5. **No Authentication** — Approval roles (Manager, Finance Head) are simulated with buttons. A real system would need user authentication and role-based access.
6. **Hardcoded Vendor List** — The master vendor list is static. A production system would load this from a database/API.
7. **No Offline Support** — Requires internet for LLM API calls.
8. **Token Limits** — Very large invoices may exceed LLM context window limits.

## Project Structure

```
src/
├── components/
│   ├── ApiKeyInput.tsx      # LLM provider/key configuration
│   ├── ApprovalWorkflow.tsx # Tiered approval with status tracker
│   ├── AuditLog.tsx         # Timestamped activity feed
│   ├── FileUpload.tsx       # Drag-and-drop file upload
│   ├── InvoiceTable.tsx     # Editable extracted data table
│   └── VendorMatch.tsx      # Fuzzy match display + override
├── services/
│   └── llm.ts              # OpenAI / Gemini API integration
├── utils/
│   ├── approval.ts          # Approval level logic + currency formatting
│   └── fuzzyMatch.ts        # Fuse.js vendor matching
├── App.tsx                  # Main app with state orchestration
├── App.css                  # All component styles
├── constants.ts             # Vendor list, thresholds
├── types.ts                 # TypeScript interfaces
├── index.css                # Global reset
└── main.tsx                 # Entry point
```
