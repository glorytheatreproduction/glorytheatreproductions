const DEFAULT_SCANNER_ROLES = new Set(['check_in', 'editor', 'admin', 'super_admin'])

let createNodeClient

async function loadNodeClient() {
  if (!createNodeClient) {
    ({ createNodeClient } = await import('../../shared/lib/supabaseNode.js'))
  }
  return createNodeClient
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return { url, anonKey, serviceKey }
}

async function verifyBearerAuth(event, allowedRoles = DEFAULT_SCANNER_ROLES) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, reason: 'missing_token' }
  }

  const { url, anonKey, serviceKey } = getSupabaseConfig()
  if (!url || !anonKey || !serviceKey) {
    return { ok: false, reason: 'server_config' }
  }

  const token = authHeader.slice(7)
  const createClient = await loadNodeClient()
  const userClient = createClient(url, anonKey)
  const adminClient = createClient(url, serviceKey)

  const { data: authData, error: authError } = await userClient.auth.getUser(token)
  if (authError || !authData.user) {
    return { ok: false, reason: 'invalid_token' }
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, status, full_name, email')
    .eq('user_id', authData.user.id)
    .maybeSingle()

  if (!profile || profile.status !== 'active' || !allowedRoles.has(profile.role)) {
    return { ok: false, reason: 'forbidden' }
  }

  return { ok: true, user: authData.user, profile }
}

module.exports = {
  verifyBearerAuth,
  DEFAULT_SCANNER_ROLES,
}
