# Contractor Estimator

Next.js frontend for **Contractor Estimator** — AI estimates for US contractors (painting, roofing, flooring).

**Current product model**

| Party | Role |
|---|---|
| Admin | Creates contractor accounts via API and gives them a client link |
| Contractor | Shares `/c/CTR-XXXXX` with customers (no self-serve dashboard in the app) |
| Client | Opens the link, chats with AI + photos; Word report emails to the contractor |

Client deep link: `/c/{contractorCode}` → `contractor_code` is sent automatically on `POST /api/estimates/start` (no manual code field).

Contractor portal routes (`/login`, `/register`, `/dashboard`, `/billing/*`) are **disabled** (not deleted). Re-enable with `CONTRACTOR_PORTAL_ENABLED` in `lib/features.ts`.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- English + Mexican Spanish (`es-MX`) UI
- Live API: `https://api-production-6fdd.up.railway.app`

## Features

- Landing page (EN / ES)
- Client estimate flow via `/c/CTR-XXXXX` (form → multi-turn chat → photos → success)
- Contractor portal UI kept but disabled (admin-provisioned accounts)

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
app/                 # Routes (landing, /c/[code], disabled portal)
components/          # Shared UI + EstimateFlow
lib/api.ts           # Central API client
lib/features.ts      # Feature flags (contractor portal)
messages/            # en.json, es.json
```
