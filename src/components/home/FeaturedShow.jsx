import { Link } from 'react-router-dom'
import SectionLabel from '../ui/SectionLabel'
import DateBlock from '../ui/DateBlock'
import AvailabilityBadge from '../ui/AvailabilityBadge'
import GoldButton from '../ui/GoldButton'
import { events } from '../../data/events'

const featured = events.find((e) => e.featured) || events[0]

export default function FeaturedShow() {
  return (
    <section className="bg-parchment border-t border-border-light relative isolate overflow-hidden">
      <div className="grid md:grid-cols-2 w-full min-h-[48vh] md:min-h-[52vh]">
        <div
          data-reveal
          className="relative overflow-hidden min-h-[240px] md:min-h-0 h-full group"
        >
          <img
            src={featured.image}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute top-6 left-6 md:top-8 md:left-8">
            <span
              className="px-3 py-1 bg-gold text-void text-[10px] font-mono uppercase tracking-wider font-medium"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Featured
            </span>
          </div>
        </div>

        <div
          data-reveal
          data-reveal-delay="1"
          className="bg-parchment p-8 md:p-10 lg:p-12 flex flex-col justify-center h-full min-h-[240px] border-t md:border-t-0 md:border-l border-border-light"
        >
          <SectionLabel className="mb-4">Upcoming Event</SectionLabel>
          <DateBlock day={featured.day} month={featured.month} className="mb-4" />

          <h2
            className="font-display text-2xl md:text-3xl lg:text-4xl text-ink leading-tight mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Link to={`/events/${featured.id}`} className="hover:text-gold transition-colors">
              {featured.title}
            </Link>
          </h2>

          <div className="flex flex-wrap gap-2 mb-4">
            {featured.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 border border-border-light text-ink-muted text-xs font-mono uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-ink-muted text-sm leading-relaxed mb-4 max-w-xl">
            {featured.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <AvailabilityBadge status={featured.availability} />
            <span
              className="font-mono text-[10px] text-gold-muted uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {featured.dateLabel} · {featured.venue}
            </span>
          </div>

          <div className="flex flex-wrap gap-4">
            <GoldButton to={`/events/${featured.id}/tickets`}>Reserve Seat</GoldButton>
            <Link to={`/events/${featured.id}`} className="gold-link text-sm self-center">
              Event Details →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
