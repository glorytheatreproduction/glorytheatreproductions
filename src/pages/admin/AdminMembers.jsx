import { useEffect, useState } from 'react'
import {
  ADMIN_BTN,
  ADMIN_BTN_DANGER,
  ADMIN_BTN_OUTLINE,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_PANEL,
} from '../../components/admin/adminStyles'
import { useAuth } from '../../context/AuthContext'
import {
  ROLE_LABELS,
  deleteMember,
  fetchMembers,
  getMemberLoginLabel,
  inviteMember,
  roleUsesUsername,
  updateMember,
} from '../../services/cms/members'

const INVITE_ROLES = [
  { value: 'check_in', label: 'Ticket Scanner (check-in only)' },
  { value: 'blog_writer', label: 'Blog Writer' },
  { value: 'blog_admin', label: 'Blog Admin (edit, approve & publish)' },
  { value: 'editor', label: 'Editor (full CMS)' },
  { value: 'viewer', label: 'Viewer (no CMS access)' },
]

const EDIT_ROLES = [
  { value: 'check_in', label: 'Ticket Scanner' },
  { value: 'blog_writer', label: 'Blog Writer' },
  { value: 'blog_admin', label: 'Blog Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'super_admin', label: 'Super Admin' },
]

function memberToEditForm(member) {
  return {
    fullName: member.full_name || '',
    email: member.email || '',
    username: member.username || getMemberLoginLabel(member),
    password: '',
    role: member.role,
    status: member.status,
  }
}

export default function AdminMembers() {
  const { profile } = useAuth()
  const isSuperAdmin = profile?.role === 'super_admin'
  const [members, setMembers] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [invite, setInvite] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    role: 'blog_writer',
  })

  const usesUsername = roleUsesUsername(invite.role)
  const editUsesUsername = editForm ? roleUsesUsername(editForm.role) : false

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
      setInvite({ fullName: '', email: '', username: '', password: '', role: 'blog_writer' })
      await load()
      setStatus('Member invited successfully.')
    } catch (err) {
      setStatus(err.message)
    } finally {
      setInviting(false)
    }
  }

  const startEdit = (member) => {
    setEditingId(member.user_id)
    setEditForm(memberToEditForm(member))
    setStatus('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const onSaveMember = async (member) => {
    if (!editForm) return
    setSavingId(member.user_id)
    setStatus('')
    try {
      await updateMember(member.user_id, {
        fullName: editForm.fullName,
        role: editForm.role,
        status: editForm.status,
        ...(editUsesUsername ? { username: editForm.username } : { email: editForm.email }),
        ...(editForm.password ? { password: editForm.password } : {}),
      })
      cancelEdit()
      await load()
      setStatus('Member updated.')
    } catch (err) {
      setStatus(err.message)
    } finally {
      setSavingId(null)
    }
  }

  const onDeleteMember = async (member) => {
    const label = member.full_name || getMemberLoginLabel(member)
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return

    setDeletingId(member.user_id)
    setStatus('')
    try {
      await deleteMember(member.user_id)
      if (editingId === member.user_id) cancelEdit()
      await load()
      setStatus('Member deleted.')
    } catch (err) {
      setStatus(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const roleOptionsForMember = (member) => {
    if (isSuperAdmin) return EDIT_ROLES
    if (['admin', 'super_admin'].includes(member.role)) {
      return EDIT_ROLES.filter((role) => !['admin', 'super_admin'].includes(role.value))
    }
    return EDIT_ROLES.filter((role) => !['super_admin'].includes(role.value))
  }

  const canManageMember = (member) => {
    if (member.user_id === profile?.user_id) return true
    if (['admin', 'super_admin'].includes(member.role)) return isSuperAdmin
    return true
  }

  const canDeleteMember = (member) => member.user_id !== profile?.user_id && canManageMember(member)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Members</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Blog writers and ticket scanners sign in with a username. Blog admins, editors, and admins use email.
        </p>
      </div>

      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}

      <section className={`${ADMIN_PANEL} space-y-4`}>
        <h2 className="font-display text-xl text-ink">Invite member</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onInvite}>
          <Field label="Full name" value={invite.fullName} onChange={(v) => setInvite({ ...invite, fullName: v })} />
          {usesUsername ? (
            <Field
              label="Username"
              value={invite.username}
              onChange={(v) => setInvite({ ...invite, username: v })}
              placeholder="e.g. jane.writer"
              required
            />
          ) : (
            <Field label="Email" value={invite.email} onChange={(v) => setInvite({ ...invite, email: v })} type="email" required />
          )}
          <Field label="Temporary password" value={invite.password} onChange={(v) => setInvite({ ...invite, password: v })} type="password" required />
          <div>
            <label className={ADMIN_LABEL}>Role</label>
            <select
              className={ADMIN_INPUT}
              value={invite.role}
              onChange={(e) => setInvite({ ...invite, role: e.target.value, email: '', username: '' })}
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
          {members.map((member) => {
            const isEditing = editingId === member.user_id
            const manageable = canManageMember(member)

            return (
              <div key={member.user_id} className="rounded border border-border-light p-4">
                <div className="grid gap-3 md:grid-cols-[1.2fr_auto] md:items-start">
                  <div>
                    <p className="font-medium text-ink">{member.full_name || 'Unnamed member'}</p>
                    <p className="text-sm text-ink-muted">
                      {roleUsesUsername(member.role)
                        ? `@${getMemberLoginLabel(member)}`
                        : member.email}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {ROLE_LABELS[member.role] || member.role}
                      {' · '}
                      {member.status === 'active' ? 'Active' : 'Suspended'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {manageable ? (
                      <button
                        type="button"
                        className={ADMIN_BTN_OUTLINE}
                        onClick={() => (isEditing ? cancelEdit() : startEdit(member))}
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                    ) : null}
                    {canDeleteMember(member) ? (
                      <button
                        type="button"
                        className={ADMIN_BTN_DANGER}
                        disabled={deletingId === member.user_id}
                        onClick={() => onDeleteMember(member)}
                      >
                        {deletingId === member.user_id ? 'Deleting…' : 'Delete'}
                      </button>
                    ) : null}
                  </div>
                </div>

                {isEditing && editForm ? (
                  <form
                    className="mt-4 grid gap-4 border-t border-border-light pt-4 md:grid-cols-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      onSaveMember(member)
                    }}
                  >
                    <Field
                      label="Full name"
                      value={editForm.fullName}
                      onChange={(v) => setEditForm({ ...editForm, fullName: v })}
                    />
                    {editUsesUsername ? (
                      <Field
                        label="Username"
                        value={editForm.username}
                        onChange={(v) => setEditForm({ ...editForm, username: v })}
                        required
                      />
                    ) : (
                      <Field
                        label="Email"
                        value={editForm.email}
                        onChange={(v) => setEditForm({ ...editForm, email: v })}
                        type="email"
                        required
                      />
                    )}
                    <Field
                      label="New password"
                      value={editForm.password}
                      onChange={(v) => setEditForm({ ...editForm, password: v })}
                      type="password"
                      placeholder="Leave blank to keep current"
                    />
                    <div>
                      <label className={ADMIN_LABEL}>Role</label>
                      <select
                        className={ADMIN_INPUT}
                        value={editForm.role}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          role: e.target.value,
                          email: '',
                          username: '',
                        })}
                      >
                        {roleOptionsForMember(member).map((role) => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={ADMIN_LABEL}>Status</label>
                      <select
                        className={ADMIN_INPUT}
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <button type="submit" className={ADMIN_BTN} disabled={savingId === member.user_id}>
                        {savingId === member.user_id ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder }) {
  return (
    <div>
      <label className={ADMIN_LABEL}>{label}</label>
      <input
        className={ADMIN_INPUT}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </div>
  )
}
