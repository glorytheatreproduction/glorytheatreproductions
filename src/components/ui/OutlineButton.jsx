import { Link } from 'react-router-dom'

export default function OutlineButton({ children, to, href, onClick, variant = 'dark', className = '' }) {
  const variantClasses =
    variant === 'light'
      ? 'border-ink text-ink hover:border-gold hover:text-gold'
      : 'border-cream/80 text-cream hover:border-gold hover:text-gold'

  const classes = `inline-flex items-center justify-center px-6 py-2.5 border font-body font-medium text-xs tracking-wide transition ${variantClasses} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  )
}
