import { resolveCmsImageUrl } from '../../lib/cmsImage'
import CmsImage from '../ui/CmsImage'
import { MEDIA_POSITIONS } from '../../lib/videoEmbed'

function MediaFigure({ position, caption, children }) {
  const positionClass = MEDIA_POSITIONS[position] || MEDIA_POSITIONS.center
  return (
    <figure className={`my-8 ${positionClass}`}>
      {children}
      {caption ? (
        <figcaption className="mt-2 text-center text-sm text-ink-muted italic">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

export default function BlogAudioPost({ url, title = '', artist = '', cover = '', caption = '', position = 'center' }) {
  const audioUrl = resolveCmsImageUrl(url)
  const coverUrl = resolveCmsImageUrl(cover)

  if (!audioUrl) return null

  return (
    <MediaFigure position={position} caption={caption}>
      <div className="overflow-hidden rounded-xl border border-border-light bg-paper shadow-[0_12px_40px_rgba(26,20,16,0.08)]">
        <div className="relative aspect-[4/5] max-h-[420px] w-full bg-stage">
          {coverUrl ? (
            <CmsImage
              src={coverUrl}
              alt={title || 'Track cover'}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stage via-void to-burgundy/50">
              <span className="font-display text-6xl text-gold/80" style={{ fontFamily: 'var(--font-display)' }} aria-hidden>
                ♪
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/90 via-void/50 to-transparent px-4 pb-4 pt-16">
            <div className="rounded-full border border-cream/15 bg-void/80 px-3 py-2 backdrop-blur-sm">
              <audio
                src={audioUrl}
                controls
                playsInline
                preload="metadata"
                className="block h-9 w-full [&::-webkit-media-controls-panel]:bg-transparent"
              >
                Your browser does not support embedded audio.
              </audio>
            </div>
          </div>
        </div>

        {(title || artist) ? (
          <div className="border-t border-border-light px-4 py-3">
            {title ? (
              <p className="truncate font-medium text-ink">{title}</p>
            ) : null}
            {artist ? (
              <p
                className="truncate font-mono text-[10px] uppercase tracking-widest text-ink-muted mt-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {artist}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </MediaFigure>
  )
}
