function getBentoSpan(slug, label, index, total) {
  if (slug === 'all') {
    return 'col-span-1 row-span-2 min-h-[8.5rem] sm:col-span-2 sm:row-span-2 sm:min-h-[9rem]'
  }

  const isLong = label.length > 14
  if (isLong) return 'col-span-2 sm:col-span-2'

  const nonAllCount = total - 1
  const nonAllIndex = index - 1
  if (nonAllCount > 0 && nonAllIndex === nonAllCount - 1 && nonAllCount % 2 !== 0) {
    return 'col-span-2 sm:col-span-1'
  }

  return 'col-span-1'
}

function tileLabel(slug, label) {
  if (slug !== 'all') return label
  return label.replace(/^All\s+/i, '')
}

export default function CategoryFilter({ categories, active, onChange, variant = 'dark' }) {
  const inactive =
    variant === 'light'
      ? 'border border-border-light bg-paper text-ink-muted hover:border-gold/60 hover:text-gold'
      : 'border border-cream/30 bg-stage/80 text-cream hover:border-gold hover:text-gold'

  const activeClass =
    variant === 'light'
      ? 'border-gold bg-gold text-void shadow-[0_10px_28px_rgba(201,168,76,0.22)]'
      : 'border-gold bg-gold text-void shadow-[0_10px_28px_rgba(201,168,76,0.18)]'

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:flex md:flex-wrap md:gap-2.5"
      role="group"
      aria-label="Filter by category"
    >
      {categories.map(({ label, slug }, index) => {
        const isActive = active === slug
        const isAll = slug === 'all'
        const bentoSpan = getBentoSpan(slug, label, index, categories.length)

        return (
          <button
            key={slug}
            type="button"
            onClick={() => onChange(slug)}
            aria-pressed={isActive}
            className={[
              'group relative overflow-hidden text-left transition-all duration-300',
              'rounded-2xl md:rounded-none md:px-4 md:py-1.5 md:text-sm md:text-center',
              'border min-h-[3.5rem] md:min-h-0',
              'flex flex-col justify-end p-3 md:block md:justify-center md:p-0 md:font-body md:tracking-wide',
              'md:col-span-auto md:row-span-auto md:aspect-auto md:min-h-0',
              bentoSpan,
              isActive ? activeClass : inactive,
            ].join(' ')}
          >
            <span
              className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 md:hidden ${
                isActive ? 'opacity-100' : 'group-hover:opacity-60'
              }`}
              style={{
                background:
                  'radial-gradient(circle at top right, rgba(201,168,76,0.14) 0%, transparent 58%)',
              }}
              aria-hidden
            />

            {isAll ? (
              <>
                <span
                  className="relative font-mono text-[9px] uppercase tracking-[0.22em] text-current/70 md:hidden"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  View
                </span>
                <span
                  className={`relative font-display leading-none text-current md:font-body md:text-sm md:tracking-wide ${
                    isActive ? 'font-medium' : ''
                  } ${isAll ? 'text-2xl sm:text-3xl mt-1 md:mt-0 md:text-sm' : ''}`}
                  style={{ fontFamily: isAll ? 'var(--font-display)' : undefined }}
                >
                  <span className="md:hidden">{tileLabel(slug, label)}</span>
                  <span className="hidden md:inline">{label}</span>
                </span>
              </>
            ) : (
              <span
                className={`relative text-sm leading-snug md:text-sm ${
                  isActive ? 'font-medium' : ''
                }`}
              >
                {label}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
