import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  isValidUsername,
  normalizeUsername,
  roleUsesUsername,
  usernameToAuthEmail,
} from '../../../shared/lib/staffAuth.js'

const ALL_ROLES = new Set([
  'super_admin',
  'admin',
  'editor',
  'blog_admin',
  'blog_writer',
  'check_in',
  'viewer',
])

const ELEVATED_ROLES = new Set(['admin', 'super_admin'])

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getEnv(name: string) {
  return Deno.env.get(name) || ''
}

async function getCaller(adminClient: ReturnType<typeof createClient>, token: string) {
  const supabaseUrl = getEnv('SUPABASE_URL')
  const anonKey = getEnv('SUPABASE_ANON_KEY')
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: authData, error: authError } = await userClient.auth.getUser(token)
  if (authError || !authData.user) {
    return { error: json({ error: 'Unauthorized' }, 401) }
  }

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role, status')
    .eq('user_id', authData.user.id)
    .maybeSingle()

  if (
    !callerProfile ||
    callerProfile.status !== 'active' ||
    !['admin', 'super_admin'].includes(callerProfile.role)
  ) {
    return { error: json({ error: 'Only admins can manage members' }, 403) }
  }

  return { user: authData.user, callerProfile }
}

function assertCanTouchTarget(
  callerProfile: { role: string },
  targetProfile: { role: string },
  callerId: string,
  targetId: string,
  action: 'update' | 'delete',
) {
  if (action === 'delete' && callerId === targetId) {
    return 'You cannot delete your own account'
  }

  if (ELEVATED_ROLES.has(targetProfile.role) && callerProfile.role !== 'super_admin') {
    return 'Only a super admin can modify admin accounts'
  }

  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabaseUrl = getEnv('SUPABASE_URL')
    const anonKey = getEnv('SUPABASE_ANON_KEY')
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: 'Member management is not configured on Supabase' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const token = authHeader.slice(7)
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const caller = await getCaller(adminClient, token)
    if (caller.error) return caller.error

    const body = await req.json()
    const action = body.action
    const userId = body.userId

    if (!userId || !['update', 'delete'].includes(action)) {
      return json({ error: 'userId and action (update|delete) are required' }, 400)
    }

    const { data: targetProfile, error: targetError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (targetError || !targetProfile) {
      return json({ error: 'Member not found' }, 404)
    }

    const guardError = assertCanTouchTarget(
      caller.callerProfile!,
      targetProfile,
      caller.user!.id,
      userId,
      action,
    )
    if (guardError) {
      return json({ error: guardError }, 403)
    }

    if (action === 'delete') {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
      if (deleteError) {
        return json({ error: deleteError.message }, 400)
      }
      return json({ success: true, message: 'Member deleted' })
    }

    const nextRole = body.role || targetProfile.role
    if (!ALL_ROLES.has(nextRole)) {
      return json({ error: 'Invalid role' }, 400)
    }

    if (ELEVATED_ROLES.has(nextRole) && caller.callerProfile!.role !== 'super_admin') {
      return json({ error: 'Only a super admin can assign admin roles' }, 403)
    }

    if (body.status && !['active', 'suspended'].includes(body.status)) {
      return json({ error: 'Invalid status' }, 400)
    }

    if (body.password != null && String(body.password).length > 0 && String(body.password).length < 6) {
      return json({ error: 'Password must be at least 6 characters' }, 400)
    }

    let email = targetProfile.email as string | null
    let username = targetProfile.username as string | null

    if (roleUsesUsername(nextRole)) {
      if (body.username != null) {
        username = normalizeUsername(body.username)
        if (!isValidUsername(username)) {
          return json({
            error: 'Username must be 3–32 characters and use only letters, numbers, dots, underscores, or hyphens',
          }, 400)
        }

        const { data: existingUsername } = await adminClient
          .from('profiles')
          .select('user_id')
          .eq('username', username)
          .neq('user_id', userId)
          .maybeSingle()

        if (existingUsername) {
          return json({ error: 'Username is already taken' }, 400)
        }

        email = usernameToAuthEmail(username)
      } else if (!username) {
        return json({ error: 'Username is required for this role' }, 400)
      } else {
        email = usernameToAuthEmail(username)
      }
    } else {
      if (body.email != null) {
        email = String(body.email).trim().toLowerCase()
        if (!email) {
          return json({ error: 'Email is required for this role' }, 400)
        }
      }
      username = null
    }

    const authUpdates: Record<string, unknown> = { email_confirm: true }
    if (email && email !== targetProfile.email) {
      authUpdates.email = email
    }
    if (body.password) {
      authUpdates.password = String(body.password)
    }

    if (authUpdates.email || authUpdates.password) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, authUpdates)
      if (authUpdateError) {
        return json({ error: authUpdateError.message }, 400)
      }
    }

    const profileUpdates: Record<string, unknown> = {
      email,
      username,
      role: nextRole,
      updated_at: new Date().toISOString(),
    }

    if (body.fullName != null) {
      profileUpdates.full_name = String(body.fullName).trim()
    }
    if (body.status) {
      profileUpdates.status = body.status
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .update(profileUpdates)
      .eq('user_id', userId)

    if (profileError) {
      return json({ error: profileError.message }, 400)
    }

    return json({
      success: true,
      message: 'Member updated',
      userId,
      role: nextRole,
      status: body.status || targetProfile.status,
    })
  } catch (err) {
    console.error('[manage-member]', err)
    return json({ error: err instanceof Error ? err.message : 'Member update failed unexpectedly' }, 500)
  }
})
