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

        return (
          <p key={i} className="text-ink-muted text-base md:text-lg leading-relaxed">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}
