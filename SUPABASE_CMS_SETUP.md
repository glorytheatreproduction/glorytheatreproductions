# Supabase CMS Setup — Glory Theatre Productions

This project includes a Supabase-backed CMS for editing site content, events, gallery albums, and blog posts.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy the **Project URL** and **anon public key** from Settings → API.

## 2. Run database migrations

**Option A — SQL Editor (fastest if you only have the service role key)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/xjywhejhnplrdxyulnvk/sql/new) → **SQL Editor**
2. Paste the contents of `supabase/RUN_IN_SQL_EDITOR.sql`
3. Click **Run**

**Option B — CLI / script (needs database password)**

Add `SUPABASE_DB_PASSWORD` to `.env.local` (from Settings → Database), then:

```bash
npm run cms:migrate
```

Or with Supabase CLI:

```bash
supabase link --project-ref xjywhejhnplrdxyulnvk
supabase db push
```

## 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```env
VITE_SUPABASE_URL=https://xjywhejhnplrdxyulnvk.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-settings-api
SUPABASE_URL=https://xjywhejhnplrdxyulnvk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get **anon public** and **service role** keys from: Supabase → **Settings → API**.

> **Never commit `.env.local` or paste the service role key in chat.** Rotate the service role key if it was exposed.

## 4. Seed content from the current site data

Set service role credentials locally (never commit these):

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Then run:

```bash
node scripts/seed-cms.mjs
```

This imports all events, gallery albums, blog posts, and page copy from the static data files.

## 5. Create your admin account

```env
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=choose-a-strong-password
```

```bash
node scripts/create-admin.mjs
```

## 6. Sign in to the CMS

1. Start the dev server: `npm run dev`
2. Open `/admin/login`
3. Sign in with your admin credentials

## CMS sections

| Route | What you can edit |
|-------|-------------------|
| `/admin` | Dashboard overview |
| `/admin/home` | Hero, mission, join CTA, page heroes, season, testimonials |
| `/admin/events` | All events and featured show |
| `/admin/gallery` | Albums and photo lists |
| `/admin/blog` | Blog posts and content blocks |
| `/admin/media` | Upload images to Supabase Storage |

## How it works

- **Public site** loads content from Supabase when configured, with static JS files as fallback.
- **Staff auth** uses Supabase Auth + `profiles` table roles (`editor`, `admin`, `super_admin`).
- **Images** upload to the `public` storage bucket and can be picked in any editor via **Pick**.
- **RSVP/ticketing** uses Vercel Serverless Functions (`/api/rsvp-handler`) + Google Sheets + SendGrid.

## Deploy on Vercel

1. Import the repo in [Vercel](https://vercel.com) — framework preset **Vite**
2. Add environment variables in **Project → Settings → Environment Variables**:

| Variable | Used by |
|----------|---------|
| `VITE_SUPABASE_URL` | Public site + CMS |
| `VITE_SUPABASE_ANON_KEY` | Public site + CMS |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | RSVP API |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | RSVP API |
| `GOOGLE_SHEETS_PRIVATE_KEY` | RSVP API |
| `GOOGLE_SHEETS_PROJECT_ID` | RSVP API |
| `SENDGRID_API_KEY` | RSVP API |
| `FROM_EMAIL` | RSVP API |
| `TICKET_SECRET_KEY` | Check-in API (optional) |
| `CHECK_IN_ADMIN_TOKEN` | Check-in API (optional) |

3. Deploy — `vercel.json` handles SPA routing and `/api/*` functions.

**Local RSVP testing:** run `npm run dev:vercel` (proxies `/api` from Vite on port 5173 to Vercel dev on port 3000).

## Blog content format

Blog posts use JSON content blocks:

```json
[
  { "type": "paragraph", "text": "Body copy…" },
  { "type": "heading", "text": "Section title" },
  { "type": "quote", "text": "Pull quote…" }
]
```

## Gallery photos format

Each album stores photos as JSON:

```json
[
  { "id": "photo-1", "src": "https://…", "title": "Caption" }
]
```

## Troubleshooting

- **CMS Not Configured** — add `VITE_SUPABASE_*` env vars and restart Vite.
- **Access Denied** — run `create-admin.mjs` or set your profile role to `admin` in Supabase.
- **Upload fails** — confirm storage bucket `public` exists and RLS policies from migration 002 are applied.
- **Changes not visible** — check items are marked **Published** in the admin editor.
