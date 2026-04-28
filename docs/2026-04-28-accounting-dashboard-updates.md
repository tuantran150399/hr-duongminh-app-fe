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

## Additional Update: Language Switcher

Date: `2026-04-28`

### Added functionality

Files:
- `components/AppProviders.js`
- `layouts/DashboardLayout.js`
- `app/accounting/page.js`
- `app/login/page.js`
- `app/layout.js`
- `app/globals.css`

Changes:
- Added a lightweight frontend language system with local storage persistence
- Added a language switcher in the header using Ant Design
- Added country flags for:
  - `English` -> `🇺🇸`
  - `Tiếng Việt` -> `🇻🇳`
- Added Ant Design locale switching for:
  - DatePicker
  - pagination and other Ant Design texts
- Connected translations for key UI areas:
  - header
  - sidebar menu
  - login page
  - accounting dashboard

### Behavior

- The selected language is saved in browser local storage
- The selected language is restored on the next visit
- The app updates the document language attribute dynamically

### Current scope

Currently supported languages:
- English
- Vietnamese

Current translated screens:
- shared dashboard layout
- login page
- accounting page

### Validation

Completed after language feature update:
- `npm run lint`
- production-safe build with:

```powershell
$env:NEXT_PUBLIC_API_URL='https://api.hr.duongminhvn.com/api/v1'; npm run build
```

## Additional Update: Local Static Start

Date: `2026-04-28`

### Problem

Because the project uses:

```js
output: 'export'
```

`next start` does not work for local preview anymore.

### Change

File:
- `package.json`

Updated scripts:

```json
"start": "npx serve@latest out -l 3000",
"start:static": "npx serve@latest out -l 3000"
```

### Local usage

Use:

```powershell
npm run build
npm run start
```

Then open:

```text
http://localhost:3000
```

## Additional Update: Language Trigger Flag

Date: `2026-04-28`

### Change

Files:
- `layouts/DashboardLayout.js`
- `app/globals.css`

Updated the header language switcher trigger so it now displays the selected country flag directly.

Before:
- globe icon
- text code like `VN`

Now:
- the active country flag only
- cleaner Ant Design header action styling
- dropdown options still show both flag and language name

## Additional Update: Production Data and Hydration Fix

Date: `2026-04-28`

### Change

Files:
- `components/AppProviders.js`
- `layouts/DashboardLayout.js`
- `services/*.js`
- `app/dashboard/page.js`
- `app/jobs/page.js`
- `app/jobs/detail/page.js`
- `app/accounting/page.js`
- `app/partners/page.js`

Updates:
- Removed mock-data fallbacks from frontend API services.
- Removed the demo local JWT fallback.
- Reworked the jobs page to use backend data only.
- Added visible error states when backend calls fail.
- Deferred browser-only language and date values until after hydration to prevent React hydration error `#418`.

## Additional Update: Temporary Demo Data Fallback

Date: `2026-04-28`

### Reason

Production backend routes are currently unstable and can return `500` on data endpoints such as:

- `/jobs`
- `/accounting/revenue`
- `/accounting/cost`

To keep the frontend usable for demo and review purposes, the frontend service layer was switched back to hard-data fallback mode.

### Files

- `utils/mockData.js`
- `services/authService.js`
- `services/dashboardService.js`
- `services/jobService.js`
- `services/accountingService.js`
- `services/partnerService.js`

### Behavior

- Frontend still calls the real backend first.
- If the API fails, the app falls back to a shared demo dataset.
- Login also falls back to a demo token when backend login is unavailable.
- Dashboard, jobs, partners, accounting, and job detail continue rendering with demo data.

### Deployment Note

This is a temporary safety mode for demo continuity.

When backend APIs are stable again, these fallbacks should be removed or moved behind an explicit demo-mode flag.
