import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

const SITE_CONTACT_EMAIL = 'glorytheatreproduction@gmail.com'
const SITE_FROM_EMAIL = `Glory Theatre <${SITE_CONTACT_EMAIL}>`

function resolveFromEmail(envValue: string) {
  const trimmed = envValue.trim()
  return trimmed || SITE_FROM_EMAIL
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getEnv(name) {
  return Deno.env.get(name) || ''
}

async function fetchQrBytes(payload) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&data=${encodeURIComponent(payload)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('QR generation failed')
  return new Uint8Array(await res.arrayBuffer())
}

function pngToBase64(pngBytes) {
  return btoa(String.fromCharCode(...new Uint8Array(pngBytes)))
}

function parseResendError(text) {
  try {
    const parsed = JSON.parse(text)
    return parsed.message || text
  } catch {
    return text || 'Resend email failed'
  }
}

async function sendTicketEmail({
  apiKey,
  fromEmail,
  to,
  name,
  eventName,
  ticketId,
  pngBytes,
}) {
  const pngBase64 = pngToBase64(pngBytes)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      reply_to: SITE_CONTACT_EMAIL,
      to: [to],
      subject: `Your Ticket: ${eventName}`,
      html: `
        <p>Hi ${name},</p>
        <p>Thank you for registering for <strong>${eventName}</strong>.</p>
        <p>Your ticket ID is <strong>#${ticketId}</strong>. Your QR code ticket is attached — present it at the venue for entry.</p>
        <p>Questions? Email <a href="mailto:${SITE_CONTACT_EMAIL}">${SITE_CONTACT_EMAIL}</a>.</p>
      `,
      attachments: [
        {
          filename: 'ticket.png',
          content: pngBase64,
          type: 'image/png',
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(parseResendError(err))
  }
}

async function callerIsStaff(supabase, authHeader) {
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return false

  const anonKey = getEnv('SUPABASE_ANON_KEY')
  if (!anonKey) return false

  const userClient = createClient(getEnv('SUPABASE_URL'), anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('user_id', user.id)
    .maybeSingle()

  return Boolean(
    profile?.status === 'active'
    && ['editor', 'admin', 'super_admin'].includes(profile.role),
  )
}

async function processRegistration(supabase, registrationId) {
  const resendKey = getEnv('RESEND_API_KEY')
  const fromEmail = resolveFromEmail(getEnv('FROM_EMAIL'))

  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', registrationId)
    .single()

  if (regError || !registration) throw new Error(regError?.message || 'Registration not found')

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', registration.event_id)
    .single()

  if (eventError || !event) throw new Error(eventError?.message || 'Event not found')

  let ticketFailed = false
  let pngUrl = registration.png_url
  let ticketId = registration.ticket_id
  let qrPayload = registration.qr_payload
  let pngBytes = null

  try {
    if (!ticketId) {
      const { data: nextId, error: idError } = await supabase.rpc('next_ticket_id', {
        p_event_id: registration.event_id,
      })
      if (idError) throw idError
      ticketId = nextId
    }

    qrPayload = JSON.stringify({
      event_id: registration.event_id,
      registration_id: registration.id,
      ticket_id: ticketId,
    })

    pngBytes = await fetchQrBytes(qrPayload)
    const pngPath = `${registration.event_id}/${registration.id}.png`

    const pngUpload = await supabase.storage.from('tickets').upload(pngPath, pngBytes, {
      contentType: 'image/png',
      upsert: true,
    })
    if (pngUpload.error) throw pngUpload.error

    const { data: pngPublic } = supabase.storage.from('tickets').getPublicUrl(pngPath)
    pngUrl = pngPublic.publicUrl

    await supabase
      .from('registrations')
      .update({
        ticket_id: ticketId,
        qr_payload: qrPayload,
        png_url: pngUrl,
        pdf_url: null,
        ticket_status: 'generated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', registration.id)
  } catch (err) {
    ticketFailed = true
    await supabase.from('ticket_generation_errors').insert({
      registration_id: registration.id,
      error_message: err.message || 'Ticket generation failed',
    })
    await supabase
      .from('registrations')
      .update({
        ticket_id: ticketId || registration.ticket_id,
        qr_payload: qrPayload || registration.qr_payload,
        ticket_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', registration.id)
  }

  if (!ticketFailed && pngBytes && resendKey && fromEmail) {
    try {
      await sendTicketEmail({
        apiKey: resendKey,
        fromEmail,
        to: registration.email,
        name: registration.full_name,
        eventName: event.title,
        ticketId,
        pngBytes,
      })
    } catch (err) {
      await supabase.from('ticket_generation_errors').insert({
        registration_id: registration.id,
        error_message: `Email failed: ${err.message}`,
      })
    }
  }

  return { registration_id: registration.id, ticket_status: ticketFailed ? 'failed' : 'generated' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = getEnv('SUPABASE_URL')
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    const webhookSecret = getEnv('DATABASE_WEBHOOK_SECRET')

    if (!supabaseUrl || !serviceKey) {
      return json({ error: 'Supabase service env not configured' }, 500)
    }

    const incomingSecret = req.headers.get('x-webhook-secret') || ''
    const authHeader = req.headers.get('authorization') || ''
    const isService = serviceKey && authHeader.includes(serviceKey)
    const isWebhook = webhookSecret
      ? incomingSecret === webhookSecret
      : incomingSecret.length > 0

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const isStaff = !isService && !isWebhook ? await callerIsStaff(supabase, authHeader) : false

    if (!isService && !isWebhook && !isStaff) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const body = await req.json()
    const registrationId = body.registration_id || body.record?.id
    if (!registrationId) return json({ error: 'registration_id required' }, 400)

    const result = await processRegistration(supabase, registrationId)
    return json({ success: true, ...result })
  } catch (err) {
    return json({ error: err.message || 'Unexpected error' }, 500)
  }
})
