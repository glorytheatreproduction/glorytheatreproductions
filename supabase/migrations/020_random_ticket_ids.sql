-- Random 6-digit ticket IDs.
--
-- next_ticket_id used to count up per event (000001, 000002, …), but registrations_ticket_id_idx
-- requires ticket IDs to be unique across ALL events, so the second event's first ticket could
-- never be saved. IDs are now random in 100000–999999, unique across all events, and not
-- guessable from one another. Existing tickets keep their numbers.
--
-- The signature is unchanged so the generate-ticket function keeps calling it the same way.
-- The function also handles the rare race where two tickets draw the same ID at once (the unique
-- index rejects one and it draws again).

CREATE OR REPLACE FUNCTION public.next_ticket_id(p_event_id text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_candidate text;
BEGIN
  FOR attempt IN 1..20 LOOP
    -- 28 random bits from gen_random_uuid() (strong randomness, built in), mapped onto 100000–999999.
    v_candidate := (
      100000 + ((('x' || lpad(substr(replace(gen_random_uuid()::text, '-', ''), 1, 7), 8, '0'))::bit(32)::int) % 900000)
    )::text;

    IF NOT EXISTS (SELECT 1 FROM public.registrations r WHERE r.ticket_id = v_candidate) THEN
      RETURN v_candidate;
    END IF;
  END LOOP;

  RAISE EXCEPTION 'Could not allocate a unique ticket ID';
END;
$$;

-- Only the generate-ticket function (service role) needs this; it was callable by anyone before.
REVOKE ALL ON FUNCTION public.next_ticket_id(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_ticket_id(text) TO service_role;
