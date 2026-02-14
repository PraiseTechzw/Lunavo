-- Add Gallery support + image resource type + post-images bucket

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'post_category'
      AND e.enumlabel = 'gallery'
  ) THEN
    ALTER TYPE post_category ADD VALUE 'gallery';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'resource_type'
      AND e.enumlabel = 'image'
  ) THEN
    ALTER TYPE resource_type ADD VALUE 'image';
  END IF;
END
$$;

-- Bucket for post images (for markdown uploads inside posts)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view post images
CREATE POLICY "Public Access - post-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Any authenticated user can upload post images
CREATE POLICY "Authenticated can upload - post-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);

-- Uploader can manage their own post images
CREATE POLICY "Users can manage own - post-images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-images' AND
  owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'post-images' AND
  owner = auth.uid()
);

CREATE POLICY "Users can delete own - post-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images' AND
  owner = auth.uid()
);
