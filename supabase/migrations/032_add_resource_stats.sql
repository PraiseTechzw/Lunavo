-- Add views and rating columns to resources table if they don't exist
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0.0;
-- Create resource_ratings table for tracking individual user ratings
CREATE TABLE IF NOT EXISTS public.resource_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);
-- Enable RLS for resource_ratings
ALTER TABLE public.resource_ratings ENABLE ROW LEVEL SECURITY;
-- Allow users to read all ratings (needed for calculating averages if done client-side, 
-- though simpler to just read the aggregated rating on the resource)
CREATE POLICY "Anyone can read ratings" ON public.resource_ratings FOR
SELECT USING (true);
-- Allow authenticated users to insert their own ratings
CREATE POLICY "Users can rate resources" ON public.resource_ratings FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Allow users to update their own ratings
CREATE POLICY "Users can update their own ratings" ON public.resource_ratings FOR
UPDATE USING (auth.uid() = user_id);
-- Improve performance with indexes
CREATE INDEX IF NOT EXISTS idx_resource_ratings_resource_id ON public.resource_ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_user_id ON public.resource_ratings(user_id);