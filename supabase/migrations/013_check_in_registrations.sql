-- Allow ticket scanners to read and update registrations for check-in

DROP POLICY IF EXISTS registrations_check_in_select ON public.registrations;
CREATE POLICY registrations_check_in_select ON public.registrations
  FOR SELECT TO authenticated
  USING (public.is_check_in_staff());

DROP POLICY IF EXISTS registrations_check_in_update ON public.registrations;
CREATE POLICY registrations_check_in_update ON public.registrations
  FOR UPDATE TO authenticated
  USING (public.is_check_in_staff()) WITH CHECK (public.is_check_in_staff());
