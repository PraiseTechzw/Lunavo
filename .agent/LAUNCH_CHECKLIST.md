# 🚀 Launch Checklist - PEACE Platform

## Pre-Launch Setup

### 1. EAS & Expo Setup
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Verify project: `eas project:info`
- [ ] Configure builds: `eas build:configure` (already done)

### 2. GitHub Repository
- [ ] Push code to GitHub
- [ ] Verify all workflows are in `.github/workflows/`
- [ ] Check `.gitignore` includes sensitive files

### 3. GitHub Secrets
Add these in **Settings → Secrets and variables → Actions → New repository secret**:

- [ ] `EXPO_TOKEN` - From `eas whoami` or Expo dashboard
- [ ] `SUPABASE_PROJECT_REF` - From Supabase project settings
- [ ] `SUPABASE_ACCESS_TOKEN` - From Supabase account settings
- [ ] `SUPABASE_DB_PASSWORD` - Your database password
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` (for Android) - Base64 encoded JSON

### 4. iOS Setup (Apple Developer)
- [ ] Create app in App Store Connect
- [ ] Note Apple ID, ASC App ID, Team ID
- [ ] Update `eas.json` with your Apple credentials
- [ ] Generate credentials: `eas credentials -p ios`
- [ ] Create provisioning profiles
- [ ] Add privacy policy URL
- [ ] Add terms of service URL

### 5. Android Setup (Google Play)
- [ ] Create app in Google Play Console
- [ ] Create service account in Google Cloud
- [ ] Download service account JSON
- [ ] Add service account to Play Console
- [ ] Grant "Release Manager" permissions
- [ ] Store JSON as GitHub secret or local file
- [ ] Create app signing key: `eas credentials -p android`

### 6. Database Setup
- [ ] Verify all migrations are in `supabase/migrations/`
- [ ] Run migrations: `supabase db push` or via GitHub Actions
- [ ] Verify tables exist:
  - [ ] `user_points`
  - [ ] `points_transactions`
  - [ ] `user_badges`
  - [ ] `streaks`
  - [ ] `support_sessions`
  - [ ] `support_messages`
  - [ ] `check_ins`
- [ ] Verify RLS policies are enabled
- [ ] Test database access with test user

### 7. App Configuration
- [ ] Update `app.json`:
  - [ ] App name
  - [ ] Version number (1.0.0)
  - [ ] Bundle identifier (iOS)
  - [ ] Package name (Android)
  - [ ] Privacy descriptions
- [ ] Verify `eas.json` profiles
- [ ] Check environment variables in `.env`

---

## Testing Phase

### 8. Local Testing
- [ ] Run app locally: `npm start`
- [ ] Test all features:
  - [ ] User registration/login
  - [ ] Daily check-in (verify points awarded)
  - [ ] Create post (verify points awarded)
  - [ ] Reply to post (verify points awarded)
  - [ ] Chat messaging
  - [ ] Profile screen (points, badges, streaks)
  - [ ] Rewards screen (leaderboard, history)
- [ ] Test on physical devices (iOS & Android)
- [ ] Verify no console errors

### 9. Development Build
- [ ] Run: `eas build --profile development --platform all`
- [ ] Wait for build to complete
- [ ] Install on test devices
- [ ] Test all features on real builds
- [ ] Verify points system works
- [ ] Test chat real-time updates
- [ ] Check badge auto-awards

### 10. Preview Build
- [ ] Push to `staging` branch or create PR to `main`
- [ ] Verify GitHub Action triggers
- [ ] Wait for build completion
- [ ] Share with stakeholders via TestFlight/Internal Track
- [ ] Collect feedback
- [ ] Fix any issues

---

## Production Preparation

### 11. Store Listings
**App Store (iOS)**
- [ ] App name
- [ ] Subtitle
- [ ] Description (4000 chars max)
- [ ] Keywords
- [ ] Screenshots (6.5", 5.5", 12.9" iPad)
- [ ] App icon (1024x1024)
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Age rating
- [ ] Category (Health & Fitness / Medical)

**Google Play (Android)**
- [ ] App name
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Screenshots (phone, tablet, 7")
- [ ] Feature graphic (1024x500)
- [ ] App icon (512x512)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Category (Health & Fitness)
- [ ] Target audience

### 12. Legal & Compliance
- [ ] Privacy policy created and hosted
- [ ] Terms of service created and hosted
- [ ] Data handling disclosure
- [ ] GDPR compliance (if applicable)
- [ ] COPPA compliance (if under 13)
- [ ] University approval/partnership agreement
- [ ] Mental health disclaimer
- [ ] Crisis resources clearly visible

### 13. Assets
- [ ] App icon (iOS: 1024x1024, Android: 512x512)
- [ ] Splash screen
- [ ] Screenshots for all device sizes
- [ ] Feature graphic (Android)
- [ ] Promotional images
- [ ] App preview video (optional but recommended)

---

## Launch

### 14. Production Build
- [ ] Update version in `app.json` to 1.0.0
- [ ] Commit: `git commit -m "chore: release v1.0.0"`
- [ ] Create tag: `git tag v1.0.0`
- [ ] Push: `git push origin main --tags`
- [ ] Verify GitHub Action triggers production build
- [ ] Monitor build progress in EAS dashboard
- [ ] Wait for build completion (~20-30 minutes)

### 15. Store Submission
**Automatic (via GitHub Actions)**
- [ ] Verify auto-submit completed
- [ ] Check TestFlight for iOS build
- [ ] Check Google Play Internal Track for Android

**Manual (if needed)**
- [ ] Run: `eas submit --platform ios --latest`
- [ ] Run: `eas submit --platform android --latest`

### 16. Store Review
**iOS (App Store)**
- [ ] Complete App Store Connect listing
- [ ] Submit for review
- [ ] Respond to any reviewer questions
- [ ] Wait for approval (1-3 days typically)
- [ ] Release to App Store

**Android (Google Play)**
- [ ] Complete Play Console listing
- [ ] Submit for review
- [ ] Respond to any reviewer questions
- [ ] Wait for approval (hours to days)
- [ ] Promote from Internal → Alpha → Beta → Production

---

## Post-Launch

### 17. Monitoring
- [ ] Set up crash reporting (Sentry recommended)
- [ ] Monitor EAS dashboard for updates
- [ ] Check Supabase dashboard for database health
- [ ] Review GitHub Actions for failed workflows
- [ ] Monitor store reviews and ratings
- [ ] Track user acquisition metrics

### 18. User Support
- [ ] Set up support email
- [ ] Create FAQ page
- [ ] Monitor in-app feedback
- [ ] Respond to reviews
- [ ] Track common issues

### 19. Maintenance
- [ ] Schedule regular dependency updates
- [ ] Plan OTA updates for bug fixes
- [ ] Monitor security advisories
- [ ] Review and optimize database queries
- [ ] Adjust gamification point values based on usage

### 20. Marketing
- [ ] Create social media accounts
- [ ] Design promotional materials
- [ ] Plan launch announcement
- [ ] Reach out to university administration
- [ ] Create demo video
- [ ] Write blog post/press release
- [ ] Engage with student organizations

---

## Emergency Procedures

### If Build Fails
1. Check build logs: `eas build:view [build-id]`
2. Clear cache: `eas build --clear-cache`
3. Verify credentials: `eas credentials`
4. Check GitHub Actions logs
5. Review recent code changes

### If OTA Update Fails
1. Check update logs: `eas update:list`
2. Verify branch configuration
3. Rollback: `eas update --branch production --republish [previous-id]`

### If App Crashes in Production
1. Check crash reports in store consoles
2. Review Sentry/error logs (if integrated)
3. Identify affected version
4. Fix bug locally
5. Push OTA update (if JavaScript)
6. Or submit new build (if native code)

### If Database Issues
1. Check Supabase dashboard
2. Review RLS policies
3. Check migration status
4. Verify API keys
5. Contact Supabase support if needed

---

## Success Metrics

Track these KPIs:
- [ ] Daily Active Users (DAU)
- [ ] Monthly Active Users (MAU)
- [ ] User retention (Day 1, Day 7, Day 30)
- [ ] Check-in completion rate
- [ ] Average points per user
- [ ] Badge earn rate
- [ ] Chat session duration
- [ ] Post/reply engagement
- [ ] App store rating
- [ ] Crash-free rate (target: >99%)

---

## Continuous Improvement

### Weekly
- [ ] Review analytics
- [ ] Check for crashes
- [ ] Monitor user feedback
- [ ] Plan bug fixes

### Monthly
- [ ] Update dependencies
- [ ] Security audit
- [ ] Review gamification balance
- [ ] Plan new features

### Quarterly
- [ ] Major feature releases
- [ ] Database optimization
- [ ] Performance review
- [ ] User surveys

---

## 🎉 Launch Day Checklist

**Morning of Launch:**
- [ ] Final build verification
- [ ] All store listings complete
- [ ] Support channels ready
- [ ] Team briefed
- [ ] Monitoring tools active

**During Launch:**
- [ ] Submit to stores
- [ ] Announce on social media
- [ ] Send email to university
- [ ] Monitor for issues
- [ ] Respond to early feedback

**End of Day:**
- [ ] Review metrics
- [ ] Address critical issues
- [ ] Plan next day priorities
- [ ] Celebrate! 🎊

---

## Resources

- **EAS Dashboard**: https://expo.dev
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub Actions**: https://github.com/[username]/[repo]/actions
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console

---

**Good luck with your launch! You've got this! 🚀**

---

## Notes

Use this checklist to track your progress. Check off items as you complete them. Don't skip steps - each one is important for a successful launch!

**Estimated Timeline:**
- Setup: 1-2 days
- Testing: 2-3 days
- Store preparation: 1-2 days
- Review process: 1-7 days
- **Total: 1-2 weeks to launch**

**Remember:**
- Test thoroughly before submitting
- Have a rollback plan
- Monitor closely after launch
- Iterate based on feedback
- Celebrate your success!
