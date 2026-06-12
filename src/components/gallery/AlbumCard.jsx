import { Link } from 'react-router-dom'
import { getCategoryLabel } from '../../data/gallery'

export default function AlbumCard({ album, index = 0 }) {
  const photoCount = album.images.length

  return (
    <Link
      to={`/gallery/${album.id}`}
      data-reveal
      data-reveal-delay={String((index % 3) + 1)}
      className="group block bg-paper border border-border-light overflow-hidden transition-all duration-300 hover:border-gold/40 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(26,20,16,0.1)]"
    >
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={album.cover}
          alt={album.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-void/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span
            className="font-mono text-[10px] uppercase tracking-widest text-gold-light"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {getCategoryLabel(album.category)}
          </span>
          <h3
            className="font-display text-2xl md:text-3xl text-cream leading-tight mt-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {album.title}
          </h3>
        </div>
      </div>

      <div className="p-5 flex items-center justify-between gap-4">
        <p className="text-ink-muted text-sm leading-snug line-clamp-2 flex-1">
          {album.description}
        </p>
        <div className="text-right shrink-0">
          <p
            className="font-mono text-[10px] uppercase tracking-widest text-ink-muted"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {album.date}
          </p>
          <p
            className="font-mono text-[10px] uppercase tracking-widest text-gold mt-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}
          </p>
        </div>
      </div>
    </Link>
  )
}
