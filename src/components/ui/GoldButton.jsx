import { Link } from 'react-router-dom'

export default function GoldButton({ children, to, href, onClick, className = '' }) {
  const classes = `inline-flex items-center justify-center px-6 py-2.5 bg-gold text-void font-body font-medium text-xs tracking-wide transition hover:bg-gold-muted hover:text-cream ${className}`

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
