import { getSupabase, supabaseIsConfigured } from '../../lib/supabaseClient'
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction'
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
  if (!supabaseIsConfigured) {
    throw new Error('Supabase is not configured')
  }

  const payload = { password, fullName, role }
  if (roleUsesUsername(role)) {
    payload.username = username
  } else {
    payload.email = email
  }

  return invokeEdgeFunction('invite-member', payload)
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
