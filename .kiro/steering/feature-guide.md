# Finance Tracker — Feature Guide

## Core Features

### 1. Add Transaction (Input Form)
**HTML:** `#transactionForm`
**JS:** `handleFormSubmit()` → `validateForm()` → push to `transactions[]` → `saveTransactions()` → `renderAll()`

Fields:
- **Item Name** — free text, required
- **Amount** — positive number, required
- **Type** — `income` or `expense` (select)
- **Category** — preset or custom (select, required)
- **Date** — date picker, defaults to today

Validation rules:
- Name must not be empty.
- Amount must be a positive number.
- Category must be selected.
- Error messages appear inline below each field via `.field-error` spans.

---

### 2. Transaction List
**HTML:** `#transactionList`
**JS:** `renderTransactionList()`

- Renders all transactions from the sorted array.
- Each item shows: category icon, item name, category + date, amount (color-coded), delete button.
- Items over the spending limit are highlighted with `.over-limit` class.
- Delete calls `deleteTransaction(id)` → filters array → `saveTransactions()` → `renderAll()`.
- Empty state shown when no transactions exist.

---

### 3. Total Balance
**HTML:** `#totalBalance`, `#totalIncome`, `#totalExpenses`
**JS:** `renderBalance()`

- Income = sum of all `type === 'income'` transactions.
- Expenses = sum of all `type === 'expense'` transactions.
- Balance = Income − Expenses.
- Updates automatically on every `renderAll()` call.

---

### 4. Visual Chart (Doughnut)
**HTML:** `<canvas id="spendingChart">`
**JS:** `renderChart()`
**Library:** Chart.js 4 via CDN

- Groups expense transactions by category and sums amounts.
- Uses `CHART_PALETTE` array of 12 colors (cycles if more categories).
- On update, reuses the existing chart instance (`chart.data = ...; chart.update()`).
- Destroyed and recreated when theme changes to pick up new CSS variable colors.
- Hidden with empty-state message when no expenses exist.

---

## Optional Features Implemented

### 5. Custom Categories ✅
**HTML:** `#customCategoryInput`, `#addCategoryBtn`, `#customCategoryList`
**JS:** `handleAddCategory()`, `removeCustomCategory()`, `syncCategorySelect()`

- User types a name and clicks Add (or presses Enter).
- Duplicate detection is case-insensitive across default + custom categories.
- Saved to `ft_custom_categories` in localStorage.
- Tags rendered in `#customCategoryList` with a remove (✕) button.
- Category `<select>` in the form is kept in sync via `syncCategorySelect()`.

---

### 6. Monthly Summary View ✅
**HTML:** `#monthlySummaryContent`, `#currentMonthLabel`, `#prevMonth`, `#nextMonth`
**JS:** `renderMonthlySummary()`

- Tracks a `monthOffset` integer (0 = current month, −1 = last month, etc.).
- Prev/Next buttons decrement/increment `monthOffset` and re-render.
- Shows: total income, total expenses, net balance, and per-category breakdown for expenses.
- Uses `isSameMonth(dateStr, year, month)` to filter transactions.

---

### 7. Sort Transactions ✅
**HTML:** `#sortBy` select
**JS:** `getSortedTransactions(sortBy)`

Available sort options:
| Value          | Behaviour                   |
|----------------|-----------------------------|
| `date-desc`    | Newest first (default)      |
| `date-asc`     | Oldest first                |
| `amount-desc`  | Highest amount first        |
| `amount-asc`   | Lowest amount first         |
| `category`     | Alphabetical by category    |

Sort is applied in `renderTransactionList()` without mutating the source array.

---

### 8. Spending Limit Highlight ✅
**HTML:** `#spendingLimitInput`, `#setLimitBtn`, `#limitDisplay`, `#limitAlert`
**JS:** `handleSetLimit()`, `checkSpendingLimit()`, `renderLimitDisplay()`

- User sets a monthly USD limit; saved to `ft_spending_limit`.
- `checkSpendingLimit()` compares current month's total expenses against the limit.
- If exceeded: `#limitAlert` banner appears at the top.
- Expense transactions from the current month get `.over-limit` CSS class in the list.
- Limit display updates with current month's spend vs limit.

---

### 9. Dark / Light Mode Toggle ✅
**HTML:** `#themeToggle` button in header
**JS:** `toggleTheme()`, `applyTheme(theme)`, `getSavedTheme()`

- Toggles `body.dark` / `body.light` class.
- Theme persisted in `ft_theme` localStorage key.
- Button emoji updates: 🌙 (light mode) / ☀️ (dark mode).
- Chart is destroyed and re-rendered on theme change to pick up updated CSS variable colors.
- All colors use CSS custom properties, so no JS color logic needed beyond triggering re-render.

---

## Data Model

```js
// Transaction object
{
  id:       "1693000000000-abc12",  // timestamp + random suffix
  name:     "Grocery run",
  amount:   42.50,                  // always positive
  type:     "expense",              // "expense" | "income"
  category: "Food",
  date:     "2026-10-02",           // ISO date string YYYY-MM-DD
}
```

## Adding a New Feature Checklist
1. Add any new HTML elements to `index.html` with proper `id`, ARIA labels, and semantic tags.
2. Add styles to `css/styles.css` using CSS custom properties for colors.
3. Add state variables at the top of `app.js` if needed.
4. Add a `localStorage` key constant if persisting new data.
5. Load new data in `loadFromStorage()`.
6. Bind event listeners in `bindEvents()`.
7. Include the new render function in `renderAll()` if it needs to update with every state change.
8. Escape any user-provided strings with `escapeHtml()` before innerHTML insertion.
