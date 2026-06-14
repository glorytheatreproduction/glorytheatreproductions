-- Optional background music for blog posts (Instagram-style soundtrack while reading)
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS background_music jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.blog_posts.background_music IS
  'Optional soundtrack: { "url", "title", "artist" } — loops while visitors read the post.';
