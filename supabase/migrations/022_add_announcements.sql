-- Add Announcements Table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can read published announcements
CREATE POLICY "Anyone can read published announcements"
    ON public.announcements FOR SELECT
    USING (is_published = TRUE AND (scheduled_for IS NULL OR scheduled_for <= NOW()));

-- Executives and Admins can manage all announcements
CREATE POLICY "Executives can manage announcements"
    ON public.announcements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND
            (users.role = 'peer-educator-executive' OR users.role = 'admin')
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_announcements_updated_at 
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grants
GRANT ALL ON public.announcements TO authenticated;
