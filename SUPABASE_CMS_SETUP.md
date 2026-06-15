# Supabase CMS Setup — Glory Theatre Productions

This project includes a Supabase-backed CMS for editing site content, events, gallery albums, and blog posts.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy the **Project URL** and **anon public key** from Settings → API.

## 2. Link Supabase CLI & run migrations

**Project ref:** `xjywhejhnplrdxyulnvk` (already in `supabase/config.toml` and `supabase/.temp/project-ref`)

### Option A — CLI (recommended)

```bash
# 1. Log in (opens browser)
supabase login

# 2. Add database password to .env.local
#    Supabase → Settings → Database → Database password
SUPABASE_DB_PASSWORD=your-db-password

# 3. Link project + push migrations
npm run supabase:link

# 4. Seed content + create admin
npm run cms:seed
npm run cms:create-admin
```

Or step by step:

```bash
supabase link --project-ref xjywhejhnplrdxyulnvk --password YOUR_DB_PASSWORD
supabase db push
```

### Option B — SQL Editor (no CLI login)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/xjywhejhnplrdxyulnvk/sql/new)
2. Paste the contents of `supabase/RUN_IN_SQL_EDITOR.sql`
3. Click **Run**
4. Then run `npm run cms:seed` and `npm run cms:create-admin`

### Option C — GitHub integration (auto migrations on push)

In Supabase Dashboard → **Project Settings → Integrations → GitHub**, connect `glorytheatreproduction/glorytheatreproductions`. Migrations in `supabase/migrations/` will deploy on push.

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
| `VITE_SUPABASE_ANON_KEY` | Public site + CMS + invite API |
| `SUPABASE_URL` | Invite API (same as project URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | Invite API + admin scripts (**required for Members → Invite**) |
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
- **Invite failed** — member invites run through the Supabase Edge Function `invite-member` (not Vercel). Deploy with `supabase functions deploy invite-member --no-verify-jwt`. Only **admin** or **super_admin** can invite. Locally, use `npm run dev` once Supabase is configured.
