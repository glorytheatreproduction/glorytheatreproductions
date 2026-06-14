import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import SiteLogo from './SiteLogo'

const navLinks = [
  { to: '/events', label: 'Events' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/blog', label: 'Blog' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const filled = scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setScrolled(window.scrollY > 80)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const navClass = filled
    ? 'bg-paper border-b border-border-light'
    : 'bg-transparent border-b border-transparent'

  return (
    <>
      <span
        data-filled={filled}
        className="site-nav-ambient fixed top-5 left-5 z-[60] font-mono text-[10px] uppercase tracking-widest hidden md:block transition-colors duration-300"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        GH · EST. 2013
      </span>

      <nav
        data-filled={filled}
        className={`site-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navClass}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center" onClick={() => setMenuOpen(false)}>
            <SiteLogo variant={filled ? 'on-light' : 'on-dark'} />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className="site-nav-link font-body text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-300"
              >
                {label}
              </NavLink>
            ))}
          </div>

          <button
            type="button"
            className="site-nav-menu-btn md:hidden p-2 transition-colors duration-300"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-void transition-transform duration-500 md:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-10">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `font-display text-4xl uppercase tracking-[0.12em] transition-colors ${
                  isActive ? 'text-gold' : 'text-cream hover:text-gold'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  )
}
