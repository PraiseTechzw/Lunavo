-- Create check_ins table for mood tracking
-- This enables the "Full Backend Integration" requested

CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    mood TEXT NOT NULL, -- 'terrible', 'bad', 'okay', 'good', 'awesome'
    note TEXT, -- The private journal entry (Protected by RLS)
    tags TEXT[], -- Optional tags derived from 'AI' analysis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraint to ensure valid moods
    CONSTRAINT valid_mood CHECK (mood IN ('terrible', 'bad', 'okay', 'good', 'awesome'))
);

-- Enable RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see and insert their own check-ins
CREATE POLICY "Users can insert their own check-ins"
    ON public.check_ins FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own check-ins"
    ON public.check_ins FOR SELECT
    USING (auth.uid() = user_id);

-- Create index for faster analytics/charts
CREATE INDEX idx_check_ins_user_date ON public.check_ins(user_id, created_at);

-- Grant permissions
GRANT ALL ON public.check_ins TO authenticated;
