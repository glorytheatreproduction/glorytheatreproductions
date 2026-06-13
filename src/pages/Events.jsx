import { useState } from 'react'
import PageHero from '../components/ui/PageHero'
import SectionLabel from '../components/ui/SectionLabel'
import CategoryFilter from '../components/events/CategoryFilter'
import EventTab from '../components/events/EventTab'
import EventInfoStrip from '../components/events/EventInfoStrip'
import FeaturedEventBanner from '../components/events/FeaturedEventBanner'
import { useCms } from '../context/CmsContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Events() {
  const { events, season, categories, pageHeroes, loading } = useCms()
  const [filter, setFilter] = useState('all')

  useDocumentTitle(
    'Events & Productions — Glory Theatre Productions',
    'Browse upcoming events and productions from Glory Theatre Productions. Free entry — reserve your digital ticket online.'
  )

  const hero = pageHeroes.events
  const featured = events.find((e) => e.featured)
  const filtered = filter === 'all'
    ? events
    : events.filter((e) => e.categorySlug === filter)
  const showBanner = Boolean(featured && (filter === 'all' || featured.categorySlug === filter))
  const tabEvents = filtered.filter((e) => !(showBanner && e.featured))

  useScrollReveal(filter, events.length, tabEvents.length)

  return (
    <>
      <PageHero
        label={hero.label}
        title={hero.title}
        subtitle={
          <p
            className="font-mono text-xs text-cream/80 uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {season}
          </p>
        }
      />

      <EventInfoStrip />

      <section className="bg-paper py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="py-16 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">Loading events…</p>
            </div>
          ) : (
            <>
              {showBanner ? <FeaturedEventBanner featured={featured} /> : null}

              <div data-reveal className="mb-12">
                <SectionLabel className="mb-6">Filter by Category</SectionLabel>
                <CategoryFilter
                  categories={categories}
                  active={filter}
                  onChange={setFilter}
                  variant="light"
                />
              </div>

              {tabEvents.length > 0 ? (
                <div data-reveal data-reveal-delay="1">
                  <SectionLabel className="mb-6">
                    {showBanner ? 'Other Events' : 'All Events'}
                  </SectionLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {tabEvents.map((event, index) => (
                      <EventTab key={event.id} event={event} index={index} />
                    ))}
                  </div>
                </div>
              ) : null}

              {filtered.length === 0 ? (
                <div data-reveal className="py-20 text-center">
                  <p
                    className="font-heading italic text-ink-muted text-2xl"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {events.length === 0 ? 'No upcoming events yet.' : 'No events match this category.'}
                  </p>
                  <p className="text-ink-muted/60 text-sm mt-4">
                    {events.length === 0
                      ? 'Check back soon for new shows and performances.'
                      : 'Try selecting a different filter.'}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </>
  )
}
