-- Ticket templates, registrations, generation errors, storage, webhook trigger

-- ── Events: ticket design fields ────────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ticket_template text NOT NULL DEFAULT 'sacred_stage'
    CHECK (ticket_template IN ('classic', 'sacred_stage'));

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ticket_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ── Registrations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email citext NOT NULL,
  phone text NOT NULL DEFAULT '',
  seats int NOT NULL DEFAULT 1 CHECK (seats > 0),
  ticket_id text,
  qr_payload text,
  png_url text,
  pdf_url text,
  ticket_status text NOT NULL DEFAULT 'pending'
    CHECK (ticket_status IN ('pending', 'generated', 'failed')),
  checked_in boolean NOT NULL DEFAULT false,
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registrations_event_id_idx ON public.registrations (event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS registrations_ticket_status_idx ON public.registrations (ticket_status);
CREATE UNIQUE INDEX IF NOT EXISTS registrations_ticket_id_idx ON public.registrations (ticket_id)
  WHERE ticket_id IS NOT NULL;

-- Per-event sequential ticket numbers
CREATE TABLE IF NOT EXISTS public.event_ticket_counters (
  event_id text PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  last_number int NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.next_ticket_id(p_event_id text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n int;
BEGIN
  INSERT INTO public.event_ticket_counters (event_id, last_number)
  VALUES (p_event_id, 1)
  ON CONFLICT (event_id) DO UPDATE
    SET last_number = public.event_ticket_counters.last_number + 1
  RETURNING last_number INTO n;

  RETURN lpad(n::text, 6, '0');
END;
$$;

-- ── Ticket generation errors ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_generation_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  error_message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_generation_errors_registration_idx
  ON public.ticket_generation_errors (registration_id, created_at DESC);

-- ── Storage bucket: tickets (public read for email links) ───────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tickets',
  'tickets',
  true,
  10485760,
  ARRAY['image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_generation_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_ticket_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS registrations_public_insert ON public.registrations;
CREATE POLICY registrations_public_insert ON public.registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.published = true
    )
  );

DROP POLICY IF EXISTS registrations_staff_select ON public.registrations;
CREATE POLICY registrations_staff_select ON public.registrations
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS registrations_staff_update ON public.registrations;
CREATE POLICY registrations_staff_update ON public.registrations
  FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS ticket_errors_staff_select ON public.ticket_generation_errors;
CREATE POLICY ticket_errors_staff_select ON public.ticket_generation_errors
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS event_ticket_counters_service ON public.event_ticket_counters;
CREATE POLICY event_ticket_counters_service ON public.event_ticket_counters
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS storage_tickets_public_read ON storage.objects;
CREATE POLICY storage_tickets_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'tickets');

DROP POLICY IF EXISTS storage_tickets_service_write ON storage.objects;
CREATE POLICY storage_tickets_service_write ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'tickets') WITH CHECK (bucket_id = 'tickets');

-- ── Webhook trigger → Edge Function generate-ticket ─────────────────────────
-- Requires pg_net extension (enabled on Supabase hosted projects).
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_generate_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  fn_url text;
  webhook_secret text;
BEGIN
  fn_url := current_setting('app.settings.generate_ticket_url', true);
  webhook_secret := current_setting('app.settings.database_webhook_secret', true);

  IF fn_url IS NULL OR fn_url = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', coalesce(webhook_secret, '')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'record', jsonb_build_object(
        'id', NEW.id,
        'event_id', NEW.event_id,
        'full_name', NEW.full_name,
        'email', NEW.email,
        'phone', NEW.phone,
        'seats', NEW.seats
      )
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS registrations_generate_ticket ON public.registrations;
CREATE TRIGGER registrations_generate_ticket
  AFTER INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_ticket();

-- Configure after deploy (Supabase SQL editor or migration follow-up):
-- ALTER DATABASE postgres SET app.settings.generate_ticket_url =
--   'https://xjywhejhnplrdxyulnvk.supabase.co/functions/v1/generate-ticket';
-- ALTER DATABASE postgres SET app.settings.database_webhook_secret = 'your-secret';

COMMENT ON FUNCTION public.trigger_generate_ticket IS
  'Posts new registration rows to the generate-ticket Edge Function. Set app.settings.generate_ticket_url and app.settings.database_webhook_secret on the database.';
