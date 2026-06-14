# Gotham web fonts (licensed)

Place your licensed Gotham `.woff2` files here so tickets render with the correct typeface in admin preview, PDF, and PNG output.

Required filenames:

| File | Weight | Used for |
|------|--------|----------|
| `Gotham-Light.woff2` | 300 | Optional light copy |
| `Gotham-Book.woff2` | 400 | Body text, notes, venue |
| `Gotham-Medium.woff2` | 500 | Labels, meta values |
| `Gotham-Bold.woff2` | 700 | Optional emphasis |
| `Gotham-Black.woff2` | 900 | Event titles (Sacred Stage) |

Tickets use these Gotham roles:

- **Black (900)** — main event name
- **Medium (500)** — field labels, ticket ID, meta values
- **Book (400)** — supporting text and custom notes

Until files are added, the browser falls back to Helvetica Neue / Arial.

For PDF generation, fonts must be reachable at:

`https://your-domain.com/fonts/gotham/Gotham-*.woff2`

Set `SITE_URL` in Edge Function secrets to your production URL.
