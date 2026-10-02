/* ============================================================
   Finance Tracker — app.js
   Vanilla JS | LocalStorage | Chart.js
   Features:
     - Add / delete transactions (name, amount, type, category, date)
     - Form validation
     - Total balance, income & expense summary
     - Pie chart (spending by category) — updates live
     - Custom categories
     - Monthly summary view with prev/next navigation
     - Sort transactions (date, amount, category)
     - Spending limit with highlight & alert
     - Dark / light mode toggle (persisted)
   ============================================================ */

'use strict';

/* ── Constants ── */
const STORAGE_KEY_TRANSACTIONS  = 'ft_transactions';
const STORAGE_KEY_CATEGORIES    = 'ft_custom_categories';
const STORAGE_KEY_THEME         = 'ft_theme';
const STORAGE_KEY_LIMIT         = 'ft_spending_limit';

const CATEGORY_ICONS = {
  Food:      '🍔',
  Transport: '🚗',
  Fun:       '🎮',
  Health:    '💊',
  Shopping:  '🛍️',
  Bills:     '💡',
  Income:    '💼',
  Other:     '📦',
};

const CHART_PALETTE = [
  '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
  '#14b8a6', '#a855f7', '#64748b', '#84cc16',
];

/* ── State ── */
let transactions    = [];
let customCategories = [];
let spendingLimit   = 0;
let chart           = null;

// Month navigation: track offset from "today"
let monthOffset = 0;

/* ══════════════════════════════════════════
   INITIALISATION
══════════════════════════════════════════ */
function init() {
  loadFromStorage();
  applyTheme(getSavedTheme());
  setDefaultDate();
  renderAll();
  bindEvents();
}

/* ── Load everything from localStorage ── */
function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
  transactions = raw ? JSON.parse(raw) : [];

  const rawCats = localStorage.getItem(STORAGE_KEY_CATEGORIES);
  customCategories = rawCats ? JSON.parse(rawCats) : [];

  spendingLimit = parseFloat(localStorage.getItem(STORAGE_KEY_LIMIT)) || 0;
}

/* ── Persist transactions ── */
function saveTransactions() {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
}

/* ── Persist custom categories ── */
function saveCategories() {
  localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(customCategories));
}

/* ── Set today as default date in the form ── */
function setDefaultDate() {
  const dateInput = document.getElementById('date');
  dateInput.value = new Date().toISOString().split('T')[0];
}

/* ══════════════════════════════════════════
   EVENT BINDING
══════════════════════════════════════════ */
function bindEvents() {
  // Form submit
  document.getElementById('transactionForm').addEventListener('submit', handleFormSubmit);

  // Sort change
  document.getElementById('sortBy').addEventListener('change', renderTransactionList);

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Custom category
  document.getElementById('addCategoryBtn').addEventListener('click', handleAddCategory);
  document.getElementById('customCategoryInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
  });

  // Spending limit
  document.getElementById('setLimitBtn').addEventListener('click', handleSetLimit);
  document.getElementById('spendingLimitInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSetLimit(); }
  });

  // Month navigation
  document.getElementById('prevMonth').addEventListener('click', () => {
    monthOffset--;
    renderMonthlySummary();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    monthOffset++;
    renderMonthlySummary();
  });
}

/* ══════════════════════════════════════════
   FORM HANDLING & VALIDATION
══════════════════════════════════════════ */
function handleFormSubmit(e) {
  e.preventDefault();
  clearErrors();

  const name     = document.getElementById('itemName').value.trim();
  const amountRaw = document.getElementById('amount').value.trim();
  const type     = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const date     = document.getElementById('date').value || new Date().toISOString().split('T')[0];

  let valid = true;

  if (!name) {
    showError('itemName', 'itemNameError', 'Item name is required.');
    valid = false;
  }

  const amount = parseFloat(amountRaw);
  if (!amountRaw || isNaN(amount) || amount <= 0) {
    showError('amount', 'amountError', 'Enter a valid positive amount.');
    valid = false;
  }

  if (!category) {
    showError('category', 'categoryError', 'Please select a category.');
    valid = false;
  }

  if (!valid) return;

  const transaction = {
    id:       generateId(),
    name,
    amount,
    type,      // 'income' | 'expense'
    category,
    date,
  };

  transactions.push(transaction);
  saveTransactions();
  renderAll();
  resetForm();
}

