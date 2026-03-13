-- Add user_purchases table to support Rewards Shop
CREATE TABLE IF NOT EXISTS public.user_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_category TEXT NOT NULL,
    price INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own purchases"
    ON public.user_purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
    ON public.user_purchases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Indexing
CREATE INDEX idx_user_purchases_user_id ON public.user_purchases(user_id);
