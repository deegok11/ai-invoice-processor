# React Best Practices (Vercel)

> Source: [Vercel Blog — Introducing React Best Practices](https://vercel.com/blog/introducing-react-best-practices)
> Full rules: [vercel-labs/agent-skills/react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)

40+ rules across 8 categories, ordered by impact. Apply these when building new features.

---

## 1. Eliminating Waterfalls — CRITICAL

- **Defer await until needed** — move `await` into the branch that uses the result; don't block early-return paths
- **Promise.all() for independent operations** — never `await` sequentially when calls are independent
- **Check cheap conditions before async flags** — evaluate synchronous guards before awaiting remote flags
- **Dependency-based parallelization** — start dependent tasks at the earliest moment using chained promises

## 2. Bundle Size — CRITICAL

- **Avoid barrel file imports** — import directly from source files, not `index.ts` re-exports
- **Dynamic imports for heavy components** — lazy-load large components not needed on initial render
- **Conditional module loading** — load large data/modules only when a feature is activated
- **Preload based on user intent** — trigger `import()` on hover/focus before the user clicks

## 3. Re-render Optimization — MEDIUM

- **Calculate derived state during rendering** — don't store computed values in state or sync with effects
- **Don't define components inside components** — creates new type each render, destroys state/DOM
- **Use functional setState updates** — `setItems(curr => [...curr, item])` avoids stale closures and dependency churn
- **Use lazy state initialization** — `useState(() => expensiveComputation())` runs only once
- **Narrow effect dependencies** — depend on primitives (`user.id`) not objects (`user`)
- **Put interaction logic in event handlers** — don't model user actions as state + effect
- **Split combined hook computations** — separate `useMemo`/`useEffect` calls with independent deps
- **Use useRef for transient values** — high-frequency updates that don't need re-render (mouse position, timers)
- **Use Transitions for non-urgent updates** — `startTransition(() => setState(...))` keeps UI responsive
- **Use useDeferredValue for expensive derived renders** — keeps input snappy while heavy computation lags behind

## 4. Rendering Performance — MEDIUM

- **CSS `content-visibility: auto`** for long lists — defer off-screen rendering
- **Explicit conditional rendering** — use `count > 0 ? <X/> : null` not `count && <X/>` to avoid rendering `0`
- **Animate SVG wrapper** instead of SVG element — enables hardware acceleration
- **Hoist static JSX elements** — extract constant JSX outside component to avoid re-creation
- **Use `defer` or `async` on script tags** — eliminate render-blocking scripts

## 5. Client-Side Data Fetching — MEDIUM-HIGH

- **Use SWR for automatic deduplication** — multiple instances share one request
- **Passive event listeners for scroll performance** — `{ passive: true }` on touch/wheel listeners
- **Version and minimize localStorage data** — add version prefix, store minimal fields, always try/catch

## 6. JavaScript Performance — LOW-MEDIUM

- **Build index Maps for repeated lookups** — `new Map(items.map(i => [i.id, i]))` for O(1) access
- **Use Set/Map for O(1) membership checks** — replace `array.includes()` in hot paths
- **Use `toSorted()` instead of `sort()`** — immutable sorting prevents React state mutation bugs
- **Combine multiple array iterations** — single `for` loop instead of chained `.filter().map()`
- **Use `flatMap` to map and filter in one pass** — avoids intermediate arrays
- **Early return from functions** — skip unnecessary processing once result is determined
- **Hoist RegExp creation** — don't create `new RegExp()` inside render; use module-level or `useMemo`
- **Cache repeated function calls** — module-level Map for expensive pure functions called in loops
- **Avoid layout thrashing** — batch DOM style writes before reads; prefer CSS classes over inline styles
- **Defer non-critical work with `requestIdleCallback`** — analytics, localStorage saves, prefetching

## 7. Advanced Patterns — LOW

- **Initialize app once, not per mount** — module-level guard instead of `useEffect([], ...)`
- **Store event handlers in refs / useEffectEvent** — stable subscriptions that read latest callback
- **Don't put Effect Events in dependency arrays** — they change identity every render by design

---

## Quick Checklist for New Features

When creating a new component or feature, verify:

1. No sequential `await` where `Promise.all` would work
2. Heavy imports use `React.lazy` / dynamic `import()`
3. Derived values computed during render, not in state + effect
4. `useCallback` handlers use functional `setState`
5. Effect dependencies are primitives, not objects
6. No component definitions nested inside other components
7. Arrays sorted with `toSorted()` not `sort()`
8. Long lists use `content-visibility: auto`
9. Conditional renders use explicit checks (`> 0 ?` not `&&`)
10. Event listeners cleaned up in effect return
