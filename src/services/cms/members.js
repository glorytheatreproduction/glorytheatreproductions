import { getSupabase, supabaseIsConfigured } from '../../lib/supabaseClient'
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

async function inviteViaEdgeFunction(payload, accessToken) {
  const { data, error } = await getSupabase().functions.invoke('invite-member', {
    body: payload,
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (error) {
    throw new Error(error.message || 'Invite failed')
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}

async function inviteViaVercelApi(payload, accessToken) {
  const res = await fetch('/api/invite-member', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
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
        : `Invite failed (${res.status}): ${text.slice(0, 120) || 'API unavailable'}`
    )
  }

  if (!res.ok) throw new Error(data.error || `Invite failed (${res.status})`)
  return data
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

  if (!supabaseIsConfigured) {
    throw new Error('Supabase is not configured')
  }

  try {
    return await inviteViaEdgeFunction(payload, session.access_token)
  } catch (edgeError) {
    const message = edgeError?.message || ''
    const edgeUnavailable = /failed to send|function not found|404|not configured/i.test(message)

    if (!edgeUnavailable) {
      throw edgeError
    }

    return inviteViaVercelApi(payload, session.access_token)
  }
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
