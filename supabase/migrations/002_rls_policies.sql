-- Row Level Security (RLS) Policies for Lunavo Platform
-- Run this migration after creating the schema

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not role, email, or student_number)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM users WHERE id = auth.uid()) AND
    email = (SELECT email FROM users WHERE id = auth.uid()) AND
    (student_number IS NULL OR student_number = (SELECT student_number FROM users WHERE id = auth.uid()))
  );

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'student-affairs')
    )
  );

-- ============================================
-- POSTS POLICIES
-- ============================================

-- Anyone authenticated can read active posts
CREATE POLICY "Anyone can read active posts"
  ON posts FOR SELECT
  USING (status = 'active' AND auth.role() = 'authenticated');

-- Users can read their own posts (including escalated/resolved)
CREATE POLICY "Users can read own posts"
  ON posts FOR SELECT
  USING (author_id = auth.uid());

-- Users can create posts
CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Users can update their own posts (if not escalated)
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (author_id = auth.uid() AND status != 'escalated')
  WITH CHECK (author_id = auth.uid());

-- Users can delete their own posts (if not escalated)
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (author_id = auth.uid() AND status != 'escalated');

-- Moderators and admins can read all posts
CREATE POLICY "Moderators can read all posts"
  ON posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'student-affairs')
    )
  );

-- Moderators and admins can update any post
CREATE POLICY "Moderators can update any post"
  ON posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

-- Counselors and life-coaches can read escalated posts
CREATE POLICY "Counselors can read escalated posts"
  ON posts FOR SELECT
  USING (
    status = 'escalated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('counselor', 'life-coach', 'admin')
    )
  );

-- ============================================
-- REPLIES POLICIES
-- ============================================

-- Anyone authenticated can read replies to active posts
CREATE POLICY "Anyone can read replies to active posts"
  ON replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = replies.post_id AND posts.status = 'active'
    ) AND
    auth.role() = 'authenticated'
  );

-- Users can read their own replies
CREATE POLICY "Users can read own replies"
  ON replies FOR SELECT
  USING (author_id = auth.uid());

-- Users can create replies
CREATE POLICY "Users can create replies"
  ON replies FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Users can update their own replies
CREATE POLICY "Users can update own replies"
  ON replies FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Users can delete their own replies
CREATE POLICY "Users can delete own replies"
  ON replies FOR DELETE
  USING (author_id = auth.uid());

-- Moderators can read all replies
CREATE POLICY "Moderators can read all replies"
  ON replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'student-affairs')
    )
  );

-- ============================================
-- REPORTS POLICIES
-- ============================================

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Users can read their own reports
CREATE POLICY "Users can read own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Moderators and admins can read all reports
CREATE POLICY "Moderators can read all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

-- Moderators and admins can update reports
CREATE POLICY "Moderators can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

-- ============================================
-- ESCALATIONS POLICIES
-- ============================================

-- Counselors, life-coaches, and admins can read escalations
CREATE POLICY "Counselors can read escalations"
  ON escalations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('counselor', 'life-coach', 'admin', 'student-affairs')
    )
  );

-- System can create escalations (via service role)
-- Users cannot directly create escalations

-- Counselors and life-coaches can update assigned escalations
CREATE POLICY "Counselors can update assigned escalations"
  ON escalations FOR UPDATE
  USING (
    assigned_to = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('counselor', 'life-coach', 'admin')
    )
  );

-- Admins can update any escalation
CREATE POLICY "Admins can update any escalation"
  ON escalations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- MEETINGS POLICIES
-- ============================================

-- Anyone authenticated can read meetings
CREATE POLICY "Anyone can read meetings"
  ON meetings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Peer educator executives and admins can create meetings
CREATE POLICY "Executives can create meetings"
  ON meetings FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('peer-educator-executive', 'admin')
    )
  );

-- Peer educator executives and admins can update meetings
CREATE POLICY "Executives can update meetings"
  ON meetings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('peer-educator-executive', 'admin')
    )
  );

-- ============================================
-- MEETING ATTENDANCE POLICIES
-- ============================================

-- Users can read their own attendance
CREATE POLICY "Users can read own attendance"
  ON meeting_attendance FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own attendance (RSVP)
CREATE POLICY "Users can create own attendance"
  ON meeting_attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own attendance
CREATE POLICY "Users can update own attendance"
  ON meeting_attendance FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Executives can read all attendance for their meetings
CREATE POLICY "Executives can read meeting attendance"
  ON meeting_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_attendance.meeting_id AND
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role IN ('peer-educator-executive', 'admin')
      )
    )
  );

-- ============================================
-- BADGES POLICIES
-- ============================================

-- Anyone authenticated can read badges
CREATE POLICY "Anyone can read badges"
  ON badges FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only system can create/update badges (via service role)

-- ============================================
-- USER BADGES POLICIES
-- ============================================

-- Users can read their own badges
CREATE POLICY "Users can read own badges"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid());

-- Anyone authenticated can read user badges (for leaderboards)
CREATE POLICY "Anyone can read user badges"
  ON user_badges FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only system can create user badges (via service role)

-- ============================================
-- STREAKS POLICIES
-- ============================================

-- Users can read their own streaks
CREATE POLICY "Users can read own streaks"
  ON streaks FOR SELECT
  USING (user_id = auth.uid());

-- Anyone authenticated can read streaks (for leaderboards)
CREATE POLICY "Anyone can read streaks"
  ON streaks FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only system can create/update streaks (via service role)

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Only system can create notifications (via service role)

-- ============================================
-- RESOURCES POLICIES
-- ============================================

-- Anyone authenticated can read resources
CREATE POLICY "Anyone can read resources"
  ON resources FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins and executives can create resources
CREATE POLICY "Admins can create resources"
  ON resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'peer-educator-executive', 'student-affairs')
    )
  );

-- Admins and executives can update resources
CREATE POLICY "Admins can update resources"
  ON resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'peer-educator-executive', 'student-affairs')
    )
  );

-- ============================================
-- CHECK-INS POLICIES
-- ============================================

-- Users can read their own check-ins
CREATE POLICY "Users can read own check-ins"
  ON check_ins FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own check-ins
CREATE POLICY "Users can create own check-ins"
  ON check_ins FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own check-ins
CREATE POLICY "Users can update own check-ins"
  ON check_ins FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Student affairs can read anonymized check-in data (aggregated)
-- This would be done through a view or function, not direct table access

-- ============================================
-- ANALYTICS POLICIES
-- ============================================

-- Only admins and student-affairs can read analytics
CREATE POLICY "Admins can read analytics"
  ON analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'student-affairs')
    )
  );

-- Only system can create analytics (via service role)

