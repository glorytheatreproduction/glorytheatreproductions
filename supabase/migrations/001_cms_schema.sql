-- Glory Theatre Productions CMS schema

CREATE EXTENSION IF NOT EXISTS citext;

-- Staff profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

-- Keyed JSON content (home hero, mission, page heroes, testimonials, season)
CREATE TABLE IF NOT EXISTS public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  long_description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  category_slug text NOT NULL DEFAULT '',
  day int,
  month text,
  year int,
  date_label text NOT NULL DEFAULT '',
  time text NOT NULL DEFAULT '',
  venue text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  availability text NOT NULL DEFAULT 'Seats Available',
  featured boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  capacity int NOT NULL DEFAULT 100,
  entry_type text NOT NULL DEFAULT 'free',
  max_seats_per_rsvp int NOT NULL DEFAULT 4,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS events_published_idx ON public.events (published, sort_order);

-- Gallery albums (images stored as JSON array)
CREATE TABLE IF NOT EXISTS public.gallery_albums (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'drama',
  date text NOT NULL DEFAULT '',
  cover text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS gallery_albums_published_idx ON public.gallery_albums (published, sort_order);

-- Blog posts (content blocks stored as JSON array)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id text PRIMARY KEY,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  category_slug text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  read_time text NOT NULL DEFAULT '5 min',
  image text NOT NULL DEFAULT '',
  author text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON public.blog_posts (published, sort_order);

-- Media library metadata
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder text NOT NULL DEFAULT 'general',
  bucket text NOT NULL DEFAULT 'public',
  path text NOT NULL,
  public_url text NOT NULL DEFAULT '',
  mime_type text,
  size_bytes bigint,
  alt text,
  title text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, path)
);

CREATE INDEX IF NOT EXISTS media_assets_folder_idx ON public.media_assets (folder, created_at DESC);

-- Auto-create profile on signup (staff accounts created by admin script)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
