/** Block generic stock / placeholder hosts — only CMS-uploaded or explicit URLs allowed. */
const BLOCKED_PATTERNS = [
  /images\.unsplash\.com/i,
  /source\.unsplash\.com/i,
  /picsum\.photos/i,
  /placehold\.co/i,
  /placeholder\.com/i,
  /via\.placeholder\.com/i,
  /loremflickr\.com/i,
  /dummyimage\.com/i,
]

export function sanitizeImageUrl(url) {
  if (url == null) return ''
  const trimmed = String(url).trim()
  if (!trimmed) return ''

  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return ''
  }

  return trimmed
}

export function hasUsableImage(url) {
  return Boolean(sanitizeImageUrl(url))
}

/** Inline SVG placeholder for ticket QR preview (no external API). */
export const TICKET_QR_PREVIEW_DATA_URL =
  'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280">
      <rect width="280" height="280" fill="#ffffff"/>
      <rect x="24" y="24" width="72" height="72" fill="#1a1410"/>
      <rect x="184" y="24" width="72" height="72" fill="#1a1410"/>
      <rect x="24" y="184" width="72" height="72" fill="#1a1410"/>
      <g fill="#1a1410">
        <rect x="112" y="24" width="16" height="16"/><rect x="144" y="24" width="16" height="16"/>
        <rect x="112" y="56" width="16" height="16"/><rect x="128" y="72" width="16" height="16"/>
        <rect x="160" y="56" width="16" height="16"/><rect x="112" y="112" width="56" height="56"/>
        <rect x="184" y="112" width="16" height="16"/><rect x="216" y="144" width="16" height="16"/>
        <rect x="112" y="184" width="16" height="16"/><rect x="144" y="216" width="16" height="16"/>
        <rect x="184" y="184" width="72" height="16"/><rect x="184" y="216" width="40" height="40"/>
      </g>
      <text x="140" y="268" text-anchor="middle" fill="#4a3f35" font-family="sans-serif" font-size="11">Preview QR</text>
    </svg>`
  )
