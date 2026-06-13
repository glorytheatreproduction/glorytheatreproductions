import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ADMIN_BTN, ADMIN_INPUT, ADMIN_LABEL, ADMIN_PANEL } from '../../components/admin/adminStyles'

export default function AdminLogin() {
  const { signIn, session, isStaff, loading, supabaseConfigured } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && isStaff) {
    return <Navigate to={(location.state?.from) || '/admin'} replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Login failed')
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
          <p className="mt-6 text-sm text-burgundy">Supabase is not configured. Add env vars and restart the dev server.</p>
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
