# Supabase Setup Guide

This guide will help you set up Supabase for the Lunavo platform.

## Step 1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the project details:
   - **Name**: Lunavo
   - **Database Password**: (choose a strong password and save it)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is fine for development
5. Click "Create new project"
6. Wait for the project to be created (takes 1-2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (this is your `EXPO_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (this is your `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (keep this secret, only use server-side)

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   EXPO_PUBLIC_ENVIRONMENT=development
   ```

3. **Important**: Add `.env` to your `.gitignore` file to keep your keys secret!

## Step 4: Run Database Migrations

1. In your Supabase project dashboard, go to **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy the entire contents and paste into the SQL Editor
4. Click "Run" to execute the migration
5. Wait for it to complete (should take a few seconds)
6. Repeat for `supabase/migrations/002_rls_policies.sql`

## Step 5: Verify Tables Were Created

1. In Supabase dashboard, go to **Table Editor**
2. You should see all the tables:
   - users
   - posts
   - replies
   - reports
   - escalations
   - meetings
   - meeting_attendance
   - badges
   - user_badges
   - streaks
   - notifications
   - resources
   - check_ins
   - analytics

## Step 6: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure email settings:
   - **Enable email confirmations**: Toggle based on your needs
   - **Secure email change**: Enable for production
4. (Optional) Configure other providers (Google, GitHub, etc.) if needed

## Step 7: Set Up Row Level Security (RLS)

The RLS policies are already included in `002_rls_policies.sql`. After running that migration, RLS will be enabled on all tables.

To verify:
1. Go to **Authentication** → **Policies**
2. You should see policies for each table

## Step 8: Test the Connection

1. Start your Expo app:
   ```bash
   npm start
   ```

2. The app should now be able to connect to Supabase
3. Check the console for any connection errors

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure you've created a `.env` file
- Make sure the variable names start with `EXPO_PUBLIC_`
- Restart your Expo development server after adding environment variables

### Error: "Invalid API key"
- Double-check that you copied the correct keys from Supabase
- Make sure there are no extra spaces in your `.env` file
- The anon key should be the "anon/public" key, not the service_role key

### Tables not showing up
- Make sure you ran both migration files in order
- Check the SQL Editor for any error messages
- Try refreshing the Table Editor page

### RLS blocking queries
- Make sure you're authenticated before making queries
- Check that the RLS policies match your use case
- You can temporarily disable RLS for testing (not recommended for production)

## Next Steps

After completing this setup:
1. Implement authentication (Phase 1.3)
2. Create database utilities (Phase 1.5)
3. Migrate from AsyncStorage to Supabase

## Security Notes

- **Never commit your `.env` file** to version control
- The `anon` key is safe to use in client-side code
- The `service_role` key should **never** be used in client-side code
- Always use RLS policies to protect your data
- Regularly review and update your RLS policies

## Support

For Supabase-specific issues, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)

