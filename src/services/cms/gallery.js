import { mapAlbumRow, mapAlbumToRow } from '../../lib/mapDbRows'
import { getSupabase, supabaseIsConfigured } from '../../lib/supabaseClient'

export async function fetchPublishedAlbums() {
  if (!supabaseIsConfigured) return null
  const { data, error } = await getSupabase()
    .from('gallery_albums')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []).map(mapAlbumRow)
}

export async function fetchAllAlbums() {
  const { data, error } = await getSupabase()
    .from('gallery_albums')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []).map(mapAlbumRow)
}

export async function upsertAlbum(album) {
  const { data: { user } } = await getSupabase().auth.getUser()
  const row = { ...mapAlbumToRow(album), updated_at: new Date().toISOString(), updated_by: user?.id ?? null }
  const { error } = await getSupabase().from('gallery_albums').upsert(row)
  if (error) throw error
}

export async function deleteAlbum(id) {
  const { error } = await getSupabase().from('gallery_albums').delete().eq('id', id)
  if (error) throw error
}

export function getAlbumById(albums, id) {
  return albums.find((a) => a.id === id) ?? null
}

export function filterAlbums(albums, category = 'all') {
  if (category === 'all') return albums
  return albums.filter((album) => album.category === category)
}
