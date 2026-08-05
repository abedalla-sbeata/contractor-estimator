# Contractor Estimator

Production-ready Next.js frontend for **Contractor Estimator** — a US contractor estimating SaaS.

Contractors register and receive a permanent public code (`CTR-XXXXX`). Clients enter that code, chat with AI (text + photos), and when enough detail is collected the backend emails a Word estimate **only to the contractor**. Clients only see a success confirmation.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- English + Mexican Spanish (`es-MX`) UI
- Live API: `https://api-production-6fdd.up.railway.app`

## Features

- Landing page (EN / ES)
- Client estimate flow (form → chat → photos → success)
- Contractor register / login
- Dashboard: public code, trial/subscription status, license upload, Stripe checkout, recent requests
- Billing success / cancel pages

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Windows: Node blocked by Defender

If `npm` fails with *“file contains a virus or potentially unwanted software”*, Windows Defender is blocking `C:\Program Files\nodejs\node.exe` (false positive).

**Quick workaround** (this repo includes shims in `.tools/`):

```powershell
$env:PATH = "D:\Projects\NextJS\contractor-estimator\.tools;" + $env:PATH
npm run dev
```

**Proper fix:** Windows Security → Virus & threat protection → Manage settings → Exclusions → add `C:\Program Files\nodejs\`, then reinstall Node from [nodejs.org](https://nodejs.org) if needed.

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (no trailing slash) |

Example (`.env.local`):

```env
NEXT_PUBLIC_API_URL=https://api-production-6fdd.up.railway.app
```

## Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set `NEXT_PUBLIC_API_URL` in Project Settings → Environment Variables.
4. Deploy.

No server secrets are required on the frontend. Stripe webhooks are handled by the backend only.

## Project structure

```
app/                 # Routes (landing, estimate, auth, dashboard, billing)
components/          # Shared UI
lib/api.ts           # Central API client
lib/auth.ts          # JWT storage (localStorage)
lib/i18n.tsx         # EN / ES-MX provider
messages/            # Translation catalogs
```

## Auth

- JWT from `POST /api/auth/login` is stored via `lib/auth.ts` (localStorage).
- Contractor requests send `Authorization: Bearer <token>`.
- `/dashboard` redirects to `/login` when unauthenticated or on 401.

## Product notes

- Clients never create accounts.
- Word reports are emailed to contractors only — not shown/downloaded in the dashboard.
- MVP services: painting, roofing, flooring.
- Trial: 7 days, then Stripe subscription ($200/month) via `POST /api/billing/checkout`.
- Contractors can receive requests when trial/subscription is active (`can_receive_requests`).
- License upload is optional and does not gate receiving requests.
- Client UI/chat uses `client_language`; contractor Word report/email uses `preferred_language`.
- Services: painting, roofing, flooring.
- Contractor estimate list (`/api/estimates/mine/list`) returns only `status: "sent"` items.

## API docs

- OpenAPI UI: https://api-production-6fdd.up.railway.app/docs
