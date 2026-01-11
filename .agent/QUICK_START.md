# ⚡ Quick Start Guide - PEACE Platform

## 🚀 Get Started in 5 Minutes

### Step 1: Validate Your Setup (1 minute)
```bash
npm run validate
```

This checks:
- ✅ Environment configured
- ✅ Dependencies installed
- ✅ Database tables exist

---

### Step 2: Test Locally (2 minutes)
```bash
# Start the app
npm start

# Scan QR code with Expo Go app
# Or press 'a' for Android, 'i' for iOS
```

**Test these features:**
1. Login/Register
2. Complete a check-in → Earn 10 points
3. Check profile → See points
4. Visit /rewards → See leaderboard

---

### Step 3: First Build (Optional - 20 minutes)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --profile development --platform android
```

---

## 📋 Available Commands

### Testing
```bash
npm run validate          # Run all checks
npm run preflight         # Check environment
npm run test:db          # Validate database
npm run test:gamification # Test points/badges
```

### Development
```bash
npm start                # Start dev server
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run lint             # Check code quality
```

### Deployment
```bash
eas build --profile development   # Dev build
eas build --profile preview       # Preview build
eas build --profile production    # Production build
eas submit --platform all --latest # Submit to stores
eas update --branch production    # OTA update
```

---

## 🎯 Quick Workflows

### Test Gamification
```bash
# 1. Start app
npm start

# 2. Login
# 3. Complete check-in → +10 points
# 4. Create post → +5 points
# 5. Reply to post → +10 points
# 6. Check profile → See 25 points
# 7. Visit /rewards → See history
```

### Deploy to Production
```bash
# 1. Update version in app.json
# 2. Commit changes
git add .
git commit -m "chore: release v1.0.0"

# 3. Create tag
git tag v1.0.0

# 4. Push (auto-builds & submits)
git push origin main --tags

# 5. Monitor in EAS dashboard
```

### Push OTA Update
```bash
# 1. Fix bug in JavaScript
# 2. Commit
git add .
git commit -m "fix: resolve issue"

# 3. Push (auto-updates)
git push origin main

# 4. Users get update instantly
```

---

## 📚 Documentation Quick Links

| Need | Document |
|------|----------|
| **Setup EAS** | `.agent/EAS_SETUP_GUIDE.md` |
| **Test Everything** | `.agent/TESTING_GUIDE.md` |
| **Before Launch** | `.agent/LAUNCH_CHECKLIST.md` |
| **All Features** | `.agent/COMPLETE_SUMMARY.md` |
| **Quick Commands** | `.agent/EAS_COMMANDS.md` |

---

## 🆘 Troubleshooting

### Build Fails
```bash
eas build --clear-cache
```

### Tests Fail
```bash
npm run validate
```

### Database Issues
```bash
npm run test:db
```

### Points Not Working
```bash
npm run test:gamification
```

---

## ✅ Success Checklist

- [ ] `npm run validate` passes
- [ ] App runs locally
- [ ] Check-in awards points
- [ ] Profile shows points
- [ ] Rewards screen works
- [ ] Chat messaging works

---

## 🎉 You're Ready!

**Next Steps:**
1. Test locally ✅
2. Run validation ✅
3. Build for testing
4. Share with stakeholders
5. Submit to stores

**Questions?** Check `.agent/` folder for detailed guides!

---

**Happy Building! 🚀**
