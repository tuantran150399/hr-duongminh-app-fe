# Frontend Implementation Status

Date: `2026-04-28`

## Purpose

This note tracks which backend capabilities are already connected in the frontend and which ones are still pending.

Status labels used in this document:

- `Implemented`: connected and used in the frontend UI
- `Partial`: some backend data is used, but the full workflow is not implemented
- `Not implemented`: backend capability exists, but the frontend does not use it yet

## Current Frontend API Coverage

### Authentication

- `POST /auth/login` -> `Implemented`
- `GET /auth/me` -> `Not implemented in UI flow`

Notes:
- Login is connected on the frontend.
- Profile retrieval exists in the frontend service layer, but is not used by a page or header yet.

## Jobs

- `GET /jobs` -> `Implemented`
- `GET /jobs/:id` -> `Implemented`
- `POST /jobs` -> `Not implemented`
- `PATCH /jobs/:id` -> `Not implemented`
- `PATCH /jobs/:id/start` -> `Not implemented`
- `PATCH /jobs/:id/close` -> `Not implemented`
- `PATCH /jobs/:id/cancel` -> `Not implemented`
- `GET /jobs/:id/milestones` -> `Not implemented`
- `POST /jobs/:id/milestones` -> `Not implemented`
- `PATCH /jobs/:id/milestones/:milestoneId` -> `Not implemented`
- `DELETE /jobs/:id/milestones/:milestoneId` -> `Not implemented`

Notes:
- Job list and job detail data are connected.
- Create job and update job screens currently exist as UI forms, but they do not submit to backend APIs yet.

## Accounting

- `GET /accounting/revenue` -> `Implemented`
- `GET /accounting/cost` -> `Implemented`
- `GET /accounting/revenue/job/:jobId` -> `Implemented`
- `GET /accounting/cost/job/:jobId` -> `Implemented`
- `GET /accounting/profit/job/:jobId` -> `Implemented`
- `POST /accounting/revenue` -> `Not implemented`
- `PATCH /accounting/revenue/:id` -> `Not implemented`
- `PATCH /accounting/revenue/:id/post` -> `Not implemented`
- `POST /accounting/revenue/:id/void` -> `Not implemented`
- `PATCH /accounting/revenue/:id/payment-status` -> `Not implemented`
- `DELETE /accounting/revenue/:id` -> `Not implemented`
- `POST /accounting/cost` -> `Not implemented`
- `PATCH /accounting/cost/:id` -> `Not implemented`
- `PATCH /accounting/cost/:id/post` -> `Not implemented`
- `POST /accounting/cost/:id/void` -> `Not implemented`
- `PATCH /accounting/cost/:id/payment-status` -> `Not implemented`
- `DELETE /accounting/cost/:id` -> `Not implemented`
- `POST /accounting/post-all/job/:jobId` -> `Not implemented`
- `GET /accounting/periods` -> `Not implemented`
- `POST /accounting/periods/lock` -> `Not implemented`
- `POST /accounting/periods/unlock` -> `Not implemented`

Notes:
- The frontend currently uses accounting data for dashboard and job detail views.
- The accounting dashboard is currently read-focused.
- No create, edit, post, void, settlement, or period-lock workflow is connected yet.

## Partners

- `GET /partners` -> `Implemented`
- `GET /partners/:id` -> `Not implemented`
- `POST /partners` -> `Not implemented`
- `PATCH /partners/:id` -> `Not implemented`

Notes:
- Partner list is connected.
- Partner management workflows are not implemented yet.

## Users

- `GET /users` -> `Not implemented`
- `GET /users/me` -> `Not implemented`
- `GET /users/:id` -> `Not implemented`
- `POST /users` -> `Not implemented`
- `PATCH /users/:id` -> `Not implemented`
- `PATCH /users/me/password` -> `Not implemented`
- `DELETE /users/:id` -> `Not implemented`

Notes:
- The frontend `Users` page is currently a placeholder only.

## Roles and Permissions

- `GET /roles` -> `Not implemented`
- `GET /roles/permissions` -> `Not implemented`
- `GET /roles/:id` -> `Not implemented`
- `POST /roles` -> `Not implemented`
- `PATCH /roles/:id` -> `Not implemented`

