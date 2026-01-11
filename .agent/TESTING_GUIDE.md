# 🧪 Testing & Validation Guide

## Quick Start

Run all validation checks:
```bash
npm run validate
```

This runs:
1. Pre-flight checks (environment, config)
2. Database validation (tables, columns)

---

## Individual Test Scripts

### 1. Pre-flight Check
**What it does**: Validates your development environment and configuration

```bash
npm run preflight
```

**Checks:**
- ✅ Node.js version (>= 20.x)
- ✅ Dependencies installed
- ✅ `.env` file exists
- ✅ Supabase credentials configured
- ✅ `app.json` and `eas.json` exist
- ✅ EAS project ID configured
- ✅ GitHub workflows present
- ✅ Supabase migrations exist
- ✅ Git repository initialized
- ✅ Documentation present

**Expected Output:**
```
🚀 Pre-flight Checks for PEACE Platform

✅ Node.js version >= 20.x
✅ package.json exists
✅ Dependencies installed
✅ .env file exists
...

📊 Summary:
Total Checks: 14
✅ Passed: 14
❌ Failed: 0
Success Rate: 100.0%

🎉 All checks passed! Ready for deployment
```

---

### 2. Database Validation
**What it does**: Checks if all required database tables exist

```bash
npm run test:db
```

**Validates:**
- ✅ `users` table
- ✅ `user_points` table
- ✅ `points_transactions` table
- ✅ `user_badges` table
- ✅ `streaks` table
- ✅ `check_ins` table
- ✅ `posts` table
- ✅ `replies` table
- ✅ `support_sessions` table
- ✅ `support_messages` table

**Expected Output:**
```
🔍 Validating Database Schema...

✅ Table 'users': OK
✅ Table 'user_points': OK
✅ Table 'points_transactions': OK
✅ Table 'user_badges': OK
✅ Table 'streaks': OK
...

✅ All required tables exist and are accessible
✅ Database schema is valid
```

**If tables are missing:**
```bash
# Run Supabase migrations
cd supabase
supabase db push
```

---

### 3. Gamification Test
**What it does**: Tests points, badges, and streaks for current user

```bash
npm run test:gamification
```

**Tests:**
- ✅ Points system
- ✅ Transaction history
- ✅ Badge awards
- ✅ Streak tracking

**Expected Output:**
```
🎮 Testing Gamification System...

Testing for user: abc-123-def-456

1️⃣  Testing Points System...
   ✅ Current points: 45

2️⃣  Testing Transaction History...
   ✅ Found 5 recent transactions:
      +10 - Daily check-in completed
      +5 - Post created
      +10 - Reply given
      ...

3️⃣  Testing Badge System...
   ✅ Earned 2 badges:
      🏆 daily-check-in
      🏆 first-response

4️⃣  Testing Streak System...
   ✅ Active streaks:
      🔥 check-in: 3 days (longest: 5)

✅ Gamification system is configured correctly!
```

---

## Manual Testing Checklist

### User Flow Testing

#### 1. Registration & Login
- [ ] Create new account
- [ ] Verify email (if enabled)
- [ ] Login with credentials
- [ ] Logout
- [ ] Login again

#### 2. Daily Check-in
- [ ] Navigate to check-in screen
- [ ] Select mood
- [ ] Add optional note
- [ ] Submit check-in
- [ ] **Verify**: 10 points awarded
- [ ] **Verify**: Streak updated
- [ ] **Verify**: AI insight shown

#### 3. Forum Posts
- [ ] Navigate to forum
- [ ] Create new post
- [ ] **Verify**: 5 points awarded
- [ ] View post
- [ ] Reply to post
- [ ] **Verify**: 10 points awarded for reply

#### 4. Profile & Gamification
- [ ] Navigate to profile
- [ ] **Verify**: Points displayed correctly
- [ ] **Verify**: Streak shown
- [ ] **Verify**: Badges visible
- [ ] **Verify**: Level calculated (points ÷ 100 + 1)
- [ ] **Verify**: Progress bar accurate

#### 5. Rewards Screen
- [ ] Navigate to `/rewards`
- [ ] Check Points tab
  - [ ] Earning guide visible
  - [ ] Transaction history shown
- [ ] Check Leaderboard tab
  - [ ] Your rank displayed
  - [ ] Top contributors shown
- [ ] Check Badges tab
  - [ ] All 14 badges listed
  - [ ] Descriptions visible

#### 6. Chat System
- [ ] Navigate to chat
- [ ] Start new chat session
- [ ] Send message
- [ ] **Verify**: Real-time delivery
- [ ] **Verify**: Message status updates
- [ ] Check chat list
- [ ] **Verify**: Preview updates

---

## Database Testing (SQL)

