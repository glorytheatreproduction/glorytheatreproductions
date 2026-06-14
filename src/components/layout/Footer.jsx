import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SOCIAL_PLATFORMS } from '../../config/contentDefaults'
import { useCms } from '../../context/CmsContext'
import SiteLogo from './SiteLogo'
import MarqueeBand from './MarqueeBand'

const quickLinks = [
  { to: '/events', label: 'Events' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/blog', label: 'Blog' },
]

export default function Footer() {
  const { socialLinks } = useCms()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const connectLinks = useMemo(
    () =>
      SOCIAL_PLATFORMS.map(({ key, label }) => ({
        label,
        href: socialLinks[key]?.trim() || '',
      })).filter(({ href }) => href && href !== '#'),
    [socialLinks]
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email && email.includes('@')) {
      setSubmitted(true)
      setEmail('')
    }
  }

  return (
    <>
      <MarqueeBand reverse className="border-t border-border-dark" />

      <footer className="section-dark relative bg-void border-t border-border-dark pt-10 pb-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <Link to="/" className="inline-block">
                <SiteLogo variant="on-dark" />
              </Link>
              <p className="mt-3 text-cream/85 text-sm font-body leading-tight">
                Bringing stories to life on stage.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4
                className="font-mono text-[11px] uppercase tracking-widest text-gold-light mb-3 leading-none"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Quick Links
              </h4>
              <ul className="space-y-1">
                {quickLinks.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-cream/90 text-xs uppercase tracking-[0.2em] leading-tight hover:text-gold transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4
                className="font-mono text-[11px] uppercase tracking-widest text-gold-light mb-3 leading-none"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Connect
              </h4>
              {connectLinks.length ? (
                <ul className="space-y-1">
                  {connectLinks.map(({ label, href }) => (
                    <li key={label}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cream/90 text-sm leading-tight hover:text-gold transition-colors"
                        aria-label={label}
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-cream/60 text-sm leading-tight">Follow us online soon.</p>
              )}
            </div>

            {/* Newsletter */}
            <div>
              <h4
                className="font-mono text-[11px] uppercase tracking-widest text-gold-light mb-3 leading-none"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Newsletter
              </h4>
              <p className="text-cream/85 text-sm leading-tight mb-2">
                Stay updated with our latest shows and events.
              </p>
              <form onSubmit={handleSubmit} className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="flex-1 bg-stage border border-border-dark px-3 py-2 text-cream text-xs placeholder-cream/40 focus:outline-none focus:border-gold/50"
                />
                <button
                  type="submit"
                  className="bg-gold text-void px-4 py-2 text-xs font-medium hover:bg-gold-muted transition-colors"
                >
                  →
                </button>
              </form>
              {submitted && (
                <p className="text-gold text-xs mt-2">Thank you for subscribing!</p>
              )}
            </div>
          </div>

          <div className="border-t border-gold/10 pt-5 text-center">
            <p
              className="font-mono text-[11px] text-cream/70 uppercase tracking-widest leading-none"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              © 2024 Glory Theatre Productions
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
