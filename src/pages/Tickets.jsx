import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import EventSummaryCard from '../components/events/EventSummaryCard'
import RsvpForm from '../components/events/RsvpForm'
import RsvpSuccess from '../components/events/RsvpSuccess'
import { isEventBookable } from '../services/cms/events'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useResolvedEvent } from '../hooks/useResolvedEvent'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Tickets() {
  const { eventId } = useParams()
  const { event, loading, ready } = useResolvedEvent(eventId)
  const [success, setSuccess] = useState(null)

  useDocumentTitle(
    event ? `Reserve Tickets — ${event.title}` : 'Tickets — Glory Theatre Productions',
    event ? `Reserve your free seat for ${event.title}. Digital ticket delivered by email.` : undefined
  )
  useScrollReveal()

  if (ready && !event) {
    return <Navigate to="/events" replace />
  }

  if (loading || !event) {
    return (
      <section className="bg-paper py-32">
        <div className="max-w-7xl mx-auto px-6 text-center text-ink-muted">Loading tickets…</div>
      </section>
    )
  }

  if (!isEventBookable(event)) {
    return <Navigate to={`/events/${event.id}`} replace />
  }

  return (
    <>
      <PageHero
        label="Tickets & RSVP"
        title="Reserve Your Seat"
        backLink={{ to: `/events/${event.id}`, label: event.title }}
      />

      {/* Form */}
      <section className="bg-paper py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          {success ? (
            <RsvpSuccess
              event={event}
              ticketId={success.ticketID}
              email={success.email}
            />
          ) : (
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-start">
              <div data-reveal>
                <EventSummaryCard event={event} />
              </div>

              <div data-reveal data-reveal-delay="1">
                <div className="bg-surface border border-border-light p-6 md:p-10">
                  <SectionLabel className="mb-6">Your Details</SectionLabel>
                  <RsvpForm
                    event={event}
                    onSuccess={setSuccess}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
