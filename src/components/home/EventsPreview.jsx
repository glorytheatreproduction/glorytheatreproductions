import { Link } from 'react-router-dom'
import SectionLabel from '../ui/SectionLabel'
import DateBlock from '../ui/DateBlock'
import AvailabilityBadge from '../ui/AvailabilityBadge'
import { events } from '../../data/events'

const previewEvents = events.filter((e) => !e.featured).slice(0, 3)

export default function EventsPreview() {
  return (
    <section className="bg-paper py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div data-reveal>
          <SectionLabel className="mb-12">Upcoming Events</SectionLabel>
        </div>

        <div className="grid md:grid-cols-3 gap-6" data-reveal data-reveal-delay="1">
          {previewEvents.map((event) => (
            <article
              key={event.id}
              className="bg-surface border border-border-light group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(26,20,16,0.12)]"
            >
              <div className="relative overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full aspect-[16/10] object-cover"
                  loading="lazy"
                />
                <div className="absolute top-4 right-4">
                  <AvailabilityBadge status={event.availability} />
                </div>
              </div>

              <div className="p-6">
                <DateBlock day={event.day} month={event.month} className="mb-4" />

                <h3
                  className="font-display text-2xl text-ink mb-3"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {event.title}
                </h3>

                <span
                  className="inline-block px-3 py-1 bg-gold-light text-gold-muted text-[10px] font-mono uppercase tracking-wider mb-4"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {event.category}
                </span>

                <Link to={`/events/${event.id}/tickets`} className="gold-link text-sm block">
                  Book →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div data-reveal data-reveal-delay="2" className="mt-12 text-right">
          <Link to="/events" className="gold-link text-sm">
            View All Events →
          </Link>
        </div>
      </div>
    </section>
  )
}
