import { MEDIA_POSITIONS, parseVideoUrl } from '../../lib/videoEmbed'

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

export default function BlogArticle({ content }) {
  if (!content?.length) return null

  return (
    <div className="space-y-6">
      {content.map((block, i) => {
        if (block.type === 'heading') {
          return (
            <h2
              key={i}
              className="font-display text-2xl md:text-3xl text-ink leading-tight pt-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {block.text}
            </h2>
          )
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={i}
              className="border-l-2 border-gold pl-6 py-2 my-8"
            >
              <p
                className="font-heading italic text-ink text-xl md:text-2xl leading-relaxed"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                &ldquo;{block.text}&rdquo;
              </p>
            </blockquote>
          )
        }

        if (block.type === 'image' && block.src) {
          return (
            <MediaFigure key={i} position={block.position} caption={block.caption}>
              <img
                src={block.src}
                alt={block.caption || ''}
                className="w-full rounded border border-border-light object-cover"
              />
            </MediaFigure>
          )
        }

        if (block.type === 'video' && (block.url || block.src)) {
          const videoUrl = block.url || block.src
          const parsed = parseVideoUrl(videoUrl)

          if (!parsed) return null

          if (parsed.kind === 'embed') {
            return (
              <MediaFigure key={i} position={block.position} caption={block.caption}>
                <div className="aspect-video overflow-hidden rounded border border-border-light bg-void">
                  <iframe
                    src={parsed.embedUrl}
                    title={block.caption || 'Embedded video'}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </MediaFigure>
            )
          }

          return (
            <MediaFigure key={i} position={block.position} caption={block.caption}>
              <video
                src={parsed.src}
                controls
                playsInline
                className="w-full rounded border border-border-light bg-void"
              >
                Your browser does not support embedded video.
              </video>
            </MediaFigure>
          )
        }

        if (block.type === 'image' || block.type === 'video') {
          return null
        }

        return (
          <p key={i} className="text-ink-muted text-base md:text-lg leading-relaxed">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}
