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
