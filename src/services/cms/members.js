import { getSupabase } from '../../lib/supabaseClient'

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

export async function inviteMember({ email, password, fullName, role = 'blog_writer' }) {
  const { data: { session } } = await getSupabase().auth.getSession()
  if (!session?.access_token) throw new Error('You must be signed in as an admin')

  const res = await fetch('/api/invite-member', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ email, password, fullName, role }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Invite failed')
  return data
}

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  blog_writer: 'Blog Writer',
  viewer: 'Viewer',
}
