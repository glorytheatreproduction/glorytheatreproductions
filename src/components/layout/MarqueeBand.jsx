const DEFAULT_TEXT =
  'DRAMA ✦ CHOREOGRAPHY ✦ SPOKEN WORD ✦ PROCLAIMING CHRIST THROUGH THE ARTS ✦ GLORY THEATRE PRODUCTIONS ✦'

export default function MarqueeBand({ reverse = false, text = DEFAULT_TEXT, className = '' }) {
  const trackClass = reverse ? 'marquee-track-reverse' : 'marquee-track'

  return (
    <div
      className={`overflow-hidden bg-gold py-3 ${className}`}
      aria-hidden="true"
    >
      <div className={`flex whitespace-nowrap ${trackClass}`}>
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            className="px-8 text-void font-mono text-xs uppercase tracking-[0.25em]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
