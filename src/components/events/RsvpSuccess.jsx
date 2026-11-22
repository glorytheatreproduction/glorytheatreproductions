import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GoldButton from '../ui/GoldButton'
import { supabaseIsConfigured } from '../../lib/supabaseClient'
import { getRegistrationStatus } from '../../services/rsvp'
import { SITE_CONTACT_EMAIL } from '../../../shared/lib/siteEmail.js'

const POLL_INTERVAL_MS = 2000
// The ticket function retries each step up to 3 times, so allow ~2 minutes before giving up.
const MAX_POLLS = 60

const FINAL_EMAIL_STATUSES = ['sent', 'failed', 'skipped', 'no_email']

function ContactLink() {
  return (
    <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-gold hover:text-gold-muted transition-colors">
      {SITE_CONTACT_EMAIL}
    </a>
  )
}

// The ticket is finished once it has failed, or once it is generated and the email step is over.
// An older status function (before migration 022) has no email_status; don't wait on it then.
function isFinished(status, hasEmail) {
  if (!status) return false
  if (status.ticket_status === 'failed') return true
  if (status.ticket_status !== 'generated') return false
  if (!hasEmail || status.email_status === undefined) return true
  return FINAL_EMAIL_STATUSES.includes(status.email_status)
}

export default function RsvpSuccess({ event, ticketId, email, guestName, registrationId, noEmail = false }) {
  const tracking = Boolean(registrationId && supabaseIsConfigured)
  const hasEmail = Boolean(email) && !noEmail

  const [status, setStatus] = useState(null)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!tracking) return

    let cancelled = false
    let polls = 0

    const poll = async () => {
      try {
        const next = await getRegistrationStatus(registrationId)
        if (cancelled) return
        if (next) setStatus(next)
        if (isFinished(next, hasEmail)) return
      } catch {
        // keep polling
      }

      polls += 1
      if (cancelled) return
      if (polls < MAX_POLLS) {
        setTimeout(poll, POLL_INTERVAL_MS)
      } else {
        setTimedOut(true)
      }
    }

    poll()
    return () => { cancelled = true }
  }, [tracking, registrationId, hasEmail])

  const legacyTicketId = ticketId && ticketId !== 'Pending' ? ticketId : ''
  const ticketGenerated = status?.ticket_status === 'generated'
  const ticketFailed = status?.ticket_status === 'failed'
  const emailStatus = status?.email_status
  const resolvedTicketId = tracking ? (ticketGenerated ? status.ticket_id : '') : legacyTicketId
  const ticketPngUrl = ticketGenerated ? status.png_url : ''
  const finished = !tracking || isFinished(status, hasEmail)

  let message
  if (!tracking) {
    message = hasEmail
      ? <> A digital ticket has been sent to <strong className="text-ink">{email}</strong>.</>
      : null
  } else if (ticketFailed) {
    message = (
      <> We couldn&apos;t create your ticket, but your seat is still reserved. Give your name at the
      entrance and our team will check you in, or email <ContactLink /> and we&apos;ll send your ticket.</>
    )
  } else if (!ticketGenerated) {
    message = timedOut ? (
      <> Your ticket is taking longer than usual to prepare.
      {hasEmail ? <> It should arrive at <strong className="text-ink">{email}</strong> soon.</> : null}{' '}
      Your seat is reserved. If no ticket reaches you, give your name at the entrance or email <ContactLink />.</>
    ) : hasEmail ? (
      <> Your digital ticket is being prepared and will be sent to <strong className="text-ink">{email}</strong>.</>
    ) : (
      <> Your digital ticket is being prepared. It will appear below in a moment.</>
    )
  } else if (!hasEmail || emailStatus === 'no_email') {
    message = <> Save or screenshot your ticket below and show the QR code at the entrance.</>
  } else if (emailStatus === 'sent' || emailStatus === undefined) {
    message = <> Your ticket has been sent to <strong className="text-ink">{email}</strong>. You can also save it below.</>
  } else if (emailStatus === 'failed' || emailStatus === 'skipped') {
    message = (
      <> We couldn&apos;t email your ticket to <strong className="text-ink">{email}</strong>. Please save or
      screenshot it below and show the QR code at the entrance. If you need help, email <ContactLink />.</>
    )
  } else {
    message = timedOut ? (
      <> Your ticket is ready below. We&apos;re still trying to email it to <strong className="text-ink">{email}</strong>, so
      please save or screenshot it in case it doesn&apos;t arrive.</>
    ) : (
      <> Your ticket is ready. Sending it to <strong className="text-ink">{email}</strong>…</>
    )
  }

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

      <p className="text-ink-muted text-base leading-relaxed mb-6 max-w-md mx-auto" aria-live="polite">
        Your seat is confirmed for <strong className="text-ink">{event.title}</strong>.
        {message}
      </p>

      {resolvedTicketId ? (
        <div className="inline-block bg-surface border border-border-light px-6 py-4 mb-8 max-w-full">
          {guestName ? (
            <p
              className="font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-1"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Guest
            </p>
          ) : null}
          {guestName ? (
            <p className="text-lg text-ink mb-4">{guestName}</p>
          ) : null}
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
            {resolvedTicketId}
          </p>
          {ticketPngUrl ? (
            <>
              <img
                src={ticketPngUrl}
                alt={`Your ticket for ${event.title}, with the QR code to show at the entrance`}
                className="mt-4 mx-auto max-w-full rounded border border-border-light"
              />
              <a
                href={ticketPngUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm text-gold hover:text-gold-muted transition-colors"
              >
                Download ticket (PNG) →
              </a>
            </>
          ) : null}
        </div>
      ) : tracking && !finished && !timedOut ? (
        <p className="text-ink-muted text-sm mb-8">Generating ticket…</p>
      ) : null}

      <p className="text-ink-muted text-sm leading-relaxed mb-6 max-w-md mx-auto">
        Questions about your ticket? Email <ContactLink />.
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
