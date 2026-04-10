# Copilot Instructions — AI Invoice Processor

## Project Overview
A client-side React + TypeScript SPA that extracts invoice data from uploaded PDFs/images using AI (OpenAI GPT-4o or Google Gemini), performs fuzzy vendor matching, routes invoices through a tiered approval workflow, and maintains a session audit log. There is **no backend** — all logic runs in the browser.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 8 |
| LLM | OpenAI GPT-4o · Google Gemini (`@google/genai` SDK) |
| PDF parsing | `pdfjs-dist` (static top-level import, worker via `import.meta.url`) |
| Fuzzy search | `fuse.js` |
| Styling | Plain CSS in `src/App.css` — **no CSS frameworks or UI component libraries** |

---

## Repository Structure
```
src/
├── components/           # One component per file, named exports only
│   ├── ApiKeyInput.tsx
│   ├── ApprovalWorkflow.tsx
│   ├── AuditLog.tsx
│   ├── ExtractedDataTab.tsx
│   ├── FilePreview.tsx
│   ├── FileUpload.tsx
│   ├── InvoiceTable.tsx
│   ├── VendorManager.tsx
│   └── VendorMatch.tsx
├── services/
│   └── llm.ts            # All LLM API calls (OpenAI + Gemini)
├── utils/
│   ├── approval.ts       # Approval level logic + formatCurrency (INR)
│   └── fuzzyMatch.ts     # Fuse.js vendor matching (accepts vendor list param)
├── App.tsx               # Root component — all app state lives here
├── App.css               # All styles — single file, sectioned with comments
├── constants.ts          # Seed data: MASTER_VENDOR_LIST, DEFAULT_EXTRACTED_RECORDS, thresholds
├── types.ts              # All TypeScript interfaces and type aliases
├── index.css             # Global reset only
└── main.tsx              # Entry point
```

---

## Code Conventions

### TypeScript
- All interfaces go in `src/types.ts`; import with `import type { ... }`
- Use `interface` for object shapes, `type` for unions/aliases
- Avoid `any`; use `unknown` with type guards where needed
- All component prop interfaces are defined in the same file as the component (not in `types.ts`)

### Components
- **Named exports only** — no default exports from component files
- Props interface defined inline above the component function
- Use `useCallback` for all event handlers and functions passed as props
- Use `useMemo` for expensive derived values (e.g. vendor name lists)
- Keep components focused — pass data down as props, lift state to `App.tsx`

### State Management
- All global app state lives in `App.tsx` using `useState` + `useCallback`
- No external state management library (no Redux, Zustand, etc.)
- State is session-scoped and intentionally resets on page refresh

### Constants & Seed Data
- All static seed data lives in `src/constants.ts` as typed exported constants
- Follow the existing pattern: `MASTER_VENDOR_LIST` (vendors), `DEFAULT_EXTRACTED_RECORDS` (invoices)
- Always type seed data arrays explicitly (e.g. `const FOO: FooType[] = [...]`)
- Include `id` fields on all seeded records (use short string IDs like `'v1'`, `'er1'`)

### Styling
- All styles go in `src/App.css` — no inline styles, no CSS modules, no Tailwind
- Add new sections with a `/* ===== Section Name ===== */` header comment
- Use BEM-like class names (`.component-element`, `.component-element--modifier`)
- Existing design tokens to reuse:
  - Primary blue: `#4361ee`
  - Dark navy: `#1a1a2e` / `#16213e`
  - Success teal: `#2ec4b6`
  - Background: `#f5f7fa`
  - Card shadow: `0 1px 3px rgba(0,0,0,0.08)`
  - Border radius: `8px` (cards), `6px` (inputs/buttons), `10px` (panels)
- Responsive breakpoint: `@media (max-width: 768px)`

### Currency & Numbers
- Always format monetary values using `formatCurrency()` from `src/utils/approval.ts`
- Currency is **INR (₹)** — use `en-IN` locale
- Approval thresholds: auto-approve < ₹10k, manager ₹10k–₹1L, manager+finance > ₹1L

---

## LLM Integration Rules
- **OpenAI**: raw `fetch` to `https://api.openai.com/v1/chat/completions`
- **Gemini**: use `@google/genai` SDK (`GoogleGenAI` class, `ai.models.generateContent`)
- API keys are passed **per call** — never stored in module scope or localStorage
- Images → base64 inline data; PDFs → text extracted via `pdfjs-dist` then sent as text
- Always parse LLM responses with `parseExtractedJSON()` which strips markdown fences

---

## Navigation & Views
The app has three top-level views (tabs), in this order:
1. **📋 Extracted Data** — session history of extracted invoices (editable table, accordion)
2. **🏢 Manage Vendors** — CRUD table for the vendor master list
3. **🧾 Process Invoice** — upload → preview → extract → review → approval workflow

Tab state is `activeView: 'extracted' | 'vendors' | 'invoice'` in `App.tsx`.

---

## Audit Log
Every significant user action must call `addAuditEntry(action, details)` in `App.tsx`.
Standard action labels: `'Configuration'`, `'Upload'`, `'Extraction'`, `'Vendor Match'`, `'Vendor Confirmed'`, `'Vendor Override'`, `'Vendor Added'`, `'Vendor Updated'`, `'Vendor Deleted'`, `'Auto-Approved'`, `'Approval Required'`, `'Manager Approved'`, `'Approved'`, `'Rejected'`, `'Reset'`, `'Record Removed'`.

---

## Do Not
- Do not add a backend server or API proxy
- Do not persist any data to `localStorage` or `sessionStorage`
- Do not install UI component libraries (MUI, Ant Design, Chakra, shadcn, etc.)
- Do not use default exports for components
- Do not create a module-level `Fuse` instance — create one per call in `fuzzyMatchVendor`
- Do not use the Gemini REST API directly — always use the `@google/genai` SDK
- Do not use dynamic `import()` for `pdfjs-dist` — it is a static top-level import
