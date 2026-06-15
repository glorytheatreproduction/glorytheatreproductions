import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  isValidUsername,
  normalizeUsername,
  roleUsesUsername,
  usernameToAuthEmail,
} from '../../../shared/lib/staffAuth.js'

const ALLOWED_ROLES = new Set(['blog_writer', 'blog_admin', 'check_in', 'editor', 'viewer'])

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

async function findUserByEmail(adminClient: ReturnType<typeof createClient>, targetEmail: string) {
  let page = 1
  const perPage = 200

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const match = data.users.find((user) => user.email?.toLowerCase() === targetEmail)
    if (match) return match
    if (data.users.length < perPage) break
    page += 1
  }

  return null
}

async function upsertMemberProfile(
  adminClient: ReturnType<typeof createClient>,
  profile: Record<string, unknown>,
) {
  const userId = profile.user_id as string
  const { data: updated, error: updateError } = await adminClient
    .from('profiles')
    .update({
      email: profile.email,
      username: profile.username,
      full_name: profile.full_name,
      role: profile.role,
      status: profile.status,
      updated_at: profile.updated_at,
    })
    .eq('user_id', userId)
    .select('user_id')

  if (updateError) return { error: updateError }

  if (updated?.length) return { error: null }

  const { error: insertError } = await adminClient.from('profiles').insert(profile)
  return { error: insertError }
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
      return json({ error: 'Invite service is not configured on Supabase' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const token = authHeader.slice(7)
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: authData, error: authError } = await userClient.auth.getUser(token)
    if (authError || !authData.user) {
      return json({ error: 'Unauthorized' }, 401)
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
      return json({ error: 'Only admins can invite members' }, 403)
    }

    const body = await req.json()
    const password = body.password
    const fullName = body.fullName?.trim() || ''
    const role = body.role || 'blog_writer'

    if (!password || String(password).length < 6) {
      return json({ error: 'Password must be at least 6 characters' }, 400)
    }

    if (!ALLOWED_ROLES.has(role)) {
      return json({ error: 'Invalid role for invite' }, 400)
    }

    let email: string
    let username: string | null = null

    if (roleUsesUsername(role)) {
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
        .maybeSingle()

      if (existingUsername) {
        return json({ error: 'Username is already taken' }, 400)
      }

      email = usernameToAuthEmail(username)
    } else {
      email = body.email?.trim().toLowerCase()
      if (!email) {
        return json({ error: 'Email is required for this role' }, 400)
      }
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, username: username || undefined },
    })

    let userId = created?.user?.id

    if (createError) {
      if (!createError.message.includes('already been registered')) {
        return json({ error: createError.message }, 400)
      }

      const existing = await findUserByEmail(adminClient, email)
      if (!existing) {
        return json({ error: 'User exists but could not be found' }, 400)
      }

      userId = existing.id
      const { error: updateUserError } = await adminClient.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      })
      if (updateUserError) {
        return json({ error: updateUserError.message }, 400)
      }
    }

    const { error: profileError } = await upsertMemberProfile(adminClient, {
      user_id: userId,
      email,
      username,
      full_name: fullName,
      role,
      status: 'active',
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      return json({ error: profileError.message }, 400)
    }

    return json({
      success: true,
      email: username ? null : email,
      username,
      role,
      message: 'Member account ready',
    })
  } catch (err) {
    console.error('[invite-member]', err)
    return json({ error: err instanceof Error ? err.message : 'Invite failed unexpectedly' }, 500)
  }
})
