import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ADMIN_BTN, ADMIN_INPUT, ADMIN_LABEL, ADMIN_PANEL } from '../../components/admin/adminStyles'

export default function AdminLogin() {
  const { signIn, session, canAccessCms, isBlogWriter, loading, supabaseConfigured } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && canAccessCms) {
    return <Navigate to={(location.state?.from) || (isBlogWriter ? '/admin/blog' : '/admin')} replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signIn(email.trim().toLowerCase(), password)
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email or password is incorrect. Use the admin email from setup and run npm run cms:create-admin if you need to reset the password.'
        : err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
      <div className={`${ADMIN_PANEL} w-full max-w-md`}>
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold-muted">Staff only</p>
        <h1 className="mt-2 font-display text-3xl text-ink">CMS Login</h1>
        <p className="mt-2 text-sm text-ink-muted">Sign in to edit site content, events, gallery, and blog.</p>

        {!supabaseConfigured ? (
          <p className="mt-6 text-sm text-burgundy">The CMS is not configured yet. Contact your developer to finish setup.</p>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className={ADMIN_LABEL} htmlFor="email">Email</label>
              <input id="email" className={ADMIN_INPUT} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className={ADMIN_LABEL} htmlFor="password">Password</label>
              <input id="password" className={ADMIN_INPUT} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error ? <p className="text-sm text-burgundy">{error}</p> : null}
            <button type="submit" className={ADMIN_BTN} disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
          </form>
        )}

        <Link to="/" className="mt-6 inline-block text-sm text-ink-muted transition hover:text-gold">← Back to site</Link>
      </div>
    </div>
  )
}
