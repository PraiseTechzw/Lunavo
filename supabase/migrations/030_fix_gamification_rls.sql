-- Fix RLS for gamification tables used from the client

-- user_points: allow user to create/update their own row (supports upsert)
DROP POLICY IF EXISTS "Users can create own points row" ON user_points;
CREATE POLICY "Users can create own points row"
  ON user_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own points row" ON user_points;
CREATE POLICY "Users can update own points row"
  ON user_points FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- points_transactions: allow user to record their own transactions
DROP POLICY IF EXISTS "Users can create own transactions" ON points_transactions;
CREATE POLICY "Users can create own transactions"
  ON points_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- streaks: allow user to create/update their own streak rows
DROP POLICY IF EXISTS "Users can create own streaks" ON streaks;
CREATE POLICY "Users can create own streaks"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own streaks" ON streaks;
CREATE POLICY "Users can update own streaks"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
