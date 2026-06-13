import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/home', label: 'Home Page' },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/gallery', label: 'Gallery' },
  { to: '/admin/blog', label: 'Blog' },
  { to: '/admin/media', label: 'Media' },
]

export default function AdminLayout() {
  const { signOut, profile } = useAuth()
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-border-light bg-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="font-display text-lg text-ink">Glory Theatre CMS</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              {profile?.email || 'Staff'} · {profile?.role || 'editor'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-ink-muted transition hover:text-gold">View site</Link>
            <button type="button" className="text-sm text-ink-muted transition hover:text-gold" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          {links.map(({ to, label, end }) => {
            const active = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
            return (
              <Link
                key={to}
                to={to}
                className={`rounded px-3 py-2 text-sm transition ${
                  active ? 'bg-gold text-void font-medium' : 'text-ink-muted hover:bg-surface hover:text-ink'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AdminGuard({ children }) {
  const { loading, session, isStaff, supabaseConfigured } = useAuth()
  const location = useLocation()

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
        <div className="max-w-md rounded border border-border-light bg-paper p-8 text-center">
          <h1 className="font-display text-2xl text-ink">CMS Not Configured</h1>
          <p className="mt-4 text-sm text-ink-muted">
            Add <code className="text-ink">VITE_SUPABASE_URL</code> and <code className="text-ink">VITE_SUPABASE_ANON_KEY</code> to <code className="text-ink">.env.local</code>, then run the Supabase migrations.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-parchment text-ink-muted">Loading…</div>
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (!isStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
        <div className="max-w-md rounded border border-border-light bg-paper p-8 text-center">
          <h1 className="font-display text-2xl text-ink">Access Denied</h1>
          <p className="mt-4 text-sm text-ink-muted">Your account does not have staff permissions.</p>
          <Link to="/" className="mt-6 inline-block text-sm text-gold">Return to site</Link>
        </div>
      </div>
    )
  }

  return children
}
