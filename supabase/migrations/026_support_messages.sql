-- Support Messages Table
CREATE TABLE public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.support_sessions(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text', -- 'text', 'image', 'system'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for session_messages
CREATE POLICY "msg_select" ON public.support_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.support_sessions ss
        WHERE ss.id = session_id 
        AND (ss.educator_id = auth.uid() OR ss.student_pseudonym = (SELECT pseudonym FROM public.users WHERE id = auth.uid()))
    )
);

CREATE POLICY "msg_insert" ON public.support_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.support_sessions ss
        WHERE ss.id = session_id 
        AND (ss.educator_id = auth.uid() OR ss.student_pseudonym = (SELECT pseudonym FROM public.users WHERE id = auth.uid()))
    )
);

-- Indexes
CREATE INDEX idx_msg_session ON public.support_messages(session_id);
CREATE INDEX idx_msg_created ON public.support_messages(created_at);

-- Update support_sessions preview on new message
CREATE OR REPLACE FUNCTION update_session_preview()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.support_sessions
    SET preview = NEW.content,
        updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_session_preview
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION update_session_preview();

-- Grant permissions
GRANT ALL ON public.support_messages TO authenticated;
