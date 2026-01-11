-- Enhance Announcements Table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('general', 'alert', 'event', 'spotlight')) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS action_link TEXT,
ADD COLUMN IF NOT EXISTS action_label TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying of active announcements
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_published, scheduled_for, expires_at);
