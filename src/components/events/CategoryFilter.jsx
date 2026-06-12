export default function CategoryFilter({ categories, active, onChange, variant = 'dark' }) {
  const inactive =
    variant === 'light'
      ? 'border border-border-light text-ink-muted hover:border-gold hover:text-gold'
      : 'border border-cream/40 text-cream hover:border-gold hover:text-gold'

  return (
    <div className="flex flex-wrap gap-2.5">
      {categories.map(({ label, slug }) => (
        <button
          key={slug}
          type="button"
          onClick={() => onChange(slug)}
          className={`px-4 py-1.5 text-sm font-body tracking-wide transition-all duration-300 ${
            active === slug
              ? 'bg-gold text-void font-medium'
              : inactive
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
