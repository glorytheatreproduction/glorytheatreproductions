import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import GoldButton from '../ui/GoldButton'
import { supabaseIsConfigured } from '../../lib/supabaseClient'
import { getRegistrationStatus } from '../../services/rsvp'
import { SITE_CONTACT_EMAIL } from '../../../shared/lib/siteEmail.js'

export default function RsvpSuccess({ event, ticketId, email, guestName, registrationId, noEmail = false }) {
  const [resolvedTicketId, setResolvedTicketId] = useState(
    ticketId && ticketId !== 'Pending' ? ticketId : ''
  )
  const [ticketPngUrl, setTicketPngUrl] = useState('')
  const [generating, setGenerating] = useState(
    Boolean(registrationId && supabaseIsConfigured && (!ticketId || ticketId === 'Pending'))
  )
  const [ticketFailed, setTicketFailed] = useState(false)

  useEffect(() => {
    if (!registrationId || !supabaseIsConfigured) return
    if (resolvedTicketId) return

    let cancelled = false
    let attempts = 0
    const maxAttempts = 30

    const poll = async () => {
      try {
        const status = await getRegistrationStatus(registrationId)
        if (cancelled) return

        if (status?.ticket_id) {
          setResolvedTicketId(status.ticket_id)
          if (status.png_url) setTicketPngUrl(status.png_url)
          setGenerating(false)
          return
        }

        if (status?.png_url) setTicketPngUrl(status.png_url)

        if (status?.ticket_status === 'failed') {
          setTicketFailed(true)
          setGenerating(false)
          return
        }
      } catch {
        // keep polling
      }

      attempts += 1
      if (attempts < maxAttempts && !cancelled) {
        setTimeout(poll, 2000)
      } else if (!cancelled) {
        setGenerating(false)
      }
    }

    poll()
    return () => { cancelled = true }
  }, [registrationId, resolvedTicketId])

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
        Your seat{resolvedTicketId ? 's are' : ' is'} confirmed for <strong className="text-ink">{event.title}</strong>.
        {email && !generating && !ticketFailed ? (
          <> A digital ticket has been sent to <strong className="text-ink">{email}</strong>.</>
        ) : null}
        {noEmail && !generating && !ticketFailed && resolvedTicketId ? (
          <> Save or screenshot your ticket below and present it at the venue for entry.</>
        ) : null}
        {generating && email ? (
          <> Your digital ticket is being prepared — it will arrive at <strong className="text-ink">{email}</strong> shortly.</>
        ) : null}
        {generating && noEmail ? (
          <> Your digital ticket is being prepared — it will appear below in a moment.</>
        ) : null}
        {ticketFailed ? (
          <> We could not generate your ticket automatically.{email ? (
            <> Please email{' '}
            <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-gold hover:text-gold-muted transition-colors">
              {SITE_CONTACT_EMAIL}
            </a>{' '}
            with your name and event.</>
          ) : (
            <> Please contact{' '}
            <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-gold hover:text-gold-muted transition-colors">
              {SITE_CONTACT_EMAIL}
            </a>{' '}
            or visit the box office with your name and this event.</>
          )}</>
        ) : null}
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
              {noEmail ? (
                <img
                  src={ticketPngUrl}
                  alt="Your ticket"
                  className="mt-4 max-w-full rounded border border-border-light"
                />
              ) : null}
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
      ) : generating ? (
        <p className="text-ink-muted text-sm mb-8">Generating ticket…</p>
      ) : null}

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
