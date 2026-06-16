-- Public RSVP insert (anon cannot SELECT after INSERT due to RLS on RETURNING)

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
BEGIN
  IF trim(coalesce(p_full_name, '')) = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  IF trim(coalesce(p_email, '')) = '' THEN
    RAISE EXCEPTION 'Email is required';
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
    lower(trim(p_email)),
    coalesce(trim(p_phone), ''),
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

REVOKE ALL ON FUNCTION public.create_public_registration(text, text, text, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_registration(text, text, text, text, int) TO anon, authenticated;

-- Staff dashboard: registration counts per event
CREATE OR REPLACE FUNCTION public.registration_counts_by_event()
RETURNS TABLE (event_id text, registration_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT r.event_id, count(*)::bigint
  FROM public.registrations r
  GROUP BY r.event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registration_counts_by_event() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registration_counts_by_event() TO authenticated;
