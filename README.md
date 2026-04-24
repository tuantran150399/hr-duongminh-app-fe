# ERP Logistics Frontend Demo

Simple Next.js + Ant Design frontend demo for an internal logistics ERP.

## Setup

```bash
npm install
npm run clean
npm run dev
```

Open `http://localhost:3000`.

## API

The Axios client uses this base URL by default:

```bash
http://localhost:3003/api/v1
```

To change it, create `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003/api/v1
```

Implemented endpoint calls:

- `POST /auth/login`
- `GET /auth/me`
- `GET /jobs`
- `GET /jobs/:id`
- `GET /accounting/revenue/job/:jobId`
- `GET /accounting/cost/job/:jobId`
- `GET /accounting/profit/job/:jobId`
- `GET /partners`
- `GET /accounting/revenue`
- `GET /accounting/cost`

The frontend is mapped to the NestJS backend in `hr-app-localsetup`, where:

- backend port is `3003`
- API prefix is `/api/v1`
- CORS already allows `http://localhost:3000`

If the API is not running, the app falls back to mock data so the UI remains navigable.

## Dev Note

This project uses webpack for `npm run dev` to avoid intermittent Turbopack chunk-loading errors in local development.

## Demo Login

The login form is prefilled with:

- Username: `admin`
- Password: `admin123`

When the backend is unavailable, login stores a demo local JWT token.
