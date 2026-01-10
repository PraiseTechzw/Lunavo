# Supabase Setup

This guide walks you through setting up Supabase as the backend for the Lunavo platform.

## Overview

Supabase provides:
- **PostgreSQL Database** - For storing all application data
- **Authentication** - User authentication and session management
- **Row Level Security (RLS)** - Database-level access control
- **Real-time Subscriptions** - Live updates for posts, messages, etc.
- **Storage** - File storage (if needed)

## Step 1: Create Supabase Project

1. Visit [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in to your account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: `Lunavo` (or your preferred name)
   - **Database Password**: Create a strong password (save this securely!)
   - **Region**: Choose the region closest to Zimbabwe (e.g., `ap-southeast-1`)
   - **Pricing Plan**: Free tier is sufficient for development
5. Click **"Create new project"** and wait 1-2 minutes for provisioning

## Step 2: Get API Keys

1. In your Supabase dashboard, navigate to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → This is your `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → This is your `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Keep this secret! Only use server-side

## Step 3: Configure Environment Variables

1. Create a `.env` file in the project root (if not already created)
2. Add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_ENVIRONMENT=development
```

3. **Important**: 
   - Never commit `.env` to version control (already in `.gitignore`)
   - Restart your Expo dev server after creating/updating `.env`
   - Variable names must start with `EXPO_PUBLIC_` for Expo to expose them

## Step 4: Run Database Migrations

The database schema is defined in SQL migration files. Run them in order:

### Option A: Using Supabase SQL Editor (Recommended)

1. In Supabase dashboard, go to **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy all SQL code and paste into the SQL Editor
4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
5. Wait for success message
6. Repeat for `002_rls_policies.sql`
7. Run any additional migrations in numerical order

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 5: Verify Database Setup

1. Go to **Table Editor** in Supabase dashboard
2. You should see all tables created:
   - `users`
   - `posts`
   - `replies`
   - `reports`
   - `escalations`
   - `meetings`
   - `resources`
   - `notifications`
   - `badges`
   - `check_ins`
   - And more...

3. Go to **Authentication** → **Policies**
4. Verify RLS policies are active (should show enabled)

## Step 6: Configure Authentication

1. Go to **Authentication** → **Providers**
2. **Email** provider should be enabled by default
3. Configure email settings:
   - **Enable email confirmations**: Optional (disable for testing)
   - **Secure email change**: Enable for production
   - **Email templates**: Customize as needed

4. (Optional) Configure other providers:
   - Google OAuth
   - GitHub OAuth
   - etc.

## Step 7: Set Up Row Level Security (RLS)

RLS policies are defined in `002_rls_policies.sql`. These policies ensure:

- Users can only see their own data
- Users can only modify their own posts/replies
- Admins have elevated permissions
- Counselors can see escalated posts
- And more...

**Important**: Never disable RLS in production! It's a critical security feature.

## Database Schema Overview

### Core Tables

- **users** - User profiles and authentication
- **posts** - Forum posts and questions
- **replies** - Responses to posts
- **reports** - Content reports
- **escalations** - Escalated posts for counselors
- **meetings** - Scheduled meetings
- **resources** - Educational resources
- **notifications** - User notifications
- **badges** - Achievement badges
- **check_ins** - Daily mood check-ins

### Relationships

- Users → Posts (one-to-many)
- Posts → Replies (one-to-many)
- Users → Replies (one-to-many)
- Posts → Escalations (one-to-one)
- Users → Badges (many-to-many via `user_badges`)

## Testing the Connection

1. Start your Expo app: `npm start`
2. Check the console for connection errors
3. Try logging in with a test account
4. Verify data is being saved to Supabase

## Security Best Practices

### ✅ Do:
- Always use RLS policies
- Use the `anon` key in client code
- Keep `service_role` key secret (server-side only)
- Regularly review and update RLS policies
- Use environment variables for all secrets

### ❌ Don't:
- Never commit `.env` file
- Never use `service_role` key in client code
- Never disable RLS in production
- Never expose API keys in code or logs

## Troubleshooting

### "Missing Supabase environment variables"

**Solution**:
- Check `.env` file exists in root directory
- Verify variable names start with `EXPO_PUBLIC_`
- Restart Expo dev server after creating `.env`

### "Invalid API key"

**Solution**:
- Verify you copied the correct key (use `anon/public`, not `service_role`)
- Check for extra spaces in `.env` file
- Ensure no quotes around the values

### "Tables not showing"

**Solution**:
- Run migrations in order (001, then 002, etc.)
- Check SQL Editor for error messages
- Refresh the Table Editor page
- Verify migrations completed successfully

### "RLS policies not working"

**Solution**:
- Verify RLS is enabled on tables
- Check policies are correctly defined
- Review policy conditions match your use case
- Test with different user roles

### "Connection timeout"

**Solution**:
- Check your internet connection
- Verify Supabase project is active
- Check if your IP is blocked (check Supabase dashboard)
- Try a different network

## Migration Files

All migration files are in `supabase/migrations/`:

- `001_initial_schema.sql` - Creates all tables
- `002_rls_policies.sql` - Sets up Row Level Security
- `003_*.sql` - Auth integration updates
- `004_*.sql` - Additional features
- And more...

**Always run migrations in numerical order!**

## Next Steps

1. ✅ Verify database setup
2. ✅ Test authentication
3. ✅ Review [Database Migration Guide](Database-Migration.md) if needed
4. ✅ Check [Authentication Documentation](../Features/Authentication.md)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Need Help?** Check the [Troubleshooting Guide](../Technical-Reference/Troubleshooting.md) or review migration files in `supabase/migrations/`.
