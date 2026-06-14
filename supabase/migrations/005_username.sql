-- Username login for blog writers and ticket scanners

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username citext;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx
  ON public.profiles (username)
  WHERE username IS NOT NULL;
