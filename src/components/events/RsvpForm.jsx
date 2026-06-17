import { useState } from 'react'
import { submitRsvp } from '../../services/rsvp'
import { SITE_CONTACT_EMAIL } from '../../../shared/lib/siteEmail.js'

export default function RsvpForm({ event, onSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [noEmail, setNoEmail] = useState(false)
  const [seats, setSeats] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const maxSeats = event.maxSeatsPerRsvp || 4

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()

    if (!noEmail && !trimmedEmail) {
      setError('Email is required, or check “I don’t have an email” below.')
      return
    }

    if (noEmail && !trimmedPhone) {
      setError('Please enter a phone number so we can reach you about your reservation.')
      return
    }

    setLoading(true)

    try {
      const result = await submitRsvp({
        eventId: event.id,
        name: name.trim(),
        email: noEmail ? '' : trimmedEmail,
        phone: trimmedPhone,
        seats,
        eventName: event.title,
        eventDate: event.dateLabel,
        eventTime: event.time,
        eventVenue: event.venue,
        noEmail,
      })
      onSuccess({
        ...result,
        email: noEmail ? '' : trimmedEmail,
        phone: trimmedPhone,
        guestName: name.trim(),
        noEmail,
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="rsvp-name"
          className="block font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Full Name *
        </label>
        <input
          id="rsvp-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-paper border border-border-light px-4 py-3 text-ink text-sm placeholder-ink-muted/40 focus:outline-none focus:border-gold/50"
          placeholder="Your full name"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={noEmail}
          onChange={(e) => {
            setNoEmail(e.target.checked)
            if (e.target.checked) setEmail('')
            setError('')
          }}
          className="mt-1 h-4 w-4 accent-gold"
        />
        <span className="text-sm text-ink-muted leading-relaxed">
          I don&apos;t have an email address
        </span>
      </label>

      {!noEmail ? (
        <div>
          <label
            htmlFor="rsvp-email"
            className="block font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Email Address *
          </label>
          <input
            id="rsvp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-paper border border-border-light px-4 py-3 text-ink text-sm placeholder-ink-muted/40 focus:outline-none focus:border-gold/50"
            placeholder="you@example.com"
          />
        </div>
      ) : null}

      <div>
        <label
          htmlFor="rsvp-phone"
          className="block font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Phone {noEmail ? '*' : '(optional)'}
        </label>
        <input
          id="rsvp-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-paper border border-border-light px-4 py-3 text-ink text-sm placeholder-ink-muted/40 focus:outline-none focus:border-gold/50"
          placeholder="+233 ..."
        />
        {noEmail ? (
          <p className="mt-2 text-xs text-ink-muted leading-relaxed">
            Your ticket will appear on the next screen — save or screenshot it for entry at the venue.
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="rsvp-seats"
          className="block font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Number of Seats *
        </label>
        <select
          id="rsvp-seats"
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="w-full bg-paper border border-border-light px-4 py-3 text-ink text-sm focus:outline-none focus:border-gold/50"
        >
          {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'seat' : 'seats'}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-burgundy-light text-sm border border-burgundy-light/30 bg-burgundy-light/5 px-4 py-3">
          {error}
        </p>
      )}

      <p className="text-ink-muted text-xs leading-relaxed">
        {noEmail ? (
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
