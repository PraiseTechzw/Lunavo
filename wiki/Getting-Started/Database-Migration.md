# Database Migration Guide

This guide covers database migration procedures, troubleshooting, and best practices for the Lunavo platform.

## Overview

Database migrations are SQL scripts that modify the database schema. They are stored in `supabase/migrations/` and should be run in numerical order.

## Migration Files

All migration files follow the naming pattern: `XXX_description.sql`

- `001_initial_schema.sql` - Creates all core tables
- `002_rls_policies.sql` - Sets up Row Level Security policies
- `003_update_users_auth_integration.sql` - Auth integration updates
- `004_add_username_column.sql` - Username support
- `004_points_system.sql` - Gamification points system
- `005_fix_username_availability_rls.sql` - RLS fixes
- `008_add_contact_fields.sql` - Contact information fields
- `009_create_otp_table.sql` - OTP verification table
- `010_email_uniqueness_and_validation.sql` - Email validation
- `011_fix_user_creation_rls.sql` - User creation RLS fixes

## Running Migrations

### Method 1: Supabase SQL Editor (Recommended)

1. Open Supabase dashboard → **SQL Editor**
2. Open the migration file you want to run
3. Copy all SQL code
4. Paste into SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
6. Wait for success message
7. Repeat for next migration

### Method 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run all pending migrations
supabase db push

# Or run specific migration
supabase db push --file supabase/migrations/001_initial_schema.sql
```

## Common Issues and Solutions

### Issue: Foreign Key Dependencies

**Error**: `ERROR: relation "users" does not exist` or similar foreign key errors

**Solution Options**:

#### Option 1: Fresh Start (Recommended for Development)

If you don't have important data:

1. Drop all tables in Supabase SQL Editor:
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

2. Run `001_initial_schema.sql` (already has correct structure)
3. Run `002_rls_policies.sql`
4. Run remaining migrations in order

#### Option 2: Safe Migration (If You Have Data)

Use the safe migration file:

1. Run `003_update_users_auth_integration_SAFE.sql`
   - Only removes `password_hash` and adds foreign key
   - Won't break if foreign key can't be added

2. If foreign key fails, sync user IDs:
```sql
-- Check if user IDs match auth.users
SELECT u.id, u.email, au.id as auth_id
FROM users u
LEFT JOIN auth.users au ON u.id = au.id;
```

#### Option 3: Fixed Migration

Run `003_update_users_auth_integration_FIXED.sql`:
- Safely handles errors
- Only makes necessary changes
- Won't break if constraints can't be added

### Issue: Duplicate Column

**Error**: `ERROR: column "column_name" already exists`

**Solution**:
- Check if migration was already run
- Skip the migration if column already exists
- Or modify migration to check before adding:
```sql
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username TEXT;
    END IF;
END $$;
```

### Issue: RLS Policy Conflicts

**Error**: `ERROR: policy "policy_name" already exists`

**Solution**:
- Drop existing policy first:
```sql
DROP POLICY IF EXISTS policy_name ON table_name;
```
- Then create new policy

### Issue: Migration Order

**Error**: Tables or columns referenced don't exist

**Solution**:
- Always run migrations in numerical order
- Check dependencies between migrations
- Ensure `001_initial_schema.sql` runs first

## Migration Best Practices

### ✅ Do:
- Always backup data before running migrations in production
- Test migrations in development first
- Run migrations in order
- Review SQL before executing
- Use transactions where possible
- Add error handling for idempotent migrations

### ❌ Don't:
- Don't skip migration numbers
- Don't modify already-run migrations
- Don't run migrations out of order
- Don't run production migrations without testing
- Don't delete migration files (keep history)

## Creating New Migrations

When creating a new migration:

1. **Number it correctly**: Use next available number (e.g., `012_new_feature.sql`)
2. **Make it idempotent**: Use `IF NOT EXISTS` checks
3. **Include rollback** (optional): Add comments for rollback SQL
4. **Test thoroughly**: Test in development first
5. **Document changes**: Add comments explaining what the migration does

### Example Migration Template

```sql
-- Migration: 012_add_new_feature
-- Description: Adds new feature table
-- Date: 2024-12-14

-- Create table if not exists
CREATE TABLE IF NOT EXISTS new_feature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own features"
    ON new_feature FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own features"
    ON new_feature FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add indexes if needed
CREATE INDEX IF NOT EXISTS idx_new_feature_user_id 
    ON new_feature(user_id);
```

## Rollback Procedures

If a migration causes issues:

1. **Identify the problem**: Check error messages
2. **Stop the application**: Prevent further issues
3. **Review migration**: Understand what changed
4. **Create rollback migration**: Reverse the changes
5. **Test rollback**: Verify it works
6. **Apply rollback**: Run the rollback migration

### Example Rollback

```sql
-- Rollback for 012_add_new_feature
DROP TABLE IF EXISTS new_feature CASCADE;
```

## Migration Checklist

Before running migrations:

- [ ] Backup database (production only)
- [ ] Review migration SQL
- [ ] Test in development environment
- [ ] Check for breaking changes
- [ ] Verify dependencies are met
- [ ] Plan rollback strategy
- [ ] Notify team (if shared database)

After running migrations:

- [ ] Verify tables/columns created
- [ ] Test application functionality
- [ ] Check RLS policies are active
- [ ] Verify data integrity
- [ ] Update documentation if needed

## Production Migration Guidelines

For production deployments:

1. **Schedule maintenance window** if needed
2. **Backup database** before starting
3. **Run migrations during low-traffic period**
4. **Monitor for errors** during migration
5. **Verify application** after migration
6. **Have rollback plan** ready
7. **Document changes** for team

## Troubleshooting

### Check Migration Status

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- List all policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Verify Foreign Keys

```sql
-- Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY';
```

## Additional Resources

- [Supabase Migration Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Need Help?** Check the [Troubleshooting Guide](../Technical-Reference/Troubleshooting.md) or review existing migration files in `supabase/migrations/`.
