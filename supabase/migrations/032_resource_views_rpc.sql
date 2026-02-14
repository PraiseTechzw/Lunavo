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
