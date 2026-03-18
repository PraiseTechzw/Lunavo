-- Allow users to earn badges and update their own gamification stats
-- This fixes the issue where badges were not actually being awarded due to RLS limitations

-- user_badges: allow user to record that they earned a badge
DROP POLICY IF EXISTS "Users can earn own badges" ON user_badges;
CREATE POLICY "Users can earn own badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- badges: allow all authenticated users to insert badge definitions if they don't exist
-- Note: In a production app, this would be admin-only, but for this implementation
-- the client-side logic handles badge definition creation.
DROP POLICY IF EXISTS "Anyone can create badge definitions" ON badges;
CREATE POLICY "Anyone can create badge definitions"
  ON badges FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow anyone to read badge definitions
DROP POLICY IF EXISTS "Anyone can read badges" ON badges;
CREATE POLICY "Anyone can read badges"
    ON public.badges FOR SELECT
    USING (true);

-- Allow users to insert their own purchases in the shop
DROP POLICY IF EXISTS "Users can create their own purchases" ON public.user_purchases;
CREATE POLICY "Users can create their own purchases"
    ON public.user_purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own purchases" ON public.user_purchases;
CREATE POLICY "Users can view their own purchases"
    ON public.user_purchases FOR SELECT
    USING (auth.uid() = user_id);

-- Ensure notifications are insertable (needed for badge alerts)
DROP POLICY IF EXISTS "Users can create own notifications" ON notifications;
CREATE POLICY "Users can create own notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- streaks: allow user to create/update their own streak rows (Double check)
-- This was already in 030, but making sure it's inclusive
DROP POLICY IF EXISTS "Users can create own streaks" ON streaks;
CREATE POLICY "Users can create own streaks"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own streaks" ON streaks;
CREATE POLICY "Users can update own streaks"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
