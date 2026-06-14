const STAFF_AUTH_EMAIL_DOMAIN = 'staff.glorytheatre.local'

const USERNAME_ROLES = new Set(['blog_writer', 'check_in'])

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase()
}

function isValidUsername(username) {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)
}

function usernameToAuthEmail(username) {
  return `${normalizeUsername(username)}@${STAFF_AUTH_EMAIL_DOMAIN}`
}

function roleUsesUsername(role) {
  return USERNAME_ROLES.has(role)
}

module.exports = {
  STAFF_AUTH_EMAIL_DOMAIN,
  USERNAME_ROLES,
  normalizeUsername,
  isValidUsername,
  usernameToAuthEmail,
  roleUsesUsername,
}
