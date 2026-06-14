import AlbumCollageGrid from './AlbumCollageGrid'
import { useCms } from '../../context/CmsContext'

export default function GalleryAlbums({ albums = [] }) {
  const { getCategoryLabel } = useCms()
  if (!albums.length) {
    return (
      <p className="text-center text-sm text-ink-muted py-12">
        No photo albums yet.
      </p>
    )
  }

  return (
    <div className="space-y-16 md:space-y-20">
      {albums.map((album, index) => {
        const photoCount = album.images.length

        return (
          <article
            key={album.id}
            id={album.id}
            data-reveal
            data-reveal-delay={String((index % 3) + 1)}
            className="scroll-mt-28"
          >
            <header className="max-w-3xl mb-8">
              <p
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold-muted"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {getCategoryLabel(album.category)}
              </p>
              <h3
                className="font-display text-2xl md:text-3xl text-ink leading-tight mt-2"
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
                {album.date} · {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}
              </p>
            </header>

            <AlbumCollageGrid images={album.images} cover={album.cover} albumId={album.id} />
          </article>
        )
      })}
    </div>
  )
}
