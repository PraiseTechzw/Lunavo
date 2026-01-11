# Gamification System - Testing & Validation Checklist

## ✅ Database Setup

### Required Tables
Run these SQL migrations in order:
1. `001_initial_schema.sql` - Creates `badges`, `user_badges`, `streaks` tables
2. `004_points_system.sql` - Creates `user_points`, `points_transactions` tables

### Verify Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_points', 'points_transactions', 'user_badges', 'streaks', 'check_ins');
```

### Verify RLS Policies
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_points', 'points_transactions', 'user_badges', 'streaks');
```

---

## 🧪 Feature Testing

### 1. Check-In System
**Test Steps:**
1. Navigate to Check-In screen (`/check-in`)
2. Select a mood
3. Add optional note
4. Submit check-in

**Expected Results:**
- ✅ Check-in saved to database
- ✅ User earns **10 points**
- ✅ Check-in streak updated
- ✅ AI insight modal appears
- ✅ Points visible in profile

**Verify in Database:**
```sql
-- Check if check-in was saved
SELECT * FROM check_ins WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC LIMIT 1;

-- Check if points were awarded
SELECT * FROM points_transactions WHERE user_id = 'YOUR_USER_ID' AND category = 'check-in' ORDER BY created_at DESC LIMIT 1;

-- Check streak
SELECT * FROM streaks WHERE user_id = 'YOUR_USER_ID' AND streak_type = 'check-in';
```

---

### 2. Post Creation
**Test Steps:**
1. Navigate to Forum tab
2. Create a new post
3. Submit

**Expected Results:**
- ✅ Post created successfully
- ✅ User earns **5 points**
- ✅ Badge eligibility checked
- ✅ Points transaction recorded

**Verify in Database:**
```sql
-- Check points transaction
SELECT * FROM points_transactions WHERE user_id = 'YOUR_USER_ID' AND category = 'engagement' AND description LIKE '%Post created%' ORDER BY created_at DESC LIMIT 1;
```

---

### 3. Reply System
**Test Steps:**
1. Open any post
2. Write a reply
3. Submit

**Expected Results:**
- ✅ Reply saved
- ✅ User earns **10 points**
- ✅ Badge eligibility checked

**Verify in Database:**
```sql
SELECT * FROM points_transactions WHERE user_id = 'YOUR_USER_ID' AND category = 'engagement' AND description LIKE '%Reply given%' ORDER BY created_at DESC LIMIT 1;
```

---

### 4. Profile Screen
**Test Steps:**
1. Navigate to Profile tab
2. Check displayed data

**Expected Results:**
- ✅ Total points displayed correctly
- ✅ Current streak shown
- ✅ Badge count accurate
- ✅ Level calculated (points ÷ 100 + 1)
- ✅ Progress bar shows correct percentage
- ✅ Recent points history visible
- ✅ Points breakdown cards show correct values

---

### 5. Rewards Screen
**Test Steps:**
1. Navigate to `/rewards`
2. Test all three tabs

**Expected Results:**

**Points Tab:**
- ✅ Shows earning guide with all point values
- ✅ Displays full transaction history
- ✅ Transactions sorted by date (newest first)

**Leaderboard Tab:**
- ✅ Shows user's current rank
- ✅ Displays top 50 contributors
- ✅ Top 3 have trophy icons (gold/silver/bronze)
- ✅ Rankings update in real-time

**Badges Tab:**
- ✅ Shows all 14 badge definitions
- ✅ Each badge has icon, name, description
- ✅ Category labels visible

---

### 6. Badge System
**Test Automatic Badge Awards:**

**Daily Check-in Badge (1 check-in):**
```sql
-- Should auto-award after first check-in
SELECT * FROM user_badges WHERE user_id = 'YOUR_USER_ID' AND badge_id = 'daily-check-in';
```

**First Response Badge (1 reply):**
```sql
-- Should auto-award after first reply
SELECT * FROM user_badges WHERE user_id = 'YOUR_USER_ID' AND badge_id = 'first-response';
```

**Weekly Warrior (7-day streak):**
- Complete check-ins for 7 consecutive days
- Badge should auto-award on day 7

