# Ticket Templates — Setup & Secrets

Automated PDF/PNG tickets are generated when a row is inserted into `public.registrations`. The flow is:

1. Visitor submits RSVP → client inserts into `registrations`
2. Database trigger (`trigger_generate_ticket`) POSTs to Edge Function `generate-ticket`
3. Edge Function builds HTML from the event's `ticket_template` + `ticket_settings`, renders PNG/PDF, uploads to Storage, emails via Resend

## Required secrets (Supabase Edge Function)

Set these in **Supabase Dashboard → Edge Functions → generate-ticket → Secrets**:

| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Project URL (auto-injected on hosted Supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for DB + Storage |
| `SUPABASE_ANON_KEY` | Validates staff JWT for admin regenerate calls |
| `HTML_RENDER_API_KEY` | [Api2PDF](https://www.api2pdf.com/) API key (Chrome HTML → PNG/PDF) |
| `RESEND_API_KEY` | [Resend](https://resend.com/) transactional email |
| `FROM_EMAIL` | Verified sender, e.g. `Glory Theatre <tickets@yourdomain.com>` |
| `DATABASE_WEBHOOK_SECRET` | Shared secret matching DB trigger header `x-webhook-secret` |
| `SITE_URL` | Public site origin for Gotham font URLs in PDF/PNG (e.g. `https://glorytheatreproductions.vercel.app`) |

## Gotham fonts

Tickets use **Gotham** (Book, Medium, Black). Add licensed `.woff2` files to `public/fonts/gotham/` — see that folder’s README.

Font roles:
- Event titles → Gotham Black (900)
- Labels & values → Gotham Medium (500)
- Notes & venue → Gotham Book (400)

## Editable colours

Per-event colours live in `events.ticket_settings.colors` (JSON). The admin **Ticket Design** panel exposes colour pickers for each template. Defaults match the site palette (burgundy, cream, classic grey/peach).

## Database trigger URL

Migration `012_ticket_webhook_settings.sql` stores the webhook URL and secret in `cms_internal_settings` and wires the insert trigger automatically.

After deploy, sync the Edge Function secret (one-time):

```bash
npm run tickets:setup
```

Copy the printed `DATABASE_WEBHOOK_SECRET` value, or run:

```bash
supabase secrets set DATABASE_WEBHOOK_SECRET=your-secret-from-tickets-setup --project-ref xjywhejhnplrdxyulnvk
supabase functions deploy generate-ticket --no-verify-jwt
```

Without `HTML_RENDER_API_KEY`, tickets still generate with a **QR code PNG** and ticket ID. Add Api2PDF + Resend secrets for full designed tickets and email delivery.

## Deploy Edge Function

```bash
supabase functions deploy generate-ticket --no-verify-jwt
```

`--no-verify-jwt` allows the database webhook trigger (which sends `x-webhook-secret` instead of a user JWT). Admin "Regenerate" calls use the authenticated user's session via `supabase.functions.invoke`.

## QR code API

Uses the public [QR Server API](https://goqr.me/api/) — no API key required:

`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=...`

Payload encoded in QR: JSON `{ event_id, registration_id, ticket_id }`.

## Storage

Bucket: **`tickets`** (public read)

Paths:
- `{eventId}/{registrationId}.png`
- `{eventId}/{registrationId}.pdf`

## Admin UI

- **Events → Ticket Design** — template picker, live preview, overrides
- **Registrations** — per-row **Regenerate** and **Regenerate all tickets**

## Templates

| ID | Component | Description |
|----|-----------|-------------|
| `classic` | `TicketClassic.jsx` | Grey card, peach header, dashed perforation |
| `sacred_stage` | `TicketSacredStage.jsx` | Burgundy stub layout (site default) |

Shared HTML generator: `shared/tickets/buildTicketHtml.js` (used by Edge Function and kept in sync with React preview components).

## Vercel / local fallback

If Supabase is not configured, `submitRsvp()` falls back to the legacy `/api/rsvp-handler` (SendGrid + Google Sheets).

## Apply migration

```bash
supabase db push
```

Migration file: `supabase/migrations/008_ticket_templates.sql`
