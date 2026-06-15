import { getSupabase } from '../../lib/supabaseClient'
import { roleUsesUsername } from '../../lib/staffAuth'

export async function fetchMembers() {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function updateMember(userId, { role, status, fullName }) {
  const payload = { updated_at: new Date().toISOString() }
  if (role) payload.role = role
  if (status) payload.status = status
  if (fullName != null) payload.full_name = fullName

  const { error } = await getSupabase()
    .from('profiles')
    .update(payload)
    .eq('user_id', userId)
  if (error) throw error
}

export async function inviteMember({ email, username, password, fullName, role = 'blog_writer' }) {
  const { data: { session } } = await getSupabase().auth.getSession()
  if (!session?.access_token) throw new Error('You must be signed in as an admin')

  const payload = { password, fullName, role }
  if (roleUsesUsername(role)) {
    payload.username = username
  } else {
    payload.email = email
  }

  const res = await fetch('/api/invite-member', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(
      res.ok
        ? 'Invite failed: invalid server response'
        : `Invite failed (${res.status}): ${text.slice(0, 120) || 'API unavailable — run npm run dev:vercel locally or check Vercel env vars'}`
    )
  }

  if (!res.ok) throw new Error(data.error || `Invite failed (${res.status})`)
  return data
}

export { getMemberLoginLabel, roleUsesUsername } from '../../lib/staffAuth'

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  blog_admin: 'Blog Admin',
  blog_writer: 'Blog Writer',
  check_in: 'Ticket Scanner',
  viewer: 'Viewer',
}