## Branches

- `GET /branches` -> `Not implemented`
- `GET /branches/:id` -> `Not implemented`
- `POST /branches` -> `Not implemented`
- `PATCH /branches/:id` -> `Not implemented`

## Reports

- `GET /reports/profit/job/:jobId` -> `Not implemented`
- `GET /reports/branch-summary` -> `Not implemented`
- `GET /reports/customer-summary` -> `Not implemented`
- `GET /reports/job-status-summary` -> `Not implemented`
- `GET /reports/receivables` -> `Not implemented`
- `GET /reports/payables` -> `Not implemented`
- `GET /reports/overdue-receivables` -> `Not implemented`
- `GET /reports/overdue-payables` -> `Not implemented`

Notes:
- The frontend dashboard currently calculates summary cards from raw jobs, revenue, and cost calls.
- It does not yet use the backend reporting module.

## Attachments

- `POST /attachments/upload` -> `Not implemented`
- `GET /attachments` -> `Not implemented`
- `GET /attachments/:id` -> `Not implemented`
- `GET /attachments/:id/download` -> `Not implemented`
- `DELETE /attachments/:id` -> `Not implemented`

## Audit Logs

- `GET /audit-logs` -> `Not implemented`
- `GET /audit-logs/:entity/:id` -> `Not implemented`

## Health

- `GET /health` -> `Not implemented`
- `GET /health/db` -> `Not implemented`
- `GET /health/live` -> `Not implemented`

Notes:
- These endpoints are useful for operations and deployment checks, but there is no frontend admin/monitoring page for them yet.

## Page-Level Summary

- `Login` -> `Implemented`
- `Dashboard` -> `Partial`
  Dashboard uses backend totals indirectly from jobs and accounting lists, but does not use reports endpoints.
- `Jobs List` -> `Implemented`
- `Job Detail` -> `Partial`
  Read-only data is connected, but edit/save and milestones are not connected.
- `Job Create` -> `Partial`
  UI exists, but backend create action is not connected.
- `Partners` -> `Partial`
  List is connected, but management actions are missing.
- `Accounting` -> `Partial`
  Read and filtering experience is implemented, but transactional accounting actions are not connected.
- `Users` -> `Not implemented`

## Recommended Next Frontend Priorities

1. Connect job create and update forms to backend APIs.
2. Connect user list and profile APIs so the `Users` page and header can use real data.
3. Add accounting actions for create, update, payment status, and posting.
4. Add milestones and attachments to the job detail flow.
5. Add reporting endpoints to the dashboard for more accurate summaries and charts.

## Additional Update: Backend-Only Data Loading

Date: `2026-04-28`

### Changes

Files:
- `services/authService.js`
- `services/dashboardService.js`
- `services/jobService.js`
- `services/accountingService.js`
- `services/partnerService.js`
- `app/dashboard/page.js`
- `app/jobs/page.js`
- `app/jobs/detail/page.js`
- `app/accounting/page.js`
- `app/partners/page.js`
- `components/AppProviders.js`
- `layouts/DashboardLayout.js`

Updates:
- Removed frontend mock-data fallbacks from API service files.
- Removed the demo local JWT fallback from login.
- Removed the old `utils/mockData.js` dataset.
- Rebuilt the jobs list to render backend data only.
- Removed hard-coded job detail fallback values.
- Added visible error states when backend data cannot be loaded.
- Adjusted language and header date rendering to avoid hydration mismatch errors in production.

### Backend Requirement

The frontend now expects the production backend to be reachable and CORS-enabled for:

```text
https://hr.duongminhvn.com
```

If the backend is unavailable or CORS rejects the origin, the UI will show an error state instead of displaying fake data.

## Additional Update: Current Demo Mode

Date: `2026-04-28`

### Current status

The frontend is temporarily back in fallback demo mode for the following read paths:

- login
- dashboard summary
- jobs list
- job detail
- partners list
- accounting revenue and cost lists

### Notes

- The frontend still attempts live backend requests first.
- If backend requests fail, shared hard data from `utils/mockData.js` is used.
- This keeps the deployed UI functional while production backend `500` issues are being resolved.
