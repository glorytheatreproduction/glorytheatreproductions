-- Sanitize and validate public RSVP input server-side.
-- Mirrors src/lib/rsvpValidation.js — keep the two in sync.
--
-- Also removes the direct anon INSERT policy on registrations so the validated
-- RPC below is the only public write path (it is SECURITY DEFINER, so it is unaffected).

DROP POLICY IF EXISTS registrations_public_insert ON public.registrations;

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
  -- Control, zero-width and bidi-override characters, plus the BOM.
  c_invisible constant text := '[\x01-\x1F\x7F-\x9F​-‏‪-‮⁠-⁤﻿]';
  -- A "letter": anything except ASCII digits/punctuation/space/controls, Latin-1 symbols,
  -- and the Unicode punctuation, symbol and emoji blocks. Locale-independent, unlike [[:alpha:]].
  c_letter constant text :=
    '[^\x01-\x40\x5B-\x60\x7B-\x9F -¿×÷ -⯿　-〿︀-️\U0001F000-\U0001FAFF]';
  c_email_pattern constant text :=
    '^[a-z0-9!#$%&''*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&''*+/=?^_`{|}~-]+)*@([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$';

  new_row public.registrations%ROWTYPE;
  v_name text;
  v_email text;
  v_phone text;
  v_digits text;
  v_seats int;
  v_max_seats int;
BEGIN
  IF length(coalesce(p_full_name, '')) > 500
    OR length(coalesce(p_email, '')) > 500
    OR length(coalesce(p_phone, '')) > 100 THEN
    RAISE EXCEPTION 'Input is too long';
  END IF;

  -- ── Name ────────────────────────────────────────────────────────────────
  v_name := normalize(coalesce(p_full_name, ''), NFC);
  v_name := regexp_replace(v_name, c_invisible, '', 'g');
  v_name := regexp_replace(v_name, '[‘’ʼ`´]', '''', 'g');
  v_name := regexp_replace(v_name, '[‐‑‒–—]', '-', 'g');
  v_name := btrim(regexp_replace(v_name, '\s+', ' ', 'g'));

  IF v_name = '' THEN
    RAISE EXCEPTION 'Please enter your full name.';
  END IF;
  IF length(v_name) < 2 THEN
    RAISE EXCEPTION 'Name is too short.';
  END IF;
  IF length(v_name) > 80 THEN
    RAISE EXCEPTION 'Name must be 80 characters or fewer.';
  END IF;
  IF v_name ~ '[0-9]' THEN
    RAISE EXCEPTION 'Name should not contain numbers.';
  END IF;
  IF v_name !~ ('^' || c_letter || '+([ ''.-]+' || c_letter || '+)*\.?$') THEN
    RAISE EXCEPTION 'Name can only contain letters, spaces, hyphens, apostrophes and periods.';
  END IF;
  IF lower(v_name) ~ '(.)\1\1' THEN
    RAISE EXCEPTION 'Please enter your real name.';
  END IF;

  -- ── Email (optional) ────────────────────────────────────────────────────
  v_email := normalize(coalesce(p_email, ''), NFC);
  v_email := regexp_replace(v_email, c_invisible, '', 'g');
  v_email := nullif(lower(regexp_replace(v_email, '\s+', '', 'g')), '');

  IF v_email IS NOT NULL THEN
    IF length(v_email) > 254
      OR length(split_part(v_email, '@', 1)) > 64
      OR v_email !~ c_email_pattern THEN
      RAISE EXCEPTION 'Enter a valid email address, like name@example.com.';
    END IF;
  END IF;

  -- ── Phone (required when there is no email) ─────────────────────────────
  v_phone := regexp_replace(coalesce(p_phone, ''), c_invisible, '', 'g');
  v_phone := regexp_replace(v_phone, '[\s().-]', '', 'g');
  IF v_phone LIKE '00%' THEN
    v_phone := '+' || substr(v_phone, 3);
  END IF;

  IF v_phone <> '' THEN
    IF v_phone !~ '^\+?[0-9]+$' THEN
      RAISE EXCEPTION 'Phone number can only contain digits, spaces, dashes and a leading +.';
    END IF;

    -- Local Ghanaian numbers → +233
    IF v_phone ~ '^0[0-9]{9}$' THEN
      v_phone := '+233' || substr(v_phone, 2);
    ELSIF v_phone ~ '^233[0-9]{9}$' THEN
      v_phone := '+' || v_phone;
    END IF;

    v_digits := regexp_replace(v_phone, '[^0-9]', '', 'g');
    IF length(v_digits) < 7 OR length(v_digits) > 15 THEN
      RAISE EXCEPTION 'Enter a valid phone number, like 024 123 4567 or +233 24 123 4567.';
    END IF;
    IF v_phone LIKE '+233%' AND length(v_digits) <> 12 THEN
      RAISE EXCEPTION 'Ghana numbers have 10 digits, like 024 123 4567.';
    END IF;
    IF right(v_digits, 9) ~ '^([0-9])\1+$' THEN
      RAISE EXCEPTION 'Please enter a real phone number.';
    END IF;
  END IF;

  IF v_email IS NULL AND v_phone = '' THEN
    RAISE EXCEPTION 'Please provide an email or phone number';
  END IF;

  -- ── Event + seats ───────────────────────────────────────────────────────
  SELECT coalesce(e.max_seats_per_rsvp, 4) INTO v_max_seats
  FROM public.events e
  WHERE e.id = btrim(coalesce(p_event_id, '')) AND e.published = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This event is not open for registration';
  END IF;

  v_seats := coalesce(p_seats, 1);
  IF v_seats < 1 THEN
    RAISE EXCEPTION 'Choose at least 1 seat.';
  END IF;
  IF v_seats > greatest(v_max_seats, 1) THEN
    RAISE EXCEPTION 'You can reserve up to % seats per RSVP.', greatest(v_max_seats, 1);
  END IF;

  INSERT INTO public.registrations (event_id, full_name, email, phone, seats)
  VALUES (btrim(p_event_id), v_name, v_email, v_phone, v_seats)
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
