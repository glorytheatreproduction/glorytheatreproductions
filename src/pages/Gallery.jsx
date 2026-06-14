import { useCallback, useMemo, useRef, useState } from 'react'
import PageHero from '../components/ui/PageHero'
import CategoryFilter from '../components/events/CategoryFilter'
import GalleryAlbums from '../components/gallery/GalleryAlbums'
import { useCms } from '../context/CmsContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'

function albumMatchesFilter(album, filter) {
  return filter === 'all' || album.category === filter
}

export default function Gallery() {
  const { galleryAlbums, galleryCategories, pageHeroes, loading } = useCms()
  const hero = pageHeroes.gallery
  const contentRef = useRef(null)

  useDocumentTitle(
    'Gallery — Glory Theatre Productions',
    'Browse photo albums from Glory Theatre Productions performances, choreography, spoken word, and behind-the-scenes moments.'
  )

  const [filter, setFilter] = useState('all')
  useScrollReveal(loading, filter)

  const matchCount = useMemo(
    () => galleryAlbums.filter((album) => albumMatchesFilter(album, filter)).length,
    [galleryAlbums, filter]
  )

  const handleFilterChange = useCallback((slug) => {
    setFilter(slug)
    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

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
            {hero.subtitle}
          </p>
        }
      />

      <section className="bg-paper py-8 border-b border-border-light sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-6">
          <CategoryFilter
            categories={galleryCategories}
            active={filter}
            onChange={handleFilterChange}
            variant="light"
          />
        </div>
      </section>

      <section ref={contentRef} className="bg-parchment py-16 md:py-24 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="py-20 text-center">
              <p
                className="font-mono text-xs uppercase tracking-widest text-ink-muted"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Loading gallery…
              </p>
            </div>
          ) : matchCount > 0 ? (
            <GalleryAlbums albums={galleryAlbums} filter={filter} />
          ) : (
            <div className="py-20 text-center">
              <p
                className="font-heading italic text-ink-muted text-2xl"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                No albums in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
