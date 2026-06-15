import { getSupabase, supabaseUrl } from './supabaseClient'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/**
 * Call a Supabase Edge Function and surface `{ error }` from the response body.
 * Avoids supabase.functions.invoke(), which hides API errors behind a generic message.
 */
export async function invokeEdgeFunction(functionName, body, { requireAuth = true } = {}) {
  let accessToken

  if (requireAuth) {
    const supabase = getSupabase()
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) {
      throw new Error('Your session expired. Sign in again and retry.')
    }

    accessToken = refreshData.session?.access_token
    if (!accessToken) {
      throw new Error('You must be signed in')
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured')
  }

  const headers = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  let res
  try {
    res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  } catch (networkError) {
    throw new Error(networkError?.message || `Could not reach ${functionName}`)
  }

  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(
      res.ok
        ? 'Invalid response from server'
        : `${functionName} failed (${res.status}): ${text.slice(0, 160) || 'unknown error'}`
    )
  }

  if (!res.ok) {
    throw new Error(data.error || `${functionName} failed (${res.status})`)
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data
}
