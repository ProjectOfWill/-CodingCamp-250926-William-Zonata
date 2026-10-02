# Finance Tracker — Coding Standards

## General Rules

- `'use strict';` at the top of every JS file.
- ES6+ syntax: `const`/`let`, arrow functions, template literals, destructuring.
- No `var`. No jQuery. No framework imports.
- One CSS file in `css/`. One JS file in `js/`. Do not split or add files.
- All user-facing strings must be HTML-escaped via `escapeHtml()` before insertion into the DOM.

## JavaScript Conventions

### Naming
| Type         | Convention      | Example                   |
|--------------|-----------------|---------------------------|
| Variables    | camelCase        | `spendingLimit`            |
| Functions    | camelCase verbs  | `renderTransactionList()`  |
| Constants    | SCREAMING_SNAKE  | `STORAGE_KEY_TRANSACTIONS` |
| DOM ids      | camelCase        | `totalBalance`             |

### Functions
- One responsibility per function.
- Functions that touch the DOM are named `render*` or `handle*`.
- Pure utility functions go at the bottom under `/* UTILITY FUNCTIONS */`.
- Always call `saveTransactions()` after mutating `transactions`.
- Always call `renderAll()` after any state change that affects multiple views.

### State
All mutable state lives at the module top level:
```js
let transactions     = [];
let customCategories = [];
let spendingLimit    = 0;
let chart            = null;
let monthOffset      = 0;
```
Never store state inside DOM elements or hidden inputs.

### Error Handling
- Validate all form inputs before creating a transaction object.
- Use `showError(fieldId, errorId, message)` / `clearErrors()` helpers for form feedback.
- Wrap localStorage reads in `JSON.parse` with a fallback (`|| []` or `|| 0`).

## CSS Conventions

### Structure Order
1. CSS custom properties (`:root` and `body.dark`)
2. Reset & base styles
3. Layout (header, container, grid)
4. Component styles (cards, forms, buttons, chart, list items)
5. Animations
6. Media queries (mobile-last)

### Variables
All colors, shadows, and radii use CSS custom properties defined in `:root`.
Never hardcode color hex values outside the variable declarations.

```css
/* ✅ Good */
color: var(--clr-expense);

/* ❌ Bad */
color: #ef4444;
```

### Theming
Dark mode is applied by toggling `body.dark`.
Both themes override the same set of custom properties — no duplicate rules needed.

## HTML Conventions

- Use semantic elements: `<header>`, `<main>`, `<section>`, `<footer>`, `<form>`.
- Every interactive element has an `aria-label` or visible `<label>`.
- Every `<section>` has an `aria-label` describing its purpose.
- IDs are used for JS targeting only; classes are used for styling.
- Do not inline styles. Do not use `style=""` attributes.

## Security

- Escape all user-provided strings with `escapeHtml()` before injecting into innerHTML.
- Do not use `eval()` or `new Function()`.
- Data stored in localStorage is untrusted on read — always parse defensively.