function showError(fieldId, errorId, message) {
  document.getElementById(fieldId).classList.add('error');
  document.getElementById(errorId).textContent = message;
}

function clearErrors() {
  ['itemName', 'amount', 'category'].forEach((id) => {
    document.getElementById(id).classList.remove('error');
  });
  ['itemNameError', 'amountError', 'categoryError'].forEach((id) => {
    document.getElementById(id).textContent = '';
  });
}

function resetForm() {
  document.getElementById('itemName').value  = '';
  document.getElementById('amount').value    = '';
  document.getElementById('type').value      = 'expense';
  setDefaultDate();
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ══════════════════════════════════════════
   DELETE TRANSACTION
══════════════════════════════════════════ */
function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions();
  renderAll();
}

/* ══════════════════════════════════════════
   RENDER ALL
══════════════════════════════════════════ */
function renderAll() {
  renderBalance();
  renderTransactionList();
  renderChart();
  renderMonthlySummary();
  renderCustomCategories();
  renderLimitDisplay();
  checkSpendingLimit();
}

/* ══════════════════════════════════════════
   BALANCE
══════════════════════════════════════════ */
function renderBalance() {
  const income   = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance  = income - expenses;

  document.getElementById('totalBalance').textContent  = formatCurrency(balance);
  document.getElementById('totalIncome').textContent   = formatCurrency(income);
  document.getElementById('totalExpenses').textContent = formatCurrency(expenses);
}

/* ══════════════════════════════════════════
   TRANSACTION LIST (with sorting)
══════════════════════════════════════════ */
function renderTransactionList() {
  const container  = document.getElementById('transactionList');
  const emptyState = document.getElementById('emptyState');
  const sortBy     = document.getElementById('sortBy').value;

  const sorted = getSortedTransactions(sortBy);

  if (sorted.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // Get current month's expense total for limit highlighting
  const { year: limitYear, month: limitMonth } = getCurrentYearMonth(0);
  const monthlyExpenses = getMonthlyExpenses(limitYear, limitMonth);

  container.innerHTML = sorted.map((t) => {
    const icon        = getCategoryIcon(t.category);
    const amountClass = t.type === 'income' ? 'income' : 'expense';
    const sign        = t.type === 'income' ? '+' : '-';
    const dateStr     = formatDate(t.date);

    // Highlight if this expense transaction contributed to exceeding the limit
    const isOverLimit = spendingLimit > 0
      && t.type === 'expense'
      && monthlyExpenses > spendingLimit
      && isSameMonth(t.date, limitYear, limitMonth);

    return `
      <div class="transaction-item${isOverLimit ? ' over-limit' : ''}" role="listitem" data-id="${t.id}">
        <div class="t-icon" aria-hidden="true">${icon}</div>
        <div class="t-info">
          <div class="t-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</div>
          <div class="t-meta">${escapeHtml(t.category)} &bull; ${dateStr}</div>
        </div>
        <div class="t-amount ${amountClass}">${sign}${formatCurrency(t.amount)}</div>
        <button class="t-delete" aria-label="Delete ${escapeHtml(t.name)}" data-id="${t.id}">✕</button>
      </div>
    `;
  }).join('');

  // Delegate delete clicks
  container.querySelectorAll('.t-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteTransaction(btn.dataset.id));
  });
}

function getSortedTransactions(sortBy) {
  const list = [...transactions];
  switch (sortBy) {
    case 'date-desc':    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
    case 'date-asc':     return list.sort((a, b) => new Date(a.date) - new Date(b.date));
    case 'amount-desc':  return list.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':   return list.sort((a, b) => a.amount - b.amount);
    case 'category':     return list.sort((a, b) => a.category.localeCompare(b.category));
    default:             return list;
  }
}

