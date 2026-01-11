-- Add updated_at to support_sessions if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='support_sessions' AND column_name='updated_at') THEN
        ALTER TABLE public.support_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Also add helpful indexes for sorting
CREATE INDEX IF NOT EXISTS idx_ss_updated_at ON public.support_sessions(updated_at DESC);
