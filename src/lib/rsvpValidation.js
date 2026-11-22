/**
 * RSVP form sanitization + validation.
 *
 * The same rules are enforced server-side in `create_public_registration`
 * (supabase/migrations/019_rsvp_input_validation.sql). Keep the two in sync.
 */

export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 80
export const EMAIL_MAX_LENGTH = 254
export const PHONE_MIN_DIGITS = 7
export const PHONE_MAX_DIGITS = 15
export const DEFAULT_COUNTRY_CODE = '233' // Ghana

// Control characters, zero-width / bidi formatting characters, and the BOM.
const INVISIBLE_CHARS = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤﻿]/g

function baseClean(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(INVISIBLE_CHARS, '')
}

// ── Name ─────────────────────────────────────────────────────────────────────

// Letter groups separated by spaces, apostrophes, hyphens or periods, with an
// optional trailing period ("Kwame A. Mensah", "Ama O'Neil-Boateng", "Kofi Jr.").
const NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ '’.-]+[\p{L}\p{M}]+)*\.?$/u
const REPEATED_CHAR = /(.)\1\1/u

export function sanitizeName(value) {
  // Normalize only. Disallowed symbols are rejected by validateName rather than
  // silently stripped, so "John<script>" can't turn into a valid-looking "Johnscript".
  return baseClean(value)
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

export function validateName(name) {
  if (!name) return 'Please enter your full name.'
  if (name.length < NAME_MIN_LENGTH) return 'Name is too short.'
  if (name.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`
  if (/\d/.test(name)) return 'Name should not contain numbers.'
  if (/[^\p{L}\p{M} '.-]/u.test(name)) return 'Name can only contain letters, spaces, hyphens, apostrophes and periods.'
  if (!NAME_PATTERN.test(name)) return 'Use letters only, with spaces, hyphens or apostrophes between names.'
  if ((name.match(/[\p{L}]/gu) || []).length < NAME_MIN_LENGTH) return 'Name is too short.'
  if (REPEATED_CHAR.test(name.toLowerCase())) return 'Please enter your real name.'
  return ''
}

// ── Email ────────────────────────────────────────────────────────────────────

const EMAIL_PATTERN =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

const DOMAIN_TYPOS = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gnail.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'iclod.com': 'icloud.com',
}

export function sanitizeEmail(value) {
  return baseClean(value).replace(/\s+/g, '').toLowerCase()
}

export function validateEmail(email) {
  if (!email) return 'Please enter your email address.'
  if (email.length > EMAIL_MAX_LENGTH) return 'Email address is too long.'
  const [local = ''] = email.split('@')
  if (local.length > 64 || !EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address, like name@example.com.'
  }
  const suggestion = suggestEmailFix(email)
  if (suggestion) return `Check your email address. Did you mean ${suggestion}?`
  return ''
}

export function suggestEmailFix(email) {
  const at = email.lastIndexOf('@')
  if (at < 0) return ''
  const fixed = DOMAIN_TYPOS[email.slice(at + 1)]
  return fixed ? `${email.slice(0, at)}@${fixed}` : ''
}

// ── Phone ────────────────────────────────────────────────────────────────────

/**
 * Normalize to E.164-style `+<digits>`.
 * Local Ghanaian numbers (0XXXXXXXXX) get the +233 country code.
 */
export function sanitizePhone(value) {
  let cleaned = baseClean(value).replace(/[\s().-]/g, '')
  if (!cleaned) return ''

  if (cleaned.startsWith('00')) cleaned = `+${cleaned.slice(2)}`

  // Anything other than digits and one leading + is left in place for validatePhone to reject.
  if (!/^\+?\d+$/.test(cleaned)) return cleaned

  const digits = cleaned.replace(/\D/g, '')
  if (cleaned.startsWith('+')) return `+${digits}`
  if (digits.length === 10 && digits.startsWith('0')) return `+${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`
  if (digits.length === 12 && digits.startsWith(DEFAULT_COUNTRY_CODE)) return `+${digits}`
  return digits
}

export function validatePhone(phone, { required = false } = {}) {
  if (!phone) return required ? 'Please enter a phone number so we can reach you.' : ''
  if (!/^\+?\d+$/.test(phone)) return 'Phone number can only contain digits, spaces, dashes and a leading +.'

  const digits = phone.replace(/\D/g, '')
  if (digits.length < PHONE_MIN_DIGITS || digits.length > PHONE_MAX_DIGITS) {
    return 'Enter a valid phone number, like 024 123 4567 or +233 24 123 4567.'
  }
  if (phone.startsWith(`+${DEFAULT_COUNTRY_CODE}`) && digits.length !== 12) {
    return 'Ghana numbers have 10 digits, like 024 123 4567.'
  }
  if (/^(\d)\1+$/.test(digits.slice(-9))) return 'Please enter a real phone number.'
  return ''
}

// ── Seats ────────────────────────────────────────────────────────────────────

export function sanitizeSeats(value) {
  const n = Number(value)
  return Number.isInteger(n) ? n : NaN
}

export function validateSeats(seats, maxSeats) {
  if (!Number.isInteger(seats) || seats < 1) return 'Choose at least 1 seat.'
  if (seats > maxSeats) return `You can reserve up to ${maxSeats} seats per RSVP.`
  return ''
}

// ── Whole form ───────────────────────────────────────────────────────────────

export function sanitizeRsvp({ name, email, phone, seats, noEmail }) {
  return {
    name: sanitizeName(name),
    email: noEmail ? '' : sanitizeEmail(email),
    phone: sanitizePhone(phone),
    seats: sanitizeSeats(seats),
    noEmail: Boolean(noEmail),
  }
}

/** Returns `{ field: message }` for every invalid field; empty object when valid. */
export function validateRsvp(values, { maxSeats }) {
  const errors = {}
  const nameError = validateName(values.name)
  if (nameError) errors.name = nameError

  if (!values.noEmail) {
    const emailError = validateEmail(values.email)
    if (emailError) errors.email = emailError
  }

  const phoneError = validatePhone(values.phone, { required: values.noEmail })
  if (phoneError) errors.phone = phoneError

  const seatsError = validateSeats(values.seats, maxSeats)
  if (seatsError) errors.seats = seatsError

  return errors
}
