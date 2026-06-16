export const SITE_CONTACT_EMAIL = 'glorytheatreproduction@gmail.com'
export const SITE_FROM_NAME = 'Glory Theatre'
export const SITE_FROM_EMAIL = `${SITE_FROM_NAME} <${SITE_CONTACT_EMAIL}>`

export function resolveFromEmail(envValue) {
  const trimmed = String(envValue || '').trim()
  return trimmed || SITE_FROM_EMAIL
}
