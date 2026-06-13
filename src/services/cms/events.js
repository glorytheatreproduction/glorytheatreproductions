import { mapEventRow, mapEventToRow } from '../../lib/mapDbRows'
import { getSupabase, supabaseIsConfigured } from '../../lib/supabaseClient'

export async function fetchPublishedEvents() {
  if (!supabaseIsConfigured) return null
  const { data, error } = await getSupabase()
    .from('events')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []).map(mapEventRow)
}

export async function fetchAllEvents() {
  const { data, error } = await getSupabase()
    .from('events')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []).map(mapEventRow)
}

export async function upsertEvent(event) {
  const { data: { user } } = await getSupabase().auth.getUser()
  const row = { ...mapEventToRow(event), updated_at: new Date().toISOString(), updated_by: user?.id ?? null }
  const { error } = await getSupabase().from('events').upsert(row)
  if (error) throw error
}

export async function deleteEvent(id) {
  const { error } = await getSupabase().from('events').delete().eq('id', id)
  if (error) throw error
}

export function isEventBookable(event) {
  return event && event.availability !== 'Sold Out'
}

export function getEventById(events, id) {
  return events.find((e) => e.id === id) ?? null
}
