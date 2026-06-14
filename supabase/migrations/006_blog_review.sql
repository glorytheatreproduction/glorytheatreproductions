-- Blog posts require admin approval before publishing

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'draft'
  CHECK (review_status IN ('draft', 'pending', 'approved', 'rejected'));

UPDATE public.blog_posts
SET review_status = CASE WHEN published THEN 'approved' ELSE 'draft' END
WHERE review_status = 'draft' AND published = true;

CREATE INDEX IF NOT EXISTS blog_posts_review_status_idx
  ON public.blog_posts (review_status, sort_order);

CREATE OR REPLACE FUNCTION public.enforce_blog_writer_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_blog_writer() AND NOT public.is_staff() THEN
    NEW.published := false;
    NEW.review_status := CASE
      WHEN NEW.review_status IN ('draft', 'pending') THEN NEW.review_status
      WHEN TG_OP = 'UPDATE' AND OLD.review_status IS NOT NULL THEN OLD.review_status
      ELSE 'draft'
    END;
  END IF;

  IF NEW.review_status = 'approved' AND NEW.published IS DISTINCT FROM true THEN
    NEW.published := true;
  END IF;

  IF NEW.published = true AND NEW.review_status IS DISTINCT FROM 'approved' THEN
    NEW.review_status := 'approved';
  END IF;

  IF NEW.published = false AND NEW.review_status = 'approved' THEN
    NEW.review_status := 'draft';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_review_enforcement ON public.blog_posts;
CREATE TRIGGER blog_posts_review_enforcement
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_blog_writer_review();
