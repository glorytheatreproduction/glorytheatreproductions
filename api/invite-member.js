import { createNodeClient } from '../../shared/lib/supabaseNode.js'
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

async function findUserByEmail(adminClient, targetEmail) {
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

async function upsertMemberProfile(adminClient, profile) {
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
    .eq('user_id', profile.user_id)
    .select('user_id')

  if (updateError) return { error: updateError }

  if (updated?.length) return { error: null }

  const { error: insertError } = await adminClient.from('profiles').insert(profile)
  return { error: insertError }
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

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json(res, 500, {
        headers,
        data: {
          error: 'Server not configured for invites. Add SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables.',
        },
      })
    }

    const authHeader = req.headers.authorization || req.headers.Authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return json(res, 401, { headers, data: { error: 'Unauthorized' } })
    }

    const token = authHeader.slice(7)
    const userClient = createNodeClient(supabaseUrl, anonKey)
    const adminClient = createNodeClient(supabaseUrl, serviceKey)

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

    if (!password || password.length < 6) {
      return json(res, 400, { headers, data: { error: 'Password must be at least 6 characters' } })
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

      const existing = await findUserByEmail(adminClient, email)
      if (!existing) {
        return json(res, 400, { headers, data: { error: 'User exists but could not be found' } })
      }

      userId = existing.id
      const { error: updateUserError } = await adminClient.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      })
      if (updateUserError) {
        return json(res, 400, { headers, data: { error: updateUserError.message } })
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
  } catch (err) {
    console.error('[invite-member]', err)
    return json(res, 500, {
      headers,
      data: { error: err.message || 'Invite failed unexpectedly' },
    })
  }
}
