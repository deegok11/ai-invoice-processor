---
name: react-feature
description: "**WORKFLOW SKILL** — Scaffold a new React feature end-to-end following project conventions. USE FOR: adding a new UI feature, creating components with props/state, wiring services/utils, updating types and constants, adding styles. DO NOT USE FOR: bug fixes, refactoring existing code, non-React work. INVOKES: file system tools, terminal (type-check), subagent for codebase exploration."
argument-hint: "Describe the feature (e.g., 'add invoice history sidebar with search')"
---

# React Feature Development

Build a new feature in a React + TypeScript project following established patterns. Produces types, utilities/services, components, wiring, and styles — in that order.

## When to Use

- Adding a new user-facing feature (component, page section, workflow step)
- Creating a new service integration or utility
- Expanding an existing feature with new sub-components

## Pre-Flight

Before starting, gather context:

1. **Read `src/types.ts`** — understand existing type landscape
2. **Read `src/constants.ts`** — check for relevant config values
3. **Scan `src/components/`** — identify patterns (props interfaces, export style, hooks usage)
4. **Read `src/App.tsx`** — understand current state shape and data flow
5. **Read `src/App.css`** — understand class naming and styling patterns
6. **Review [React Best Practices](./references/react-best-practices.md)** — apply performance patterns (waterfalls, bundle size, re-render optimization)

Confirm the feature doesn't already partially exist before creating new files.

## Procedure

Work through each step sequentially. Mark each complete before moving on.

### Step 1 — Define Types

**File:** `src/types.ts`

- Add new `interface` entries for data shapes (e.g., `InvoiceData`, `LineItem`)
- Add new `type` entries for unions/enums (e.g., `ApprovalStatus`, `AppStep`)
- Follow conventions:
  - `interface` for object contracts
  - `type` for string literal unions
  - PascalCase names
  - Export everything; single source of truth for types
- If the feature adds a new app step, extend the `AppStep` union

### Step 2 — Add Constants

**File:** `src/constants.ts`

- Add thresholds, master lists, or config the feature needs
- Use `export const` with `as const` for literal types where appropriate
- Use UPPER_SNAKE_CASE for constant names
- Keep this file as the single source of config truth

### Step 3 — Build Utilities / Services

**Location:** `src/utils/` or `src/services/`

- **Utils** (`src/utils/`) — pure functions for business logic, formatting, calculations
- **Services** (`src/services/`) — external API calls, async operations, side effects

Conventions:
- One file per logical domain (e.g., `fuzzyMatch.ts`, `approval.ts`, `llm.ts`)
- Export only the public API; keep helpers private (unexported)
- Use `async/await` for async operations (not raw Promises)
- Parse/validate external data at the boundary — return typed objects
- Import types with `import type { ... }` syntax

### Step 4 — Create Components

**Location:** `src/components/{ComponentName}.tsx`

One file per component. Follow this template:

```tsx
import type { SomeType } from '../types';

interface ComponentNameProps {
  data: SomeType;
  onAction: (value: string) => void;
}

export function ComponentName({ data, onAction }: ComponentNameProps) {
  // local state with useState
  // event handlers with useCallback
  // return JSX
}
```

**Rules:**
- Named export: `export function ComponentName`
- Props interface: `{ComponentName}Props` defined in the same file
- Destructure props in function signature
- Use `useCallback` for event handlers passed to children or used in effects
- Use `useState` for local component state
- Use `import type` for type-only imports
- Conditional rendering via `{condition && <JSX />}` or ternaries
- No inline styles — use CSS classes

### Step 5 — Wire into App

**File:** `src/App.tsx`

1. **Import** the new component and any new utils/services
2. **Add state** — group with a comment label (`// Feature state`)
3. **Add handlers** — wrap in `useCallback`, include `addAuditEntry` calls for audit logging
4. **Render** — place in the correct step/section of the JSX, respect the step-based flow (`upload` → `extracted` → `approval`)
5. **Connect** — pass state as props, handlers as callbacks

State management conventions:
- All feature state lives in `App.tsx` (lifted state)
- Unidirectional data flow: App → Components via props, Components → App via callbacks
- `useCallback` for all handler functions with proper dependency arrays
- Nullable state for optional data: `useState<Type | null>(null)`

Audit logging:
- Call `addAuditEntry(action, details)` for every user-facing action (button clicks, submissions, confirmations)
- Also log errors: wrap async operations in try/catch and call `addAuditEntry('Error', message)` in the catch block
- Use descriptive action names: `'Upload'`, `'Extraction'`, `'Vendor Override'`, `'Approved'`, `'Error'`

### Step 6 — Add Styles

**File:** `src/App.css`

Add styles at the bottom of the file within a section comment:

```css
/* ===== Feature Name ===== */
.feature-name { ... }
.feature-name-child { ... }
```

Naming conventions:
- Parent: `.feature-name` (kebab-case matching component purpose)
- Children: `.feature-name-child`
- State modifiers: `.active`, `.disabled`, `.error`
- Button variants: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-sm`

Layout patterns used in this project:
- CSS Grid for page layout
- Flexbox for component internals
- Hardcoded color values (no CSS variables)
- `border-radius: 6-10px` for rounded corners
- `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` for card elevation

### Step 7 — Verify

1. Run `npx tsc -b` — must produce zero errors
2. Check that `npx vite build` succeeds
3. Review: does the feature follow the existing patterns in every file it touches?

## Quality Checklist

Before marking complete, verify:

- [ ] New types in `types.ts`, not scattered across files
- [ ] Constants in `constants.ts`, not hardcoded in components
- [ ] Props interface named `{Component}Props` in each component file
- [ ] All components use named exports (not default)
- [ ] `import type` used for type-only imports
- [ ] `useCallback` wraps handler functions in App.tsx
- [ ] State grouped with comment labels in App.tsx
- [ ] Audit log calls added for user-facing actions
- [ ] CSS classes follow kebab-case naming with section comments
- [ ] Responsive styles added (`@media (max-width: 768px)`) if the feature has layout
- [ ] TypeScript compiles with zero errors
- [ ] No inline styles in JSX
- [ ] Error paths log to audit via `addAuditEntry('Error', ...)`
- [ ] No sequential `await` where `Promise.all` would work
- [ ] Derived values computed during render, not stored in state + effect

## References

- [React Best Practices (Vercel)](./references/react-best-practices.md) — 40+ performance rules by impact, distilled from Vercel engineering
