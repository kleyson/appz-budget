# Planning & Progress Documentation

## Current Status

### ✅ Completed

#### Configuration
- ✅ EAS project initialized (ID: c47f2934-eb98-4f91-8860-6da630dc22cf)
- ✅ Privacy policy URL configured
- ✅ Support URL configured (GitHub Issues)
- ✅ Apple ID added to eas.json
- ✅ Apple Team ID: `JQ56AD9KGG`
- ✅ App Store Connect App ID: `6755663664`
- ✅ App created in App Store Connect
- ✅ eas.json configured

#### Assets
- ✅ All app icons updated based on favicon
- ✅ iOS icon: 1024x1024px, RGB (no transparency)
- ✅ Android adaptive icon: 1024x1024px, RGBA
- ✅ Splash icon: 1024x1024px, RGB

#### Documentation
- ✅ Privacy Policy template created
- ✅ Setup instructions created
- ✅ Store submission guide created
- ✅ Quick checklist created
- ✅ Apple setup guides created

## 🔄 Next Steps (In Order)

### Immediate (Required for Submission)

1. **Build iOS Production Version**
   ```bash
   cd mobile
   eas build --platform ios --profile production
   ```
   - Takes 15-20 minutes
   - Build will automatically be uploaded to App Store Connect

2. **Create Screenshots** (While Building)
   - **iOS Required Screenshots:**
     - iPhone 6.7" (1290 x 2796px)
     - iPhone 6.5" (1242 x 2688px)
     - iPad Pro 12.9" (2048 x 2732px)
   - **How to create:**
     - Run app in iOS Simulator
     - Navigate through key screens
     - Take screenshots (Cmd+S in Simulator)
     - Resize to required dimensions

3. **Fill App Store Connect Listing**
   - Go to https://appstoreconnect.apple.com → Your App → App Information
   - Fill in:
     - [ ] Subtitle (30 chars max)
     - [ ] Category: Finance
     - [ ] Age rating questionnaire
     - [ ] Description (4000 chars max) - See APPLE_STORE_QUICK_REFERENCE.md
     - [ ] Keywords (100 chars max)
     - [ ] Promotional Text (170 chars, optional)
     - [ ] Screenshots (upload for each device size)
     - [ ] App Icon (already have ✅)

4. **Test via TestFlight**
   - After build completes and is uploaded
   - Go to App Store Connect → Your App → TestFlight
   - Add internal testers
   - Test thoroughly on real devices

5. **Submit for Review**
   ```bash
   eas submit --platform ios --profile production
   ```
   - Or submit manually through App Store Connect
   - Review process: 24-48 hours

### Android Submission (After iOS)

6. **Set Up Google Play Console**
   - Create app in Google Play Console
   - Fill in store listing information
   - Complete content rating questionnaire

7. **Create Google Play Service Account**
   - Go to Google Cloud Console
   - Create service account
   - Enable "Google Play Android Developer API"
   - Download JSON key file
   - Link service account in Google Play Console with "Release Manager" role
   - Update `eas.json` with service account key path

8. **Build Android Production Version**
   ```bash
   eas build --platform android --profile production
   ```

9. **Create Android Screenshots**
   - Phone screenshots (minimum 2, recommended 8+)
   - Tablet screenshots (7" and 10")
   - Feature graphic: 1024x500px

10. **Submit Android to Google Play**
    ```bash
    eas submit --platform android --profile production
    ```

## 📋 Submission Checklist

### iOS (Apple App Store)

- [x] EAS project initialized
- [x] Privacy policy URL configured
- [x] Support URL configured
- [x] Apple ID added
- [x] Apple Team ID configured
- [x] App Store Connect app created
- [x] App Store Connect App ID configured
- [ ] iOS production build completed
- [ ] Screenshots created and uploaded
- [ ] App Store listing filled out
- [ ] Tested via TestFlight
- [ ] Submitted for review

### Android (Google Play)

- [ ] Google Play Console app created
- [ ] Google Play service account created
- [ ] Service account key path added to eas.json
- [ ] Android production build completed
- [ ] Screenshots created and uploaded
- [ ] Feature graphic created
- [ ] Store listing filled out
- [ ] Tested via internal testing
- [ ] Submitted for review

## 🎯 Priority Order

1. **Build iOS app** (15-20 min, can do other things while waiting)
2. **Create screenshots** (30-60 min)
3. **Fill App Store listing** (20-30 min)
4. **Test via TestFlight** (varies)
5. **Submit for review** (5 min)
6. **Set up Android** (after iOS is submitted)
7. **Build and submit Android** (similar process)

## 📝 Files to Update

### app.json
- [x] Bundle identifier: `wtf.appz.budget` ✅
- [x] Privacy policy URL ✅
- [x] Support URL ✅
- [x] App name: "Appz Budget" ✅

### eas.json
- [x] Apple ID added ✅
- [x] Apple Team ID added ✅
- [x] App Store Connect App ID added ✅
- [ ] Google Play service account key path (for Android)

## 💡 Pro Tips

- **Screenshots are critical** - they're the first thing users see
- **Description matters** - make it compelling and clear
- **Test thoroughly** - catch issues before Apple/Google reviews
- **Be patient** - review process can take time
- **Respond quickly** - if reviewers ask questions, respond promptly

## 📊 Progress Summary

### Configuration: 95% Complete
- ✅ EAS setup
- ✅ Apple credentials
- ✅ Privacy policy
- ✅ Support URL
- ⚠️ Android service account (pending)

### Assets: 50% Complete
- ✅ Icons ready
- ❌ Screenshots needed
- ❌ Feature graphic needed (Android)

### Documentation: 100% Complete
- ✅ All guides created
- ✅ Checklists ready
- ✅ Submission info prepared

### Builds: 0% Complete
- ❌ iOS build not started
- ❌ Android build not started

### Store Listings: 30% Complete
- ✅ App created in App Store Connect
- ❌ Listing information incomplete
- ❌ Screenshots not uploaded
- ❌ Android app not created

## 🚀 Ready When

You'll be ready to build when:
1. ✅ EAS project initialized ✅
2. ✅ Privacy policy URL added ✅
3. ✅ Support URL added ✅
4. ✅ Developer accounts ready ✅
5. ✅ eas.json credentials added ✅

**You're ready to build now!** 🎉

## Next Actions

1. **Start iOS build**: `eas build --platform ios --profile production`
2. **While building**: Create screenshots
3. **After build**: Fill App Store listing
4. **Test**: Use TestFlight
5. **Submit**: `eas submit --platform ios --profile production`

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)

## Notes

- Demo server available at `https://budget.appz.wtf/` for testing
- Demo credentials: `admin@email.com` / `admin1`
- All documentation is in the `docs/` directory
- See individual guide files for detailed instructions

