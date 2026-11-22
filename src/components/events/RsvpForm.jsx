import { useRef, useState } from 'react'
import { submitRsvp } from '../../services/rsvp'
import { SITE_CONTACT_EMAIL } from '../../../shared/lib/siteEmail.js'
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  sanitizeEmail,
  sanitizeName,
  sanitizeRsvp,
  validateRsvp,
} from '../../lib/rsvpValidation'

const FIELD_ORDER = ['name', 'email', 'phone', 'seats']

const labelClass = 'block font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-2'
const inputBase =
  'w-full bg-paper border px-4 py-3 text-ink text-sm placeholder-ink-muted/40 focus:outline-none'

function inputClass(hasError) {
  return `${inputBase} ${hasError ? 'border-burgundy-light focus:border-burgundy-light' : 'border-border-light focus:border-gold/50'}`
}

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} className="mt-2 text-xs text-burgundy-light leading-relaxed" role="alert">
      {message}
    </p>
  )
}

export default function RsvpForm({ event, onSuccess }) {
  const [values, setValues] = useState({ name: '', email: '', phone: '', seats: 1, noEmail: false })
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fieldRefs = useRef({})

  const maxSeats = Math.max(1, Number(event.maxSeatsPerRsvp) || 4)
  const fieldErrors = validateRsvp(sanitizeRsvp(values), { maxSeats })
  const visibleError = (field) => (submitted || touched[field] ? fieldErrors[field] : '')

  const setField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    // Tidy what the guest sees (trim, collapse spaces, lowercase email) without changing meaning.
    if (field === 'name') setValues((prev) => ({ ...prev, name: sanitizeName(prev.name) }))
    if (field === 'email') setValues((prev) => ({ ...prev, email: sanitizeEmail(prev.email) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitted(true)

    const clean = sanitizeRsvp(values)
    const errors = validateRsvp(clean, { maxSeats })
    const firstInvalid = FIELD_ORDER.find((field) => errors[field])
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus()
      return
    }

    setLoading(true)

    try {
      const result = await submitRsvp({
        eventId: event.id,
        name: clean.name,
        email: clean.email,
        phone: clean.phone,
        seats: clean.seats,
        eventName: event.title,
        eventDate: event.dateLabel,
        eventTime: event.time,
        eventVenue: event.venue,
        noEmail: clean.noEmail,
      })
      onSuccess({
        ...result,
        email: clean.email,
        phone: clean.phone,
        guestName: clean.name,
        noEmail: clean.noEmail,
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nameError = visibleError('name')
  const emailError = visibleError('email')
  const phoneError = visibleError('phone')
  const seatsError = visibleError('seats')

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="rsvp-name" className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>
          Full Name *
        </label>
        <input
          id="rsvp-name"
          ref={(el) => { fieldRefs.current.name = el }}
          type="text"
          required
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? 'rsvp-name-error' : undefined}
          className={inputClass(nameError)}
          placeholder="Your full name"
        />
        <FieldError id="rsvp-name-error" message={nameError} />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          id="rsvp-no-email"
          type="checkbox"
          checked={values.noEmail}
          onChange={(e) => {
            const checked = e.target.checked
            setValues((prev) => ({ ...prev, noEmail: checked, email: checked ? '' : prev.email }))
            setTouched((prev) => ({ ...prev, email: false }))
            setError('')
          }}
          className="mt-1 h-4 w-4 accent-gold"
        />
        <span className="text-sm text-ink-muted leading-relaxed">
          I don&apos;t have an email address
        </span>
      </label>

      {!values.noEmail ? (
        <div>
          <label htmlFor="rsvp-email" className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>
            Email Address *
          </label>
          <input
            id="rsvp-email"
            ref={(el) => { fieldRefs.current.email = el }}
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={EMAIL_MAX_LENGTH}
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'rsvp-email-error' : undefined}
            className={inputClass(emailError)}
            placeholder="you@example.com"
          />
          <FieldError id="rsvp-email-error" message={emailError} />
        </div>
      ) : null}

      <div>
        <label htmlFor="rsvp-phone" className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>
          Phone {values.noEmail ? '*' : '(optional)'}
        </label>
        <input
          id="rsvp-phone"
          ref={(el) => { fieldRefs.current.phone = el }}
          type="tel"
          required={values.noEmail}
          autoComplete="tel"
          inputMode="tel"
          maxLength={20}
          value={values.phone}
          onChange={(e) => setField('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          aria-invalid={Boolean(phoneError)}
          aria-describedby={phoneError ? 'rsvp-phone-error' : values.noEmail ? 'rsvp-phone-hint' : undefined}
          className={inputClass(phoneError)}
          placeholder="024 123 4567 or +233 24 123 4567"
        />
        <FieldError id="rsvp-phone-error" message={phoneError} />
        {values.noEmail && !phoneError ? (
          <p id="rsvp-phone-hint" className="mt-2 text-xs text-ink-muted leading-relaxed">
            Your ticket will appear on the next screen — save or screenshot it for entry at the venue.
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="rsvp-seats" className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>
          Number of Seats *
        </label>
        <select
          id="rsvp-seats"
          ref={(el) => { fieldRefs.current.seats = el }}
          value={values.seats}
          onChange={(e) => setField('seats', Number(e.target.value))}
          onBlur={() => handleBlur('seats')}
          aria-invalid={Boolean(seatsError)}
          aria-describedby={seatsError ? 'rsvp-seats-error' : undefined}
          className={`${inputClass(seatsError)} text-sm`}
        >
          {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'seat' : 'seats'}
            </option>
          ))}
        </select>
        <FieldError id="rsvp-seats-error" message={seatsError} />
      </div>

      {error && (
        <p className="text-burgundy-light text-sm border border-burgundy-light/30 bg-burgundy-light/5 px-4 py-3" role="alert">
          {error}
        </p>
      )}

      <p className="text-ink-muted text-xs leading-relaxed">
        {values.noEmail ? (
          <>Free entry. Your digital ticket will appear on the confirmation screen — screenshot or download it for check-in.</>
        ) : (
          <>Free entry. Your digital ticket will be emailed after you reserve. Present it at the venue for check-in.</>
        )}
        {' '}Need help?{' '}
        <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-gold hover:text-gold-muted transition-colors">
          {SITE_CONTACT_EMAIL}
        </a>
      </p>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center px-6 py-2.5 bg-gold text-void font-body font-medium text-xs tracking-wide transition hover:bg-gold-muted disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Reserving...' : 'Reserve Seats →'}
      </button>
    </form>
  )
}
