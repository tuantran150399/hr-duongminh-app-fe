# Accounting Dashboard Updates

Date: `2026-04-28`

## Summary

This note records the frontend updates made for the accounting dashboard, shared layout improvements, and production build fixes related to the API base URL.

## Updated Areas

### 1. Accounting dashboard redesign

File:
- `app/accounting/page.js`

Changes:
- Added breadcrumb and page context
- Added date range filter
- Added search by job number
- Added status filter
- Added primary actions:
  - `Create Invoice`
  - `Export CSV`
  - `Export Excel`
- Added summary cards:
  - total revenue / cost
  - paid / settled
  - outstanding
  - draft items
- Added a status distribution panel
- Improved Revenue / Cost tabs with stronger active states
- Improved table UX:
  - color-coded status pills
  - right-aligned amount column
  - sorting
  - filtering
  - clearer pagination copy
  - row actions

### 2. Shared dashboard layout improvements

File:
- `layouts/DashboardLayout.js`

Changes:
- Added collapsible sidebar
- Improved active menu states and spacing
- Replaced broken menu icon rendering with real Ant Design icons
- Fixed incorrect accounting navigation label
- Improved header layout and context
- Fixed logout behavior to clear token and redirect correctly

### 3. Styling refresh

File:
- `app/globals.css`

Changes:
- Added modern SaaS-style layout polish
- Improved spacing, cards, shadows, and hierarchy
- Improved sidebar, header, filters, tabs, and table styling
- Added responsive behavior for smaller screens

### 4. Auth guard cleanup

File:
- `components/AuthGuard.js`

Changes:
- Simplified the auth guard
- Removed the previous lint issue caused by synchronous state updates inside `useEffect`

## Production Build / API Base URL Fix

File:
- `services/api.js`

Changes:
- Added safer API base URL resolution
- Local development can still use `http://localhost:3003/api/v1`
- Production fallback now prefers `/api/v1` instead of hard-coded localhost

## Important Deployment Note

The frontend project still has:

- `.env.local` -> local API URL
- `.env.production` -> production API URL

Next.js loads `.env.local` during build, so it can override production values if someone builds carelessly on a local machine.

Safe production build used for the latest deployment artifact:

```powershell
$env:NEXT_PUBLIC_API_URL='https://api.hr.duongminhvn.com/api/v1'; npm run build
```

## Verification

Completed:
- `npm run lint`
- `npm run build`

Production artifact prepared:
- `erp-logistics-static.zip`

## Recommended Next Step

Add a dedicated production build script so future builds do not accidentally use `.env.local` when generating the deployable static output.
