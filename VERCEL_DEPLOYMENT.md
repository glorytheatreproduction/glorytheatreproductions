# Vercel Deployment — Glory Theatre Productions

The site is a **Vite + React** SPA deployed on **Vercel**, with serverless API routes for RSVP/ticketing and **Supabase** for CMS content.

## Quick deploy

1. Push to GitHub and import the repo in [Vercel](https://vercel.com/new)
2. Framework preset: **Vite** (auto-detected from `vercel.json`)
3. Add environment variables (see below)
4. Deploy

## Build settings

Configured in `vercel.json`:

| Setting | Value |
|---------|--------|
| Node.js | 20 (`.node-version` + `engines`) |
| Build command | `npm run build` |
| Output directory | `dist` |
| SPA fallback | All non-`/api/*` routes → `index.html` |
| Ticket PNGs | SVG + `sharp` (no `node-canvas`) |

Legacy `netlify/` and `netlify.toml` are ignored on Vercel (see `.vercelignore`).

## Environment variables

### CMS (required for admin + live content)

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

See `SUPABASE_CMS_SETUP.md` for database migrations, seeding, and admin setup.

### RSVP / tickets (required for ticket reservations)

```
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
GOOGLE_SHEETS_PROJECT_ID=
SENDGRID_API_KEY=
FROM_EMAIL=Glory Theatre <glorytheatreproduction@gmail.com>
```

Optional:

```
TICKET_SECRET_KEY=
CHECK_IN_ADMIN_TOKEN=
```

## API routes

| Route | Purpose |
|-------|---------|
| `POST /api/rsvp-handler` | RSVP form → Google Sheets + email ticket |
| `POST /api/check-in` | QR ticket check-in |

Frontend calls `/api/rsvp-handler` via `src/services/rsvp.js`.

## Local development

```bash
# Frontend only (CMS works; RSVP API needs Vercel dev)
npm run dev

# Full stack including /api routes
npm run dev:vercel
```

Vite proxies `/api/*` to `http://localhost:3000` when using `vercel dev` alongside `npm run dev`.

## Legacy Netlify files

The `netlify/` folder and `netlify.toml` are kept for reference but are **not used** on Vercel. Active serverless code lives in `api/`.
