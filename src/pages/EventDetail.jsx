import { useParams, Navigate } from 'react-router-dom'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import AvailabilityBadge from '../components/ui/AvailabilityBadge'
import GoldButton from '../components/ui/GoldButton'
import CmsImage from '../components/ui/CmsImage'
import { isEventBookable } from '../services/cms/events'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useResolvedEvent, splitEventDescription } from '../hooks/useResolvedEvent'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function EventDetail() {
  const { eventId } = useParams()
  const { event, loading, ready } = useResolvedEvent(eventId)

  useDocumentTitle(
    event ? `${event.title} — Glory Theatre Productions` : 'Event Not Found',
    event?.description
  )
  useScrollReveal(eventId, ready)

  if (ready && !event) {
    return <Navigate to="/events" replace />
  }

  if (loading || !event) {
    return (
      <section className="bg-paper py-32">
        <div className="max-w-7xl mx-auto px-6 text-center text-ink-muted">Loading event…</div>
      </section>
    )
  }

  const bookable = isEventBookable(event)
  const descriptionParts = splitEventDescription(event.longDescription || event.description)

  return (
    <>
      <PageHero
        label={event.category}
        title={event.title}
        titleSize="detail"
        image={event.image}
        subtitle={
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <AvailabilityBadge status={event.availability} />
            <span
              className="font-mono text-[10px] text-cream/80 uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {event.dateLabel} · {event.time} · {event.venue}
            </span>
          </div>
        }
      />

      <section className="bg-paper py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_320px] gap-12 lg:gap-16">
            <div>
              <div data-reveal className="mb-10 overflow-hidden border border-border-light">
                <CmsImage src={event.image} alt={event.title} className="w-full aspect-[16/9] object-cover" />
              </div>

              <div data-reveal data-reveal-delay="1">
                <SectionLabel className="mb-6">About This Event</SectionLabel>
                <div className="prose prose-lg max-w-none text-ink-muted leading-relaxed space-y-6">
                  {descriptionParts.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                {event.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-8">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 border border-border-light text-ink-muted text-xs font-mono uppercase tracking-wider"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside data-reveal data-reveal-delay="2">
              <div className="sticky top-28 border border-border-light bg-parchment p-6 md:p-8">
                <SectionLabel className="mb-6">Event Details</SectionLabel>
                <dl className="space-y-4 mb-8">
                  {[
                    { label: 'Date', value: event.dateLabel },
                    { label: 'Time', value: event.time },
                    { label: 'Venue', value: event.venue },
                    { label: 'Capacity', value: `${event.capacity} seats` },
                    { label: 'Entry', value: 'Free — RSVP required' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt
                        className="font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-1"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {label}
                      </dt>
                      <dd className="text-ink text-sm">{value}</dd>
                    </div>
                  ))}
                </dl>

                {bookable ? (
                  <GoldButton to={`/events/${event.id}/tickets`} className="w-full justify-center">
                    Get Tickets
                  </GoldButton>
                ) : (
                  <p className="text-center text-sm text-ink-muted">This event is sold out.</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
