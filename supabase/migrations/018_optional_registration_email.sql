-- Allow registrations without email (ticket delivered on-screen / via phone contact)

ALTER TABLE public.registrations
  ALTER COLUMN email DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.create_public_registration(
  p_event_id text,
  p_full_name text,
  p_email text,
  p_phone text DEFAULT '',
  p_seats int DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  event_id text,
  full_name text,
  email citext,
  phone text,
  seats int,
  ticket_id text,
  ticket_status text,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_row public.registrations%ROWTYPE;
  v_email text;
  v_phone text;
BEGIN
  IF trim(coalesce(p_full_name, '')) = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  v_email := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_phone := coalesce(trim(p_phone), '');

  IF v_email IS NULL AND v_phone = '' THEN
    RAISE EXCEPTION 'Please provide an email or phone number';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id AND e.published = true
  ) THEN
    RAISE EXCEPTION 'This event is not open for registration';
  END IF;

  INSERT INTO public.registrations (event_id, full_name, email, phone, seats)
  VALUES (
    p_event_id,
    trim(p_full_name),
    v_email,
    v_phone,
    greatest(coalesce(p_seats, 1), 1)
  )
  RETURNING * INTO new_row;

  RETURN QUERY
  SELECT
    new_row.id,
    new_row.event_id,
    new_row.full_name,
    new_row.email,
    new_row.phone,
    new_row.seats,
    new_row.ticket_id,
    new_row.ticket_status,
    new_row.created_at;
END;
$$;
