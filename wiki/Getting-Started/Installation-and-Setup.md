# Installation and Setup

This guide will help you set up the Lunavo development environment from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Expo CLI** - Will be installed globally
- **Code Editor** - VS Code recommended
- **Mobile Device** (optional) - For testing on physical device
  - iOS: Requires macOS and Xcode
  - Android: Requires Android Studio

## Step 1: Clone the Repository

```bash
git clone https://github.com/PraiseTechzw/Lunavo.git
cd Lunavo
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React Native and Expo
- Supabase client
- Navigation libraries
- UI components
- And more...

## Step 3: Set Up Environment Variables

1. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

2. Add your Supabase credentials (see [Supabase Setup](Supabase-Setup.md)):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_ENVIRONMENT=development
```

**Important**: Never commit the `.env` file to version control. It's already in `.gitignore`.

## Step 4: Set Up Supabase

Follow the [Supabase Setup Guide](Supabase-Setup.md) to:
- Create a Supabase project
- Run database migrations
- Configure authentication
- Set up Row Level Security (RLS) policies

## Step 5: Start the Development Server

```bash
npm start
```

This will start the Expo development server. You'll see a QR code and options to:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Press `w` to open in web browser
- Scan QR code with Expo Go app on your phone

## Step 6: Run on Specific Platform

### Web
```bash
npm run web
```

### Android
```bash
npm run android
```

### iOS (macOS only)
```bash
npm run ios
```

## Project Structure

```
Lunavo/
├── app/                    # Application screens and routes
│   ├── (tabs)/            # Tab navigation screens
│   ├── admin/             # Admin screens
│   ├── auth/              # Authentication screens
│   ├── components/        # Reusable components
│   └── ...
├── lib/                    # Core libraries and utilities
│   ├── auth.ts            # Authentication functions
│   ├── database.ts        # Database operations
│   ├── supabase.ts        # Supabase client
│   └── ...
├── hooks/                  # Custom React hooks
├── supabase/              # Database migrations
│   └── migrations/        # SQL migration files
├── assets/                # Images and static assets
├── wiki/                  # Documentation
└── package.json           # Dependencies and scripts
```

## Development Tools

### VS Code Extensions (Recommended)

Install these extensions for better development experience:

- **ES7+ React/Redux/React-Native snippets**
- **TypeScript and JavaScript Language Features**
- **ESLint**
- **Prettier**
- **Expo Tools**

The project includes `.vscode/extensions.json` with recommended extensions.

### Debugging

- **React Native Debugger**: Use Chrome DevTools for debugging
- **Expo DevTools**: Built-in debugging tools
- **Flipper**: Advanced debugging (optional)

## Common Issues

### Issue: "Missing Supabase environment variables"

**Solution**: 
- Ensure `.env` file exists in root directory
- Restart Expo dev server after creating `.env`
- Variable names must start with `EXPO_PUBLIC_`

### Issue: "Module not found"

**Solution**:
```bash
npm install
# Or
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Metro bundler cache issues"

**Solution**:
```bash
npm start -- --clear
```

### Issue: "Port already in use"

**Solution**: Kill the process using port 8081:
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8081 | xargs kill
```

## Next Steps

1. ✅ Complete [Supabase Setup](Supabase-Setup.md)
2. ✅ Review [Developer Guide](../Development/Developer-Guide.md)
3. ✅ Understand [Architecture](../Development/Architecture.md)
4. ✅ Check [Implementation Status](../Implementation-Status/Current-Status.md)

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Need Help?** Check the [Troubleshooting Guide](../Technical-Reference/Troubleshooting.md) or review the [Developer Guide](../Development/Developer-Guide.md).
