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

export async function updateMember(userId, { role, status, fullName, email, username, password }) {
  if (!supabaseIsConfigured) {
    throw new Error('Supabase is not configured')
  }

  const payload = { action: 'update', userId }
  if (role) payload.role = role
  if (status) payload.status = status
  if (fullName != null) payload.fullName = fullName
  if (email != null) payload.email = email
  if (username != null) payload.username = username
  if (password) payload.password = password

  return invokeEdgeFunction('manage-member', payload)
}

export async function deleteMember(userId) {
  if (!supabaseIsConfigured) {
    throw new Error('Supabase is not configured')
  }

  return invokeEdgeFunction('manage-member', { action: 'delete', userId })
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
