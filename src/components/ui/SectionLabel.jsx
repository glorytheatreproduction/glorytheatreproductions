export default function SectionLabel({ children, variant = 'light', className = '' }) {
  const colour = variant === 'dark' ? 'text-gold-light' : 'text-gold-muted'

  return (
    <p
      className={`font-mono text-[11px] uppercase tracking-[0.2em] mb-4 ${colour} ${className}`}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      / {children}
    </p>
  )
}
