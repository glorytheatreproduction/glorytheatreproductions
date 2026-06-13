import { mapMediaRow } from '../../lib/mapDbRows'
import { getPublicStorageUrl, getSupabase, STORAGE_BUCKET } from '../../lib/supabaseClient'

export async function listMediaAssets(folder = '') {
  let query = getSupabase().from('media_assets').select('*').order('created_at', { ascending: false })
  if (folder) query = query.eq('folder', folder)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapMediaRow)
}

export async function uploadMediaAsset(file, { folder = 'general', alt = '', title = '' } = {}) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error: uploadError } = await getSupabase().storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const publicUrl = getPublicStorageUrl(path)
  const { data: { user } } = await getSupabase().auth.getUser()
  const { data, error } = await getSupabase()
    .from('media_assets')
    .insert({
      folder,
      bucket: STORAGE_BUCKET,
      path,
      public_url: publicUrl,
      mime_type: file.type,
      size_bytes: file.size,
      alt,
      title: title || file.name,
      created_by: user?.id ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapMediaRow(data)
}

export async function deleteMediaAsset(id) {
  const { data, error: fetchError } = await getSupabase().from('media_assets').select('bucket, path').eq('id', id).single()
  if (fetchError) throw fetchError
  if (data?.path) {
    await getSupabase().storage.from(data.bucket || STORAGE_BUCKET).remove([data.path])
  }
  const { error } = await getSupabase().from('media_assets').delete().eq('id', id)
  if (error) throw error
}
