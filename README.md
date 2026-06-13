# Glory Theatre Productions

React 19 + Vite + Tailwind CSS v4 site with Supabase CMS and Vercel serverless RSVP/ticketing.

## Development

```bash
npm install
npm run dev          # Frontend at http://localhost:5173
npm run dev:vercel   # Full stack with /api routes (RSVP, check-in)
```

## CMS

- Admin: `/admin/login`
- Setup: see [SUPABASE_CMS_SETUP.md](./SUPABASE_CMS_SETUP.md)

## Deployment

Deployed on **Vercel**. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for env vars and API routes.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build → `dist/` |
| `npm run cms:setup` | Migrate, seed, and create admin (local) |
| `npm run cms:seed` | Import static data into Supabase |
