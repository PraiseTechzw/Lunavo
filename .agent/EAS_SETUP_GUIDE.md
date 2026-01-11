# EAS Build & CI/CD Setup Guide

## 🚀 Complete Setup Instructions

### Prerequisites
1. **Expo Account**: Create at https://expo.dev
2. **EAS CLI**: Install globally
   ```bash
   npm install -g eas-cli
   ```
3. **GitHub Repository**: Push your code to GitHub
4. **App Store Accounts**:
   - Apple Developer Account (for iOS)
   - Google Play Console Account (for Android)

---

## 📋 Step 1: EAS Configuration

### 1.1 Login to EAS
```bash
eas login
```

### 1.2 Configure Project
```bash
eas build:configure
```

### 1.3 Update Project ID
The `eas.json` and `app.json` are already configured with:
- Project ID: `9691e1c7-68a7-44b7-a1a1-4f51fd66c7b2`
- Bundle ID: `com.peaceclub.app`

---

## 🔐 Step 2: GitHub Secrets Setup

Add these secrets to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets:

1. **EXPO_TOKEN**
   ```bash
   # Generate token
   eas whoami
   eas build:configure
   # Or create at: https://expo.dev/accounts/[username]/settings/access-tokens
   ```
   Copy the token and add to GitHub secrets

2. **SUPABASE_PROJECT_REF**
   - Your Supabase project reference ID
   - Find in: Supabase Dashboard → Project Settings → General

3. **SUPABASE_ACCESS_TOKEN**
   - Generate at: Supabase Dashboard → Account → Access Tokens

4. **SUPABASE_DB_PASSWORD**
   - Your database password from Supabase setup

5. **GITHUB_TOKEN** (automatically provided by GitHub Actions)

---

## 📱 Step 3: iOS Setup (Apple)

### 3.1 App Store Connect
1. Create app at https://appstoreconnect.apple.com
2. Note your:
   - Apple ID
   - ASC App ID
   - Team ID

### 3.2 Update eas.json
Replace placeholders in `eas.json`:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

### 3.3 Generate Credentials
```bash
eas credentials
```
Follow prompts to generate:
- Distribution certificate
- Provisioning profile
- Push notification key

---

## 🤖 Step 4: Android Setup (Google Play)

### 4.1 Google Play Console
1. Create app at https://play.google.com/console
2. Create a service account:
   - Google Cloud Console → IAM & Admin → Service Accounts
   - Create key (JSON format)
   - Download as `google-service-account.json`

### 4.2 Add Service Account to Play Console
1. Google Play Console → Setup → API access
2. Link service account
3. Grant permissions: Release Manager

### 4.3 Store Service Account Key
**Option A: GitHub Secret (Recommended)**
```bash
# Convert JSON to base64
cat google-service-account.json | base64
```
Add as `GOOGLE_SERVICE_ACCOUNT_JSON` secret

**Option B: Local File**
- Place `google-service-account.json` in project root
- Add to `.gitignore`

---

## 🔄 Step 5: Workflow Triggers

### Automatic Triggers:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Development Build** | Push to `develop` | Internal testing builds |
| **Preview Build** | Push to `staging` or PR to `main` | Stakeholder review |
| **Production Build** | Push to `main` or tag `v*.*.*` | Store submission |
| **OTA Update** | Push to `main`/`develop` (app files) | Instant updates |
| **CI Quality** | Any push/PR | Code quality checks |
| **Migrations** | Push to `main` (migrations folder) | Database updates |

### Manual Triggers:
```bash
# From GitHub UI: Actions → Select workflow → Run workflow
# Or use GitHub CLI:
gh workflow run eas-build-production.yml
```

---

## 🏗️ Step 6: First Build

### Development Build (Internal Testing)
```bash
# Local
eas build --profile development --platform all

# Or push to develop branch (auto-triggers)
git checkout -b develop
git push origin develop
```

### Preview Build (Stakeholder Review)
```bash
# Local
eas build --profile preview --platform all

# Or push to staging
git checkout -b staging
git push origin staging
```

