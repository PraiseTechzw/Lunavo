# Database Migration Guide

## Issue: Foreign Key Dependencies

If you're getting errors about foreign key dependencies when running migrations, here's how to fix it.

## Solution Options

### Option 1: Fresh Start (Recommended for Development)

If you don't have important data, the easiest solution is to start fresh:

1. **Drop all tables** in Supabase SQL Editor:
   ```sql
   -- Drop all tables (this will cascade and remove foreign keys)
   DROP TABLE IF EXISTS check_ins CASCADE;
   DROP TABLE IF EXISTS analytics CASCADE;
   DROP TABLE IF EXISTS resources CASCADE;
   DROP TABLE IF EXISTS notifications CASCADE;
   DROP TABLE IF EXISTS streaks CASCADE;
   DROP TABLE IF EXISTS user_badges CASCADE;
   DROP TABLE IF EXISTS badges CASCADE;
   DROP TABLE IF EXISTS meeting_attendance CASCADE;
   DROP TABLE IF EXISTS meetings CASCADE;
   DROP TABLE IF EXISTS escalations CASCADE;
   DROP TABLE IF EXISTS reports CASCADE;
   DROP TABLE IF EXISTS replies CASCADE;
   DROP TABLE IF EXISTS posts CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```

2. **Run the updated initial schema** (`001_initial_schema.sql`)
   - This already has the correct users table structure

3. **Run RLS policies** (`002_rls_policies.sql`)

### Option 2: Safe Migration (If You Have Data)

Use the safe migration that only makes minimal changes:

1. **Run** `003_update_users_auth_integration_SAFE.sql`
   - This only removes `password_hash` and adds the foreign key
   - Won't break if foreign key can't be added

2. **If foreign key fails**, you'll need to sync user IDs:
   ```sql
   -- Check if user IDs match auth.users
   SELECT u.id, u.email, au.id as auth_id
   FROM users u
   LEFT JOIN auth.users au ON u.id = au.id;
   ```

### Option 3: Fixed Migration (Try This First)

Run `003_update_users_auth_integration_FIXED.sql`:
- Safely handles errors
- Only makes necessary changes
- Won't break if constraints can't be added

## Recommended Approach

**For Development:**
1. Use Option 1 (Fresh Start)
2. Run `001_initial_schema.sql` (already updated)
3. Run `002_rls_policies.sql`

**For Production (with existing data):**
1. Backup your data first!
2. Try Option 3 (Fixed Migration)
3. If it fails, manually sync user IDs
4. Then run the migration again

## Updated Initial Schema

The `001_initial_schema.sql` has been updated to:
- Reference `auth.users(id)` directly
- Remove `password_hash` column
- Use proper foreign key constraints

If you're starting fresh, just use the updated `001_initial_schema.sql` and skip migration 003.

