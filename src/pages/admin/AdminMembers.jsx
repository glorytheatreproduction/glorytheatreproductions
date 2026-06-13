import { useEffect, useState } from 'react'
import {
  ADMIN_BTN,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_PANEL,
} from '../../components/admin/adminStyles'
import {
  ROLE_LABELS,
  fetchMembers,
  inviteMember,
  updateMember,
} from '../../services/cms/members'

const INVITE_ROLES = [
  { value: 'check_in', label: 'Ticket Scanner (check-in only)' },
  { value: 'blog_writer', label: 'Blog Writer' },
  { value: 'editor', label: 'Editor (full CMS)' },
  { value: 'viewer', label: 'Viewer (no CMS access)' },
]

const EDIT_ROLES = [
  { value: 'check_in', label: 'Ticket Scanner' },
  { value: 'blog_writer', label: 'Blog Writer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'super_admin', label: 'Super Admin' },
]

export default function AdminMembers() {
  const [members, setMembers] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [invite, setInvite] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'blog_writer',
  })

  const load = async () => {
    setLoading(true)
    try {
      setMembers(await fetchMembers())
    } catch (err) {
      setStatus(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onInvite = async (e) => {
    e.preventDefault()
    setInviting(true)
    setStatus('')
    try {
      await inviteMember(invite)
      setInvite({ fullName: '', email: '', password: '', role: 'blog_writer' })
      await load()
      setStatus('Member invited successfully.')
    } catch (err) {
      setStatus(err.message)
    } finally {
      setInviting(false)
    }
  }

  const onUpdateMember = async (member, changes) => {
    setStatus('')
    try {
      await updateMember(member.user_id, changes)
      await load()
      setStatus('Member updated.')
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Members</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Sign up blog writers and manage who can access the CMS.
        </p>
      </div>

      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}

      <section className={`${ADMIN_PANEL} space-y-4`}>
        <h2 className="font-display text-xl text-ink">Invite member</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onInvite}>
          <Field label="Full name" value={invite.fullName} onChange={(v) => setInvite({ ...invite, fullName: v })} />
          <Field label="Email" value={invite.email} onChange={(v) => setInvite({ ...invite, email: v })} type="email" required />
          <Field label="Temporary password" value={invite.password} onChange={(v) => setInvite({ ...invite, password: v })} type="password" required />
          <div>
            <label className={ADMIN_LABEL}>Role</label>
            <select
              className={ADMIN_INPUT}
              value={invite.role}
              onChange={(e) => setInvite({ ...invite, role: e.target.value })}
            >
              {INVITE_ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className={ADMIN_BTN} disabled={inviting}>
              {inviting ? 'Inviting…' : 'Invite member'}
            </button>
          </div>
        </form>
      </section>

      <section className={`${ADMIN_PANEL} space-y-4`}>
        <h2 className="font-display text-xl text-ink">All members</h2>
        {loading ? <p className="text-sm text-ink-muted">Loading…</p> : null}
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.user_id} className="grid gap-3 rounded border border-border-light p-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
              <div>
                <p className="font-medium text-ink">{member.full_name || 'Unnamed member'}</p>
                <p className="text-sm text-ink-muted">{member.email}</p>
              </div>
              <div>
                <label className={ADMIN_LABEL}>Role</label>
                <select
                  className={ADMIN_INPUT}
                  value={member.role}
                  onChange={(e) => onUpdateMember(member, { role: e.target.value })}
                >
                  {EDIT_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={ADMIN_LABEL}>Status</label>
                <select
                  className={ADMIN_INPUT}
                  value={member.status}
                  onChange={(e) => onUpdateMember(member, { status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <p className="text-xs text-ink-muted md:pb-2">{ROLE_LABELS[member.role] || member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className={ADMIN_LABEL}>{label}</label>
      <input
        className={ADMIN_INPUT}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  )
}
