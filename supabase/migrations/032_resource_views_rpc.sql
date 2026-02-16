-- Resource view counter support (RPC + column)

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_resource_views(resource_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.resources
  SET views = COALESCE(views, 0) + 1
  WHERE id = resource_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_resource_views(UUID) TO authenticated;

-- Resource ratings support (Table + RLS)
CREATE TABLE IF NOT EXISTS public.resource_ratings (
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (resource_id, user_id)
);

ALTER TABLE public.resource_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read ratings"
  ON public.resource_ratings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own ratings"
  ON public.resource_ratings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add rating column to resources to store average
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION DEFAULT 0.0;
