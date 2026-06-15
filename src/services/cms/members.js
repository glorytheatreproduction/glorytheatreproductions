import { getSupabase, supabaseIsConfigured, supabaseUrl } from '../../lib/supabaseClient'
import { roleUsesUsername } from '../../lib/staffAuth'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

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

async function inviteViaEdgeFunction(payload) {
  const supabase = getSupabase()
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) {
    throw new Error('Your session expired. Sign in again and retry.')
  }

  const accessToken = refreshData.session?.access_token
  if (!accessToken) {
    throw new Error('You must be signed in as an admin')
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured')
  }

  let res
  try {
    res = await fetch(`${supabaseUrl}/functions/v1/invite-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (networkError) {
    throw new Error(networkError?.message || 'Could not reach invite service')
  }

  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(
      res.ok
        ? 'Invite failed: invalid response from server'
        : `Invite failed (${res.status}): ${text.slice(0, 160) || 'unknown error'}`
    )
  }

  if (!res.ok) {
    throw new Error(data.error || `Invite failed (${res.status})`)
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data
}

export async function inviteMember({ email, username, password, fullName, role = 'blog_writer' }) {
  if (!supabaseIsConfigured) {
    throw new Error('Supabase is not configured')
  }

  const payload = { password, fullName, role }
  if (roleUsesUsername(role)) {
    payload.username = username
  } else {
    payload.email = email
  }

  return inviteViaEdgeFunction(payload)
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
