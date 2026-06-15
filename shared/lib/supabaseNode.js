import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

/** Supabase client for Node.js runtimes (Vercel API, CLI scripts). */
export function createNodeClient(url, key, options = {}) {
  const { auth, realtime, ...rest } = options

  return createClient(url, key, {
    ...rest,
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      ...auth,
    },
    realtime: {
      transport: ws,
      ...realtime,
    },
  })
}
