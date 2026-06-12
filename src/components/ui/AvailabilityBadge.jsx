const styles = {
  'Seats Available': 'bg-gold/20 text-gold border-gold/30',
  'Limited Seats': 'bg-burgundy-light/20 text-burgundy-light border-burgundy-light/30',
  'Last Seats': 'bg-burgundy/30 text-cream border-burgundy-light/40',
  'Sold Out': 'bg-ink/10 text-ink-muted border-border-light',
}

export default function AvailabilityBadge({ status, className = '' }) {
  const style = styles[status] || styles['Seats Available']

  return (
    <span
      className={`inline-block px-3 py-1 text-[10px] font-mono uppercase tracking-wider border ${style} ${className}`}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {status}
    </span>
  )
}
