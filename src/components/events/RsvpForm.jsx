import { useState } from 'react'
import { submitRsvp } from '../../services/rsvp'

export default function RsvpForm({ event, onSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [seats, setSeats] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const maxSeats = event.maxSeatsPerRsvp || 4

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await submitRsvp({
        eventId: event.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        seats,
        eventName: event.title,
        eventDate: event.dateLabel,
        eventTime: event.time,
        eventVenue: event.venue,
      })
      onSuccess({ ...result, email: email.trim() })
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
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-paper border border-border-light px-4 py-3 text-ink text-sm placeholder-ink-muted/40 focus:outline-none focus:border-gold/50"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="rsvp-phone"
          className="block font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Phone (optional)
        </label>
        <input
          id="rsvp-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-paper border border-border-light px-4 py-3 text-ink text-sm placeholder-ink-muted/40 focus:outline-none focus:border-gold/50"
          placeholder="+233 ..."
        />
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
        Free entry. Your digital ticket will be emailed after you reserve. Present it at the venue for check-in.
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
