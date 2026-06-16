-- Track actual seats admitted at check-in (may differ from RSVP seat count)

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS checked_in_seats int
  CHECK (checked_in_seats IS NULL OR checked_in_seats > 0);

COMMENT ON COLUMN public.registrations.checked_in_seats IS
  'Seats actually admitted at the door. NULL until checked in; may differ from seats reserved.';
