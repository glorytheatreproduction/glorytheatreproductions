-- Persist ticket webhook config (trigger was silently skipping when DB settings were unset).

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.cms_internal_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE public.cms_internal_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.cms_internal_settings (key, value) VALUES
  ('generate_ticket_url', 'https://xjywhejhnplrdxyulnvk.supabase.co/functions/v1/generate-ticket')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.cms_internal_settings (key, value)
SELECT 'database_webhook_secret', encode(extensions.gen_random_bytes(32), 'hex')
WHERE NOT EXISTS (
  SELECT 1 FROM public.cms_internal_settings WHERE key = 'database_webhook_secret'
);

CREATE OR REPLACE FUNCTION public.trigger_generate_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  fn_url text;
  webhook_secret text;
BEGIN
  SELECT value INTO fn_url
  FROM public.cms_internal_settings
  WHERE key = 'generate_ticket_url';

  SELECT value INTO webhook_secret
  FROM public.cms_internal_settings
  WHERE key = 'database_webhook_secret';

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

COMMENT ON TABLE public.cms_internal_settings IS
  'Internal CMS config readable by SECURITY DEFINER triggers. generate_ticket_url + database_webhook_secret must match Edge Function DATABASE_WEBHOOK_SECRET.';
