export default function DateBlock({ day, month, size = 'default', className = '' }) {
  const daySize = size === 'large' ? 'text-[80px] leading-none' : 'text-5xl leading-none'
  const monthSize = size === 'large' ? 'text-sm' : 'text-xs'

  return (
    <div className={`flex flex-col ${className}`}>
      <span
        className={`font-mono font-medium text-ink ${daySize}`}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {day}
      </span>
      <span
        className={`font-mono uppercase tracking-widest text-gold-muted ${monthSize}`}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {month}
      </span>
    </div>
  )
}
