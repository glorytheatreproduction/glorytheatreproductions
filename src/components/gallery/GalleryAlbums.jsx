import AlbumCollageGrid from './AlbumCollageGrid'
import { useCms } from '../../context/CmsContext'
import { countAlbumPhotos } from '../../lib/galleryImages'
import { sortAlbumsByDate } from '../../lib/albumDates'

export default function GalleryAlbums({ albums = [] }) {
  const { getCategoryLabel } = useCms()
  const sortedAlbums = sortAlbumsByDate(albums)

  if (!sortedAlbums.length) {
    return (
      <p className="text-center text-sm text-ink-muted py-12">
        No photo albums yet.
      </p>
    )
  }

  return (
    <div className="space-y-16 md:space-y-20">
      {sortedAlbums.map((album, index) => {
        const photoCount = countAlbumPhotos(album.images, album.cover)

        return (
          <article
            key={album.id}
            id={album.id}
            className="scroll-mt-28"
          >
            <header
              className="max-w-3xl mb-8"
              data-reveal
              data-reveal-delay={String((index % 3) + 1)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-3 py-1 border border-border-light text-ink-muted text-[10px] font-mono uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {getCategoryLabel(album.category)}
                </span>
                {album.date ? (
                  <span
                    className="px-3 py-1 bg-gold-light text-gold-muted text-[10px] font-mono uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {album.date}
                  </span>
                ) : null}
              </div>
              <h3
                className="font-display text-2xl md:text-3xl text-ink leading-tight mt-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {album.title}
              </h3>
              {album.description ? (
                <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
                  {album.description}
                </p>
              ) : null}
              <p
                className="font-mono text-[10px] uppercase tracking-widest text-ink-muted/80 mt-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}
              </p>
            </header>

            <AlbumCollageGrid images={album.images} cover={album.cover} albumId={album.id} />
          </article>
        )
      })}
    </div>
  )
}