---

## 🔍 Common Issues & Fixes

### Issue: Points not appearing
**Check:**
1. Verify `user_points` table exists
2. Check RLS policies allow user to view their points
3. Ensure `getUserPoints()` function is being called

**Fix:**
```sql
-- Manually create points record if missing
INSERT INTO user_points (user_id, points) VALUES ('YOUR_USER_ID', 0);
```

---

### Issue: Transactions not recording
**Check:**
1. Verify `points_transactions` table exists
2. Check if service role is being used for inserts
3. Review RLS policies

**Fix:**
```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'points_transactions';
```

---

### Issue: Badges not auto-awarding
**Check:**
1. Verify `checkAllBadges()` is being called after actions
2. Check badge eligibility logic in `gamification.ts`
3. Ensure user stats are being calculated correctly

**Debug:**
```typescript
// Add logging to see badge checks
const stats = await getUserStats(userId);
console.log('User stats:', stats);

for (const badge of BADGE_DEFINITIONS) {
  const eligible = await checkBadgeEligibility(userId, badge.id);
  console.log(`Badge ${badge.id}: ${eligible ? 'ELIGIBLE' : 'not eligible'}`);
}
```

---

### Issue: Streaks not updating
**Check:**
1. Verify `streaks` table exists
2. Check if `updateCheckInStreak()` is being called
3. Ensure date calculations are correct

**Fix:**
```sql
-- Manually create streak record
INSERT INTO streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
VALUES ('YOUR_USER_ID', 'check-in', 1, 1, CURRENT_DATE);
```

---

### Issue: Leaderboard empty
**Check:**
1. Ensure multiple users have points
2. Verify `getUsers()` and `getUserPoints()` are working
3. Check if RLS allows viewing other users' points

**Note:** Users can only see their own points due to RLS. Leaderboard requires service role or adjusted policies.

---

## 📊 Performance Checks

### Database Indexes
Verify these indexes exist for optimal performance:
```sql
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('user_points', 'points_transactions', 'user_badges', 'streaks');
```

Expected indexes:
- `idx_user_points_user_id`
- `idx_points_transactions_user_id`
- `idx_points_transactions_created_at`

---

## 🎯 Integration Points

### Auto-Award Triggers
Ensure these functions call points/badge systems:

1. **Check-In** (`app/check-in.tsx`):
   - ✅ `awardCheckInPoints(userId)`
   - ✅ `updateCheckInStreak(userId)`

2. **Post Creation** (`lib/database.ts` - `createPost`):
   - ✅ `awardPostCreatedPoints(authorId)`
   - ✅ `checkAllBadges(authorId)`

3. **Reply Creation** (`lib/database.ts` - `createReply`):
   - ✅ `awardReplyPoints(authorId)`
   - ✅ `checkAllBadges(authorId)`

4. **Helpful Vote** (when implemented):
   - ✅ `awardHelpfulResponsePoints(userId)`
   - ✅ `checkAllBadges(userId)`

---

## ✨ Success Criteria

The gamification system is working correctly if:

1. ✅ Users earn points for all defined actions
2. ✅ Points are visible in profile and rewards screens
3. ✅ Streaks update daily and maintain accuracy
4. ✅ Badges auto-award when criteria are met
5. ✅ Leaderboard shows rankings (if RLS adjusted)
6. ✅ Transaction history is complete and accurate
7. ✅ Level system calculates correctly
8. ✅ No errors in console during normal usage
9. ✅ All animations and UI transitions work smoothly
10. ✅ Data persists across app restarts

---

## 🚀 Next Steps

After validation:
1. Adjust point values based on user feedback
2. Add more badges for specific achievements
3. Implement rewards shop (optional)
4. Add push notifications for milestones
5. Create seasonal challenges
6. Add social sharing features

---

## 📝 Notes

- All points operations use `try/catch` to prevent failures from breaking core features
- Badge checks run asynchronously to avoid blocking UI
- Streak calculations use midnight (00:00) as day boundaries
- RLS policies ensure users can only modify their own data
- Service role may be needed for certain admin operations
