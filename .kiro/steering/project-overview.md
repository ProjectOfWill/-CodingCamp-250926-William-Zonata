# Finance Tracker — Project Overview

## Purpose
A client-side personal finance tracker built with plain HTML, CSS, and vanilla JavaScript.
No build tools, no frameworks, no backend. Open `index.html` directly in a browser.

## Project Structure

```
finance-tracker/
├── index.html               # Single-page app entry point
├── css/
│   └── styles.css           # All styles (one file only)
├── js/
│   └── app.js               # All application logic (one file only)
└── .kiro/
    └── steering/
        ├── project-overview.md   # This file
        ├── coding-standards.md   # Code style & conventions
        └── feature-guide.md      # Feature documentation
```

## Technology Stack

| Layer      | Technology            | Notes                                  |
|------------|-----------------------|----------------------------------------|
| Structure  | HTML5                 | Semantic elements, ARIA attributes     |
| Styling    | CSS3                  | Custom properties, Grid, Flexbox       |
| Logic      | Vanilla JavaScript    | ES6+, strict mode, no frameworks       |
| Charts     | Chart.js 4 (CDN)      | Loaded from jsdelivr CDN               |
| Storage    | localStorage API      | All data client-side only              |

## LocalStorage Keys

| Key                    | Type      | Description                        |
|------------------------|-----------|------------------------------------|
| `ft_transactions`      | JSON array | All transaction records            |
| `ft_custom_categories` | JSON array | User-defined categories            |
| `ft_spending_limit`    | number    | Monthly spending limit in USD      |
| `ft_theme`             | string    | `"light"` or `"dark"`              |

## Entry Point
`init()` in `app.js` bootstraps the app on `DOMContentLoaded`:
1. Loads data from localStorage
2. Applies saved theme
3. Sets today's date in the form
4. Calls `renderAll()` to populate the UI
5. Binds all event listeners

## Browser Compatibility
Targets modern browsers: Chrome, Firefox, Edge, Safari (all current versions).
No polyfills required.
