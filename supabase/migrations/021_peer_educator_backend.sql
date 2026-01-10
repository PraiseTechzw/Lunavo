-- Peer Educator Backend Tables
-- CLEAN INSTALL: Drops and recreates tables

-----------------------------------------------------------
-- STEP 1: DROP EXISTING TABLES (cascades policies too)
-----------------------------------------------------------
DROP TABLE IF EXISTS public.escalations CASCADE;
DROP TABLE IF EXISTS public.pe_activity_logs CASCADE;
DROP TABLE IF EXISTS public.support_sessions CASCADE;

-----------------------------------------------------------
-- STEP 2: CREATE TABLES
-----------------------------------------------------------

-- Support Sessions
CREATE TABLE public.support_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    educator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    student_pseudonym TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    category TEXT,
    preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Activity Logs
CREATE TABLE public.pe_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escalations
CREATE TABLE public.escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.support_sessions(id) ON DELETE CASCADE,
    escalated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    urgency TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT
);

-----------------------------------------------------------
-- STEP 3: ENABLE RLS
-----------------------------------------------------------
ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pe_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;

-----------------------------------------------------------
-- STEP 4: CREATE POLICIES
-----------------------------------------------------------

-- Support Sessions
CREATE POLICY "ss_select" ON public.support_sessions FOR SELECT
USING (status = 'pending' OR educator_id = auth.uid());

CREATE POLICY "ss_update" ON public.support_sessions FOR UPDATE
USING (status = 'pending' OR educator_id = auth.uid());

CREATE POLICY "ss_insert" ON public.support_sessions FOR INSERT
WITH CHECK (true);

-- Activity Logs
CREATE POLICY "pal_select" ON public.pe_activity_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "pal_insert" ON public.pe_activity_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "pal_update" ON public.pe_activity_logs FOR UPDATE
USING (user_id = auth.uid());

-- Escalations
CREATE POLICY "esc_select" ON public.escalations FOR SELECT
USING (escalated_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "esc_insert" ON public.escalations FOR INSERT
WITH CHECK (true);

-----------------------------------------------------------
-- STEP 5: INDEXES
-----------------------------------------------------------
CREATE INDEX idx_ss_status ON public.support_sessions(status);
CREATE INDEX idx_ss_educator ON public.support_sessions(educator_id);
CREATE INDEX idx_pal_user ON public.pe_activity_logs(user_id, date);
CREATE INDEX idx_esc_assigned ON public.escalations(assigned_to, status);

-----------------------------------------------------------
-- STEP 6: GRANTS
-----------------------------------------------------------
GRANT ALL ON public.support_sessions TO authenticated;
GRANT ALL ON public.pe_activity_logs TO authenticated;
GRANT ALL ON public.escalations TO authenticated;
