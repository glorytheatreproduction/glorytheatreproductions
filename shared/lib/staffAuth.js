export const STAFF_AUTH_EMAIL_DOMAIN = 'staff.glorytheatre.local'

export const USERNAME_ROLES = new Set(['blog_writer', 'check_in'])

export function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase()
}

export function isValidUsername(username) {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)
}

export function usernameToAuthEmail(username) {
  return `${normalizeUsername(username)}@${STAFF_AUTH_EMAIL_DOMAIN}`
}

export function roleUsesUsername(role) {
  return USERNAME_ROLES.has(role)
}
