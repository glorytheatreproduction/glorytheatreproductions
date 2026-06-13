import { getSupabase, supabaseIsConfigured } from '../../lib/supabaseClient'

export async function fetchSiteContent(key) {
  if (!supabaseIsConfigured) return null
  const { data, error } = await getSupabase().from('site_content').select('value').eq('key', key).maybeSingle()
  if (error) throw error
  return data?.value ?? null
}

export async function upsertSiteContent(key, value) {
  const { data: { user } } = await getSupabase().auth.getUser()
  const { error } = await getSupabase().from('site_content').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
    updated_by: user?.id ?? null,
  })
  if (error) throw error
}

export async function fetchAllSiteContent() {
  if (!supabaseIsConfigured) return {}
  const { data, error } = await getSupabase().from('site_content').select('key, value')
  if (error) throw error
  return Object.fromEntries((data || []).map((row) => [row.key, row.value]))
}