### Production Build (Store Submission)
```bash
# Local
eas build --profile production --platform all

# Or push to main
git checkout main
git push origin main
```

---

## 📲 Step 7: OTA Updates

### What are OTA Updates?
Over-the-air updates allow you to push JavaScript/asset changes instantly without store approval.

### When to Use:
- ✅ Bug fixes
- ✅ UI tweaks
- ✅ Content updates
- ❌ Native code changes (requires new build)

### Trigger OTA Update:
```bash
# Automatic: Push changes to main/develop
git add .
git commit -m "fix: update gamification points"
git push origin main

# Manual:
eas update --branch production --message "Bug fixes"
```

---

## 🔍 Step 8: Monitoring & Debugging

### View Build Status:
```bash
# CLI
eas build:list

# Web Dashboard
https://expo.dev/accounts/[username]/projects/peace-app/builds
```

### View Update Status:
```bash
eas update:list
```

### Check Logs:
```bash
# Build logs
eas build:view [build-id]

# Runtime logs (with Sentry integration)
```

---

## 🎯 Step 9: Store Submission

### Automatic Submission (via GitHub Actions):
1. Push to `main` branch
2. Workflow builds and submits automatically
3. Check store dashboards for review status

### Manual Submission:
```bash
# Android (Google Play Internal Track)
eas submit --platform android --latest

# iOS (TestFlight)
eas submit --platform ios --latest
```

---

## 📊 Step 10: Release Process

### Recommended Flow:

1. **Development** (`develop` branch)
   - Daily development
   - Internal testing
   - Continuous OTA updates

2. **Staging** (`staging` branch)
   - Pre-release testing
   - Stakeholder review
   - QA validation

3. **Production** (`main` branch)
   - Stable releases
   - Store submissions
   - Tagged versions (`v1.0.0`)

### Version Bump:
```bash
# Update version in app.json
{
  "expo": {
    "version": "1.1.0"  # Semantic versioning
  }
}

# Create git tag
git tag v1.1.0
git push origin v1.1.0  # Triggers production build + GitHub release
```

---

## 🛠️ Troubleshooting

### Build Fails:
```bash
# Check build logs
eas build:view [build-id]

# Common fixes:
- Clear cache: eas build --clear-cache
- Update dependencies: npm update
- Check credentials: eas credentials
```

### OTA Update Not Appearing:
```bash
# Verify update was published
eas update:list

# Check app is configured for updates
# Ensure runtimeVersion matches in app.json
```

### GitHub Action Fails:
1. Check secrets are set correctly
2. Verify EXPO_TOKEN is valid
3. Review workflow logs in GitHub Actions tab

---

## 📚 Additional Resources

- **EAS Documentation**: https://docs.expo.dev/eas/
- **GitHub Actions**: https://docs.github.com/actions
- **Expo Updates**: https://docs.expo.dev/eas-update/introduction/
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Google Play Policies**: https://play.google.com/about/developer-content-policy/

---

## ✅ Verification Checklist

Before going live:

- [ ] EAS project configured (`eas build:configure`)
- [ ] GitHub secrets added (EXPO_TOKEN, etc.)
- [ ] iOS credentials generated
- [ ] Android service account configured
- [ ] Test build completed successfully
- [ ] OTA update tested
- [ ] Store listings created
- [ ] Privacy policy URL added
- [ ] Terms of service URL added
- [ ] App icons and splash screens finalized
- [ ] All workflows tested
- [ ] Database migrations automated
- [ ] Monitoring/analytics integrated

---

## 🎉 You're Ready!

Your PEACE Platform now has:
- ✅ Automated builds for all platforms
- ✅ Continuous integration & deployment
- ✅ Over-the-air updates
- ✅ Automated store submissions
- ✅ Database migration automation
- ✅ Code quality checks
- ✅ Security audits

**Next Steps:**
1. Complete the setup checklist above
2. Run your first build
3. Test the OTA update flow
4. Submit to stores for review

Good luck with your launch! 🚀
