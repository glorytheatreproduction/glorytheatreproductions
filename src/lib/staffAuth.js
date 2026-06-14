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

export function isStaffAuthEmail(email) {
  return String(email || '').toLowerCase().endsWith(`@${STAFF_AUTH_EMAIL_DOMAIN}`)
}

export function authEmailToUsername(email) {
  if (!isStaffAuthEmail(email)) return null
  return email.split('@')[0]?.toLowerCase() || null
}

export function looksLikeEmail(value) {
  return String(value || '').includes('@')
}

export function resolveLoginEmail(identifier) {
  const trimmed = String(identifier || '').trim().toLowerCase()
  if (!trimmed) return ''
  if (looksLikeEmail(trimmed)) return trimmed
  return usernameToAuthEmail(trimmed)
}

export function getMemberLoginLabel(profile) {
  if (profile?.username) return profile.username
  const fromEmail = authEmailToUsername(profile?.email)
  if (fromEmail) return fromEmail
  return profile?.email || 'Member'
}

export function roleUsesUsername(role) {
  return USERNAME_ROLES.has(role)
}