/* ══════════════════════════════════════════
   PIE CHART
══════════════════════════════════════════ */
function renderChart() {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.error('Chart.js not loaded yet');
    return;
  }

  const canvas    = document.getElementById('spendingChart');
  const emptyMsg  = document.getElementById('chartEmpty');
  const expenses  = transactions.filter((t) => t.type === 'expense');

  if (expenses.length === 0) {
    canvas.style.display = 'none';
    emptyMsg.style.display = 'block';
    if (chart) { chart.destroy(); chart = null; }
    return;
  }

  canvas.style.display = 'block';
  emptyMsg.style.display = 'none';

  // Aggregate by category
  const totals = {};
  expenses.forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(totals);
  const data   = Object.values(totals);
  const colors = labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);

  if (chart) {
    // Update existing chart instead of recreating
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update('none'); // 'none' mode for instant update without animation
    return;
  }

  // Get 2D context (Chart.js 4 can accept canvas or context)
  const ctx = canvas.getContext('2d');
  
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: getComputedStyle(document.body).getPropertyValue('--clr-surface').trim() || '#fff',
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 14,
            boxWidth: 12,
            font: { size: 12 },
            color: getComputedStyle(document.body).getPropertyValue('--clr-text').trim() || '#000',
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

/* ══════════════════════════════════════════
   MONTHLY SUMMARY
══════════════════════════════════════════ */
function renderMonthlySummary() {
  const { year, month } = getCurrentYearMonth(monthOffset);
  const label = new Date(year, month, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  document.getElementById('currentMonthLabel').textContent = label;

  const monthTx = transactions.filter((t) => isSameMonth(t.date, year, month));

  const income   = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance  = income - expenses;

  // Category breakdown for expenses
  const catTotals = {};
  monthTx.filter((t) => t.type === 'expense').forEach((t) => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  const content = document.getElementById('monthlySummaryContent');

  if (monthTx.length === 0) {
    content.innerHTML = '<p class="summary-empty">No transactions this month.</p>';
    return;
  }

  const catRows = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `
      <div class="summary-cat-item">
        <span>${getCategoryIcon(cat)} ${escapeHtml(cat)}</span>
        <span>${formatCurrency(amt)}</span>
      </div>
    `).join('');

  content.innerHTML = `
    <div class="summary-row">
      <span class="s-label">Income</span>
      <span class="s-income">${formatCurrency(income)}</span>
    </div>
    <div class="summary-row">
      <span class="s-label">Expenses</span>
      <span class="s-expense">${formatCurrency(expenses)}</span>
    </div>
    <div class="summary-row">
      <span class="s-label">Net Balance</span>
      <span class="s-balance" style="color:${balance >= 0 ? 'var(--clr-income)' : 'var(--clr-expense)'}">
        ${formatCurrency(balance)}
      </span>
    </div>
    ${catRows ? `<div class="summary-cat-list">${catRows}</div>` : ''}
  `;
}

/* ── Month helper: get {year, month} for an offset from today ── */
function getCurrentYearMonth(offset) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/* ── Check whether a date string falls in a given year/month ── */
function isSameMonth(dateStr, year, month) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getFullYear() === year && d.getMonth() === month;
}

/* ── Get total expenses for a year/month ── */
function getMonthlyExpenses(year, month) {
  return transactions
    .filter((t) => t.type === 'expense' && isSameMonth(t.date, year, month))
    .reduce((s, t) => s + t.amount, 0);
}

/* ══════════════════════════════════════════
   CUSTOM CATEGORIES
══════════════════════════════════════════ */
function handleAddCategory() {
  const input = document.getElementById('customCategoryInput');
  const name  = input.value.trim();

  if (!name) return;

  // Prevent duplicates (case-insensitive)
  const allCategories = getDefaultCategories().concat(customCategories);
  if (allCategories.some((c) => c.toLowerCase() === name.toLowerCase())) {
    input.style.borderColor = 'var(--clr-expense)';
    setTimeout(() => { input.style.borderColor = ''; }, 1500);
    return;
  }

  customCategories.push(name);
  saveCategories();
  input.value = '';
  renderCustomCategories();
  addOptionToSelect(name);
}

function removeCustomCategory(name) {
  customCategories = customCategories.filter((c) => c !== name);
  saveCategories();
  renderCustomCategories();
  removeOptionFromSelect(name);
}

