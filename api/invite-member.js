import { createClient } from '@supabase/supabase-js'
import {
  isValidUsername,
  normalizeUsername,
  roleUsesUsername,
  usernameToAuthEmail,
} from './lib/staff-auth.cjs'

const ALLOWED_ROLES = new Set(['blog_writer', 'blog_admin', 'check_in', 'editor', 'viewer'])

function json(res, statusCode, body) {
  for (const [key, value] of Object.entries(body.headers || {})) {
    res.setHeader(key, value)
  }
  res.status(statusCode).end(JSON.stringify(body.data ?? body))
}

export default async function handler(req, res) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') {
    return json(res, 200, { headers, data: '' })
  }

  if (req.method !== 'POST') {
    return json(res, 405, { headers, data: { error: 'Method not allowed' } })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(res, 500, { headers, data: { error: 'Server not configured for invites' } })
  }

  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return json(res, 401, { headers, data: { error: 'Unauthorized' } })
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
    return json(res, 401, { headers, data: { error: 'Unauthorized' } })
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
    return json(res, 403, { headers, data: { error: 'Only admins can invite members' } })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return json(res, 400, { headers, data: { error: 'Invalid JSON body' } })
    }
  }

  const password = body.password
  const fullName = body.fullName?.trim() || ''
  const role = body.role || 'blog_writer'

  if (!password) {
    return json(res, 400, { headers, data: { error: 'Password is required' } })
  }

  if (!ALLOWED_ROLES.has(role)) {
    return json(res, 400, { headers, data: { error: 'Invalid role for invite' } })
  }

  let email
  let username = null

  if (roleUsesUsername(role)) {
    username = normalizeUsername(body.username)
    if (!isValidUsername(username)) {
      return json(res, 400, {
        headers,
        data: {
          error: 'Username must be 3–32 characters and use only letters, numbers, dots, underscores, or hyphens',
        },
      })
    }

    const { data: existingUsername } = await adminClient
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .maybeSingle()

    if (existingUsername) {
      return json(res, 400, { headers, data: { error: 'Username is already taken' } })
    }

    email = usernameToAuthEmail(username)
  } else {
    email = body.email?.trim().toLowerCase()
    if (!email) {
      return json(res, 400, { headers, data: { error: 'Email is required for this role' } })
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
      return json(res, 400, { headers, data: { error: createError.message } })
    }

    const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (listError) {
      return json(res, 400, { headers, data: { error: listError.message } })
    }

    userId = listData.users.find((user) => user.email?.toLowerCase() === email)?.id
    if (!userId) {
      return json(res, 400, { headers, data: { error: 'User exists but could not be found' } })
    }

    await adminClient.auth.admin.updateUserById(userId, { password, email_confirm: true })
  }

  const { error: profileError } = await adminClient.from('profiles').upsert({
    user_id: userId,
    email,
    username,
    full_name: fullName,
    role,
    status: 'active',
    updated_at: new Date().toISOString(),
  })

  if (profileError) {
    return json(res, 400, { headers, data: { error: profileError.message } })
  }

  return json(res, 200, {
    headers,
    data: {
      success: true,
      email: username ? null : email,
      username,
      role,
      message: role === 'blog_writer'
        ? 'Blog writer account ready'
        : role === 'blog_admin'
          ? 'Blog admin account ready'
          : role === 'check_in'
            ? 'Ticket scanner account ready'
            : 'Member account ready',
    },
  })
}
