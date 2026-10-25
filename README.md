# MercuReal POS

Offline-first point-of-sale PWA for small Nigerian shops. Mobile-first, built with Vite + React + TypeScript + Tailwind. All data stays on the device (localStorage), works with no network after first load.


## Features

- Tap-to-sell screen with naira prices and live per-item stock
- Cash and transfer checkout, stock auto-deducts per sale
- Today dashboard: revenue, profit, sales count, items sold
- Inventory: add products with cost + selling price, margin shown, +10 restock, low-stock alerts
- Sales log grouped by day with expandable receipts
- Installable PWA, offline after first visit (service worker cache)
- 100% on-device storage, no account, no server

## Stack

- Vite, React 18, TypeScript, Tailwind CSS
- Vitest unit tests for sale math and stock logic
- GitHub Actions CI (test + build on push)

## AI features (20)

Works with a free Groq key (console.groq.com/keys, stored on-device) or degrades to rule-based analysis without one:

1. Daily AI business insights
2. AI restock plan with priorities
3. Pricing advisor (thin/wide margin flags)
4. Cashflow advisor (take-home vs expenses vs credit)
5. AI weekly business report
6. Product trend detection (rising / cooling items)
7. 7-day sales forecast (linear trend)
8. Slow-day anomaly alerts
9. Best-seller ranking
10. Ask-my-books chat over live sales, stock, credit and expenses data
11. AI debt-collection message drafts
12. Voice sale entry ("sold 2 bread and 3 milk")
13. Typo-tolerant smart product search
14. AI product category + emoji suggestions
15. Bulk product import from messy pasted lists
16. AI receipt thank-you notes
17. Rule-based fallback for every AI card (works with no key)
18. Take-home dashboard (profit minus expenses)
19. Auto restock list from stock levels
20. Key stays on-device, stored only in localStorage

## Setup

```bash
npm install
npm run dev      # local dev
npm run test     # unit tests
npm run build    # production build to dist/
```

## Notes

- Profit = (selling price − cost) × qty, per sale and per day
- Stock changes from sales are stored as deltas so they never clash with inventory edits
- Seed products are included on first load; edit or delete them in Stock

## License

MIT
