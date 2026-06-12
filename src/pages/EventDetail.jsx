import { useParams, Navigate } from 'react-router-dom'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import AvailabilityBadge from '../components/ui/AvailabilityBadge'
import GoldButton from '../components/ui/GoldButton'
import { getEventById, isEventBookable } from '../data/events'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function EventDetail() {
  const { eventId } = useParams()
  const event = getEventById(eventId)

  useDocumentTitle(
    event ? `${event.title} — Glory Theatre Productions` : 'Event Not Found',
    event?.description
  )
  useScrollReveal()

  if (!event) {
    return <Navigate to="/events" replace />
  }

  const bookable = isEventBookable(event)

  return (
    <>
      <PageHero
        label={event.category}
        title={event.title}
        image={event.image}
        titleSize="detail"
        backLink={{ to: '/events', label: 'All Events' }}
      >
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col">
            <span
              className="font-mono font-medium text-cream text-5xl leading-none"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {event.day}
            </span>
            <span
              className="font-mono uppercase tracking-widest text-cream/75 text-xs"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {event.month}
            </span>
          </div>
          <div>
            <p className="text-cream/90 text-sm">{event.dateLabel}</p>
            <p
              className="font-mono text-xs text-cream/75 uppercase tracking-wider mt-1"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {event.time} · {event.venue}
            </p>
          </div>
          <AvailabilityBadge status={event.availability} />
        </div>
      </PageHero>

      {/* Content */}
      <section className="bg-paper py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_360px] gap-12 lg:gap-16">
            <div>
              <div data-reveal className="mb-10 overflow-hidden border border-border-light">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full aspect-[16/9] object-cover"
                />
              </div>

              <div data-reveal data-reveal-delay="1">
                <SectionLabel className="mb-6">About This Event</SectionLabel>
                <p className="text-ink-muted text-base leading-relaxed mb-6">
                  {event.longDescription || event.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-10">
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
              </div>

              <div
                data-reveal
                data-reveal-delay="2"
                className="grid sm:grid-cols-3 gap-6 border-t border-border-light pt-10"
              >
                {[
                  { label: 'Venue', value: event.venue },
                  { label: 'Capacity', value: `${event.capacity} seats` },
                  { label: 'Entry', value: 'Free — RSVP required' },
                ].map((item) => (
                  <div key={item.label}>
                    <p
                      className="font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-2"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {item.label}
                    </p>
                    <p className="text-ink text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar CTA */}
            <aside data-reveal data-reveal-delay="1" className="lg:sticky lg:top-28 h-fit">
              <div className="bg-parchment border border-border-light p-8">
                <p
                  className="font-mono text-[10px] uppercase tracking-widest text-gold-muted mb-4"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Reserve Your Seat
                </p>

                <p className="text-ink-muted text-sm leading-relaxed mb-6">
                  Free entry. A digital ticket with QR code will be emailed to you after reservation.
                </p>

                {bookable ? (
                  <GoldButton to={`/events/${event.id}/tickets`} className="w-full text-center">
                    Get Tickets
                  </GoldButton>
                ) : (
                  <p className="text-ink-muted text-sm text-center py-3 border border-border-light">
                    This event is sold out
                  </p>
                )}

                <p
                  className="font-mono text-[10px] text-ink-muted/60 uppercase tracking-wider text-center mt-4"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {event.availability}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
