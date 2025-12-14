# Quick Start Guide

Get up and running with Lunavo in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js (v18+) installed
- ✅ Git installed
- ✅ Code editor ready
- ✅ Supabase account (free tier works)

## Quick Setup (5 Steps)

### 1. Clone and Install

```bash
git clone https://github.com/PraiseTechzw/Lunavo.git
cd Lunavo
npm install
```

### 2. Set Up Supabase

1. Create project at [supabase.com](https://app.supabase.com)
2. Get your API keys from Settings → API
3. Create `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your-url-here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key-here
```

### 3. Run Database Migrations

1. Open Supabase SQL Editor
2. Run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/migrations/002_rls_policies.sql`

### 4. Start Development Server

```bash
npm start
```

### 5. Open the App

- Press `w` for web
- Press `a` for Android
- Press `i` for iOS
- Or scan QR code with Expo Go app

## First Steps

### Create a Test Account

1. Open the app
2. Click "Sign Up"
3. Enter email and password
4. Verify email (if enabled)
5. Complete student verification

### Explore the App

- **Home**: View dashboard and stats
- **Forum**: Browse and create posts
- **Chat**: Message other users
- **Resources**: Access support materials
- **Profile**: Manage your account

## Next Steps

- 📖 Read [Installation Guide](Installation-and-Setup.md) for detailed setup
- 🔧 Review [Supabase Setup](Supabase-Setup.md) for backend configuration
- 👨‍💻 Check [Developer Guide](../Development/Developer-Guide.md) for development
- 📚 Explore [Features Documentation](../Features/) for feature details

## Common First-Time Issues

**"Missing environment variables"**
→ Check `.env` file exists and has correct values

**"Database connection failed"**
→ Verify Supabase URL and key are correct

**"Tables not found"**
→ Run database migrations in Supabase SQL Editor

**"Port already in use"**
→ Kill process on port 8081 or use different port

## Need Help?

- Check [Troubleshooting Guide](../Technical-Reference/Troubleshooting.md)
- Review [Installation Guide](Installation-and-Setup.md)
- See [Supabase Setup](Supabase-Setup.md)

---

**Ready to develop?** Check out the [Developer Guide](../Development/Developer-Guide.md)!