### Check Points System
```sql
-- View your points
SELECT * FROM user_points WHERE user_id = 'YOUR_USER_ID';

-- View transaction history
SELECT * FROM points_transactions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check total points earned
SELECT SUM(amount) as total_earned 
FROM points_transactions 
WHERE user_id = 'YOUR_USER_ID' 
AND type = 'earned';
```

### Check Badges
```sql
-- View earned badges
SELECT * FROM user_badges WHERE user_id = 'YOUR_USER_ID';

-- Count badges
SELECT COUNT(*) as badge_count 
FROM user_badges 
WHERE user_id = 'YOUR_USER_ID';
```

### Check Streaks
```sql
-- View all streaks
SELECT * FROM streaks WHERE user_id = 'YOUR_USER_ID';

-- Check specific streak
SELECT * FROM streaks 
WHERE user_id = 'YOUR_USER_ID' 
AND streak_type = 'check-in';
```

---

## Performance Testing

### Load Testing
Test with multiple concurrent users:

```bash
# Install artillery (load testing tool)
npm install -g artillery

# Create test config (artillery.yml)
# Run load test
artillery run artillery.yml
```

### Database Performance
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Integration Testing

### GitHub Actions
Test workflows locally:

```bash
# Install act (GitHub Actions local runner)
npm install -g act

# Run workflow locally
act -j build-android-dev
```

### EAS Build Testing
```bash
# Test development build
eas build --profile development --platform android --local

# Test preview build
eas build --profile preview --platform android --local
```

---

## Automated Testing (Future)

### Unit Tests (Jest)
```bash
# Install Jest
npm install --save-dev jest @testing-library/react-native

# Run tests
npm test
```

### E2E Tests (Detox)
```bash
# Install Detox
npm install --save-dev detox

# Run E2E tests
detox test
```

---

## Troubleshooting Tests

### Pre-flight Check Fails
**Issue**: Node version too old
```bash
# Update Node.js
nvm install 20
nvm use 20
```

**Issue**: Dependencies not installed
```bash
npm install
```

**Issue**: .env missing
```bash
# Create .env file
cp .env.example .env
# Add your Supabase credentials
```

### Database Validation Fails
**Issue**: Tables don't exist
```bash
# Run migrations
cd supabase
supabase db push
```

**Issue**: Can't connect to Supabase
```bash
# Check .env credentials
# Verify Supabase project is running
# Check internet connection
```

### Gamification Test Fails
**Issue**: No user authenticated
```bash
# Run the app and login first
npm start
# Then run test again
npm run test:gamification
```

**Issue**: No points/badges
```bash
# This is normal for new users
# Complete a check-in to earn first points
```

---

## Test Coverage Goals

- [ ] **Unit Tests**: 80%+ coverage
- [ ] **Integration Tests**: Key user flows
- [ ] **E2E Tests**: Critical paths
- [ ] **Performance Tests**: Load handling
- [ ] **Security Tests**: RLS policies
- [ ] **Accessibility Tests**: WCAG compliance

---

## Continuous Testing

### Pre-commit Hooks
```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run validate"
```

### CI/CD Testing
All GitHub Actions workflows include:
- ✅ Linting
- ✅ Type checking
- ✅ Security audits
- ✅ Dependency reviews

---

## Test Data

### Sample Users
Create test users with different roles:
- Student (regular user)
- Peer Educator (volunteer)
- Admin (system admin)

### Sample Data
```sql
-- Create test check-in
INSERT INTO check_ins (user_id, mood, date) 
VALUES ('YOUR_USER_ID', 'good', CURRENT_DATE);

-- Create test post
INSERT INTO posts (author_id, title, content, category) 
VALUES ('YOUR_USER_ID', 'Test Post', 'Test content', 'general');
```

---

## Monitoring & Analytics

### Production Monitoring
- **Sentry**: Error tracking
- **Analytics**: User behavior
- **Performance**: App vitals
- **Crash Reports**: Store consoles

### Metrics to Track
- Daily Active Users (DAU)
- Points earned per user
- Badge earn rate
- Check-in completion rate
- Chat engagement
- Crash-free rate (target: >99%)

---

## Success Criteria

Tests pass if:
- ✅ All pre-flight checks pass
- ✅ All database tables exist
- ✅ Points are awarded correctly
- ✅ Badges auto-award when criteria met
- ✅ Streaks update daily
- ✅ Real-time features work
- ✅ No console errors
- ✅ App doesn't crash

---

## Next Steps

After all tests pass:
1. Run full validation: `npm run validate`
2. Test on physical devices
3. Run preview build
4. Share with stakeholders
5. Collect feedback
6. Fix any issues
7. Run production build
8. Submit to stores

---

**Happy Testing! 🧪**
