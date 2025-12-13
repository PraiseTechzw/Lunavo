# Supabase Setup Instructions

## Quick Start

Follow these steps to set up Supabase for the Lunavo platform:

### 1. Create Supabase Project

1. Visit [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `Lunavo`
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to Zimbabwe
   - **Pricing**: Free tier is fine for development
5. Click **"Create new project"** and wait 1-2 minutes

### 2. Get API Keys

1. In Supabase dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Keep secret (server-side only)

### 3. Create .env File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your keys:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   EXPO_PUBLIC_ENVIRONMENT=development
   ```

3. **Important**: `.env` is already in `.gitignore` - never commit it!

### 4. Run Database Migrations

1. In Supabase dashboard → **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy all SQL and paste into SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for success message
6. Repeat for `supabase/migrations/002_rls_policies.sql`

### 5. Verify Setup

1. Go to **Table Editor** - you should see all tables created
2. Go to **Authentication** → **Policies** - RLS policies should be active
3. Start your app: `npm start`
4. Check console for connection errors

### 6. Configure Authentication

1. Go to **Authentication** → **Providers**
2. **Email** provider should be enabled by default
3. Configure:
   - **Enable email confirmations**: Optional (disable for testing)
   - **Secure email change**: Enable for production

## What's Been Set Up

✅ Supabase client configuration (`lib/supabase.ts`)
✅ Database schema (all tables)
✅ Row Level Security (RLS) policies
✅ Environment variable setup
✅ Migration files

## Next Steps

After completing setup, proceed to:
- **Phase 1.3**: Authentication System
- **Phase 1.5**: Data Migration from AsyncStorage

## Troubleshooting

**"Missing Supabase environment variables"**
- Check `.env` file exists
- Restart Expo dev server after creating `.env`
- Variable names must start with `EXPO_PUBLIC_`

**"Invalid API key"**
- Verify you copied the correct keys
- Check for extra spaces in `.env`
- Use "anon/public" key, not service_role

**Tables not showing**
- Run migrations in order (001, then 002)
- Check SQL Editor for errors
- Refresh Table Editor page

## Security Reminders

- ⚠️ Never commit `.env` file
- ⚠️ Never use service_role key in client code
- ⚠️ Always use RLS policies
- ⚠️ Review RLS policies regularly

For detailed documentation, see `supabase/README.md`

