-- 1. Create a function to handle announcement notifications (Database Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_announcement()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger for published announcements that are happening now
    IF NEW.is_published = TRUE AND (NEW.scheduled_for IS NULL OR NEW.scheduled_for <= NOW()) THEN
        
        -- Insert a system notification for all users
        -- Note: For scale, this should ideally be done via Edge Functions or batched, 
        -- but for this scale, a direct insert is acceptable or we rely on the client knowing about "global" notifications.
        -- HOWEVER, creating a row for EVERY user is bad practice.
        -- BETTER STRATEGY: We will rely on Client-Side Realtime for the "Toast" using the announcements table itself.
        -- BUT if we want it in the "Notifications Screen", we can use a "System Notifications" concept.
        
        -- For now, let's create a notification for *active* users if manageable, OR 
        -- simply allow the client to treat high-priority announcements as notifications.
        
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Announcements Policies to respect expiration
DROP POLICY IF EXISTS "Anyone can read published announcements" ON public.announcements;

CREATE POLICY "Anyone can read published announcements"
    ON public.announcements FOR SELECT
    USING (
        is_published = TRUE 
        AND (scheduled_for IS NULL OR scheduled_for <= NOW())
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- 3. Create a clean system for "Global System Notifications"
-- We will create a `system_notifications` table that is effectively a log of alerts sent to everyone.
CREATE TABLE IF NOT EXISTS public.system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'alert', 'info', etc.
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow everyone to read system notifications
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read system notifications"
    ON public.system_notifications FOR SELECT
    USING (true);

-- 4. Trigger to copy IMPORTANT announcements to system_notifications
CREATE OR REPLACE FUNCTION public.copy_announcement_to_system_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- If it's a Critical or High priority announcement, push it to system notifications log
    -- This allows the client to subscribe to *inserts* on this table to show real-time alerts.
    IF NEW.is_published = TRUE AND (NEW.priority = 'critical' OR NEW.priority = 'high') THEN
        INSERT INTO public.system_notifications (title, message, type, data)
        VALUES (
            NEW.title,
            NEW.content,
            NEW.priority,
            jsonb_build_object('announcementId', NEW.id, 'actionLink', NEW.action_link)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_critical_announcement_published
    AFTER INSERT OR UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.copy_announcement_to_system_notifications();
