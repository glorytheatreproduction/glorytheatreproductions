import { Link } from 'react-router-dom'
import GoldButton from '../ui/GoldButton'
import { SITE_CONTACT_EMAIL } from '../../../shared/lib/siteEmail.js'

export default function RsvpSuccess({ event, ticketId, email }) {
  return (
    <div className="text-center py-8" data-reveal>
      <span
        className="font-display text-6xl text-gold block mb-6"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        ✦
      </span>

      <h2
        className="font-display text-3xl text-ink mb-4"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        You&apos;re Reserved
      </h2>

      <p className="text-ink-muted text-base leading-relaxed mb-6 max-w-md mx-auto">
        Your seat{ticketId ? 's are' : ' is'} confirmed for <strong className="text-ink">{event.title}</strong>.
        {email && (
          <> A digital ticket has been sent to <strong className="text-ink">{email}</strong>.</>
        )}
      </p>

      {ticketId && (
        <div className="inline-block bg-surface border border-border-light px-6 py-4 mb-8">
          <p
            className="font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Ticket ID
          </p>
          <p
            className="font-mono text-lg text-ink tracking-wider"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {ticketId}
          </p>
        </div>
      )}

      <p className="text-ink-muted text-sm leading-relaxed mb-6 max-w-md mx-auto">
        Questions about your ticket? Email{' '}
        <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-gold hover:text-gold-muted transition-colors">
          {SITE_CONTACT_EMAIL}
        </a>
        .
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <GoldButton to="/events">Back to Events</GoldButton>
        <Link to={`/events/${event.id}`} className="gold-link text-sm self-center">
          View Event Details →
        </Link>
      </div>
    </div>
  )
}