function renderCustomCategories() {
  const list = document.getElementById('customCategoryList');
  if (customCategories.length === 0) {
    list.innerHTML = '';
    return;
  }
  list.innerHTML = customCategories.map((cat) => `
    <span class="tag">
      ${escapeHtml(cat)}
      <button aria-label="Remove ${escapeHtml(cat)}" data-cat="${escapeHtml(cat)}">✕</button>
    </span>
  `).join('');

  list.querySelectorAll('button[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => removeCustomCategory(btn.dataset.cat));
  });

  // Also ensure the select has these options
  syncCategorySelect();
}

function syncCategorySelect() {
  const select = document.getElementById('category');
  // Remove options that no longer exist in customCategories
  Array.from(select.options).forEach((opt) => {
    if (!getDefaultCategories().includes(opt.value) && !customCategories.includes(opt.value)) {
      select.removeChild(opt);
    }
  });
  // Add missing custom options
  customCategories.forEach((cat) => {
    if (!Array.from(select.options).some((o) => o.value === cat)) {
      addOptionToSelect(cat);
    }
  });
}

function addOptionToSelect(name) {
  const select = document.getElementById('category');
  if (Array.from(select.options).some((o) => o.value === name)) return;
  const opt = document.createElement('option');
  opt.value       = name;
  opt.textContent = `${getCategoryIcon(name)} ${name}`;
  select.appendChild(opt);
}

function removeOptionFromSelect(name) {
  const select = document.getElementById('category');
  Array.from(select.options).forEach((opt) => {
    if (opt.value === name) select.removeChild(opt);
  });
}

function getDefaultCategories() {
  return ['Food', 'Transport', 'Fun', 'Health', 'Shopping', 'Bills', 'Income'];
}

/* ══════════════════════════════════════════
   SPENDING LIMIT
══════════════════════════════════════════ */
function handleSetLimit() {
  const input = document.getElementById('spendingLimitInput');
  const value = parseFloat(input.value);
  if (isNaN(value) || value < 0) return;

  spendingLimit = value;
  localStorage.setItem(STORAGE_KEY_LIMIT, spendingLimit);
  input.value = '';
  renderLimitDisplay();
  checkSpendingLimit();
  renderTransactionList(); // re-render to update highlights
}

function renderLimitDisplay() {
  const el = document.getElementById('limitDisplay');
  if (spendingLimit > 0) {
    const { year, month } = getCurrentYearMonth(0);
    const spent = getMonthlyExpenses(year, month);
    el.textContent = `Limit: ${formatCurrency(spendingLimit)} | Spent this month: ${formatCurrency(spent)}`;
    document.getElementById('spendingLimitInput').placeholder = formatCurrency(spendingLimit);
  } else {
    el.textContent = 'No limit set.';
    document.getElementById('spendingLimitInput').placeholder = 'e.g. 500';
  }
}

function checkSpendingLimit() {
  const alert = document.getElementById('limitAlert');
  if (spendingLimit <= 0) { alert.classList.add('hidden'); return; }

  const { year, month } = getCurrentYearMonth(0);
  const spent = getMonthlyExpenses(year, month);

  if (spent > spendingLimit) {
    alert.classList.remove('hidden');
    alert.textContent = `⚠️ Monthly spending limit exceeded! ${formatCurrency(spent)} / ${formatCurrency(spendingLimit)}`;
  } else {
    alert.classList.add('hidden');
  }
}

/* ══════════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════════ */
function toggleTheme() {
  const body = document.body;
  const isDark = body.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
}

function applyTheme(theme) {
  const body   = document.body;
  const button = document.getElementById('themeToggle');
  if (theme === 'dark') {
    body.classList.add('dark');
    body.classList.remove('light');
    button.textContent = '☀️';
    button.title = 'Switch to light mode';
  } else {
    body.classList.add('light');
    body.classList.remove('dark');
    button.textContent = '🌙';
    button.title = 'Switch to dark mode';
  }
  localStorage.setItem(STORAGE_KEY_THEME, theme);

  // Update chart colors if chart exists
  if (chart) {
    chart.destroy();
    chart = null;
    renderChart();
  }
}

function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY_THEME) || 'light';
}

/* ══════════════════════════════════════════
   UTILITY FUNCTIONS
══════════════════════════════════════════ */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || '📦';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init);
