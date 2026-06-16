import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ADMIN_BTN, ADMIN_INPUT, ADMIN_LABEL, ADMIN_PANEL } from '../../components/admin/adminStyles'
import SiteLogo from '../../components/layout/SiteLogo'

export default function AdminLogin() {
  const { signIn, session, canAccessCms, isBlogAdmin, isBlogWriter, isCheckInStaff, isStaff, loading, supabaseConfigured } = useAuth()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && canAccessCms) {
    const destination = (location.state?.from)
      || (isCheckInStaff && !isStaff && !isBlogWriter && !isBlogAdmin ? '/admin/check-in' : null)
      || ((isBlogWriter || isBlogAdmin) && !isStaff ? '/admin/blog' : null)
      || '/admin'
    return <Navigate to={destination} replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signIn(identifier.trim(), password)
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Username/email or password is incorrect. Blog writers and ticket scanners sign in with their username. Blog admins, editors, and admins use their email.'
        : err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-parchment px-6">
      <header className="mx-auto w-full max-w-md pt-10">
        <Link to="/" className="inline-block">
          <SiteLogo variant="on-light" />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center pb-10">
        <div className={`${ADMIN_PANEL} w-full max-w-md`}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-gold-muted">Staff only</p>
          <h1 className="mt-2 font-display text-3xl text-ink">CMS Login</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Blog writers and ticket scanners: use your username. Blog admins, editors, and admins: use your email.
          </p>

          {!supabaseConfigured ? (
            <p className="mt-6 text-sm text-burgundy">The CMS is not configured yet. Contact your developer to finish setup.</p>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={onSubmit}>
              <div>
                <label className={ADMIN_LABEL} htmlFor="identifier">Username or email</label>
                <input
                  id="identifier"
                  className={ADMIN_INPUT}
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="username or glorytheatreproduction@gmail.com"
                  required
                />
              </div>
              <div>
                <label className={ADMIN_LABEL} htmlFor="password">Password</label>
                <input
                  id="password"
                  className={ADMIN_INPUT}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? <p className="text-sm text-burgundy">{error}</p> : null}
              <button type="submit" className={ADMIN_BTN} disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
            </form>
          )}

          <Link to="/" className="mt-6 inline-block text-sm text-ink-muted transition hover:text-gold">← Back to site</Link>
        </div>
      </div>

      <footer className="border-t border-border-light bg-stage">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4 px-6 py-5">
          <SiteLogo variant="on-dark" className="h-8" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-cream/60">Staff portal</p>
        </div>
      </footer>
    </div>
  )
}
