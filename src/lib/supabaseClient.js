import { createClient } from '@supabase/supabase-js'

function envOrUndefined(value) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

const supabaseUrl = envOrUndefined(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = envOrUndefined(import.meta.env.VITE_SUPABASE_ANON_KEY)

export { supabaseUrl }

export const supabaseIsConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = supabaseIsConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function getSupabase() {
  if (!supabase) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
  }
  return supabase
}

export const STORAGE_BUCKET = 'public'

export function getPublicStorageUrl(path) {
  if (!supabaseUrl || !path) return path || ''
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path.replace(/^\//, '')}`
}
