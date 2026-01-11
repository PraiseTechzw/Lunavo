# EAS Build Commands - Quick Reference

## 🚀 Build Commands

### Development Builds
```bash
# Build for both platforms
eas build --profile development --platform all

# Android only
eas build --profile development --platform android

# iOS only
eas build --profile development --platform ios

# With cache clear
eas build --profile development --platform all --clear-cache
```

### Preview Builds
```bash
# Build for testing/review
eas build --profile preview --platform all

# Non-interactive (for CI/CD)
eas build --profile preview --platform all --non-interactive
```

### Production Builds
```bash
# Build for store submission
eas build --profile production --platform all

# Android AAB (Google Play)
eas build --profile production --platform android

# iOS (App Store)
eas build --profile production --platform ios

# Android APK (direct distribution)
eas build --profile production-apk --platform android
```

---

## 📲 Submit Commands

### Android
```bash
# Submit latest build to Google Play
eas submit --platform android --latest

# Submit specific build
eas submit --platform android --id [build-id]

# With profile
eas submit --platform android --profile production --latest
```

### iOS
```bash
# Submit to TestFlight
eas submit --platform ios --latest

# Submit specific build
eas submit --platform ios --id [build-id]
```

---

## 🔄 Update Commands (OTA)

### Publish Updates
```bash
# Production channel
eas update --branch production --message "Bug fixes and improvements"

# Preview channel
eas update --branch preview --message "Testing new features"

# Development channel
eas update --branch development --message "Development update"
```

### View Updates
```bash
# List all updates
eas update:list

# View specific update
eas update:view [update-id]

# Delete update
eas update:delete [update-id]
```

---

## 📊 Status & Monitoring

### Build Status
```bash
# List all builds
eas build:list

# View specific build
eas build:view [build-id]

# View build logs
eas build:view [build-id] --logs

# Cancel build
eas build:cancel [build-id]
```

### Project Info
```bash
# Show project info
eas project:info

# Show current user
eas whoami

# Show credentials
eas credentials
```

---

## 🔐 Credentials Management

### iOS
```bash
# Manage iOS credentials
eas credentials -p ios

# Generate new credentials
eas credentials -p ios --generate

# Remove credentials
eas credentials -p ios --remove
```

### Android
```bash
# Manage Android credentials
eas credentials -p android

# Generate keystore
eas credentials -p android --generate-keystore
```

---

## ⚙️ Configuration

### Initialize EAS
```bash
# Configure EAS for project
eas build:configure

# Link to existing project
eas init

# Update project
eas project:init
```

### Metadata
```bash
# Configure app store metadata
eas metadata:push

# Pull metadata
eas metadata:pull
```

---

## 🔍 Debugging

### Local Builds
```bash
# Build locally (requires setup)
eas build --local

# Build with verbose logging
eas build --profile development --platform android --verbose
```

### Diagnostics
```bash
# Check project configuration
eas config

# Validate eas.json
eas build:inspect

# Check for issues
eas doctor
```

---

## 🌐 Channel Management

### Create Channels
```bash
# Create new update channel
eas channel:create [channel-name]

# List channels
eas channel:list

# View channel details
eas channel:view [channel-name]
```

### Branch Management
```bash
# Create branch
eas branch:create [branch-name]

# List branches
eas branch:list

# Delete branch
eas branch:delete [branch-name]
```

---

## 📝 Environment Variables

### Set Secrets
```bash
# Add secret
eas secret:create --name SECRET_NAME --value "secret-value"

# List secrets
eas secret:list

# Delete secret
eas secret:delete --name SECRET_NAME
```

---

## 🔄 GitHub Actions Integration

### Trigger Workflows
```bash
# Using GitHub CLI
gh workflow run eas-build-production.yml

# With inputs
gh workflow run eas-build-production.yml -f platform=android

# View workflow runs
gh run list --workflow=eas-build-production.yml
```

---

## 📦 Common Workflows

### Full Release Process
```bash
# 1. Update version in app.json
# 2. Commit changes
git add .
git commit -m "chore: bump version to 1.1.0"

# 3. Create tag
git tag v1.1.0

# 4. Push (triggers production build)
git push origin main --tags

# 5. Monitor build
eas build:list

# 6. Once complete, submit
eas submit --platform all --latest
```

### Quick Bug Fix (OTA)
```bash
# 1. Fix bug
# 2. Commit
git add .
git commit -m "fix: resolve login issue"

# 3. Push (triggers OTA update)
git push origin main

# 4. Verify update
eas update:list
```

### Preview for Stakeholders
```bash
# 1. Create preview build
eas build --profile preview --platform all

# 2. Share link from EAS dashboard
# 3. Stakeholders install via Expo Go or direct link
```

---

## 🎯 Pro Tips

### Speed Up Builds
```bash
# Use --no-wait to queue build and continue working
eas build --profile production --platform all --no-wait

# Build only what changed
eas build --profile development --platform android --auto-submit
```

### Testing
```bash
# Install development build on device
eas build:run -p android

# Install on iOS simulator
eas build:run -p ios
```

### Cleanup
```bash
# Clear build cache
eas build --clear-cache

# Remove old builds (manual via dashboard)
```

---

## 📱 Device Testing

### Android
```bash
# Download and install APK
adb install path/to/app.apk

# Or use EAS
eas build:run -p android
```

### iOS
```bash
# Install on simulator
eas build:run -p ios

# TestFlight for physical devices
eas submit -p ios --latest
```

---

## 🆘 Emergency Commands

### Rollback OTA Update
```bash
# Publish previous version
eas update --branch production --message "Rollback" --republish [previous-update-id]
```

### Cancel Stuck Build
```bash
# Find build ID
eas build:list

# Cancel it
eas build:cancel [build-id]
```

### Force Rebuild
```bash
# Clear everything and rebuild
eas build --profile production --platform all --clear-cache --no-cache
```

---

## 📚 Help & Documentation

```bash
# Get help for any command
eas build --help
eas submit --help
eas update --help

# View all commands
eas --help

# Check version
eas --version
```

---

## 🔗 Useful Links

- **EAS Dashboard**: https://expo.dev/accounts/[username]/projects/peace-app
- **Build Queue**: https://expo.dev/accounts/[username]/projects/peace-app/builds
- **Updates**: https://expo.dev/accounts/[username]/projects/peace-app/updates
- **Credentials**: https://expo.dev/accounts/[username]/projects/peace-app/credentials

---

**Save this file for quick reference during development!**
