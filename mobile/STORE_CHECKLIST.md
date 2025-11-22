# Quick Store Submission Checklist

## Before You Start

- [ ] Sign up for Expo account at [expo.dev](https://expo.dev)
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Get Apple Developer account ($99/year) for iOS
- [ ] Get Google Play Developer account ($25 one-time) for Android

## Configuration Steps

### 1. Update app.json
- [ ] Verify iOS bundle identifier is `wtf.appz.budget` (already configured)
- [ ] Verify Android package name is `wtf.appz.budget` (already configured)
- [ ] Add privacy policy URL (REQUIRED for both stores)
- [ ] Add support/contact URL
- [ ] Verify app name: "Appz Budget"
- [ ] Verify description is appropriate

### 2. Set up EAS
```bash
cd mobile
eas build:configure
```
- [ ] Project ID added to app.json
- [ ] eas.json created and configured

### 3. Update eas.json
- [ ] Add your Apple ID email
- [ ] Add your Apple Team ID
- [ ] Add path to Google Play service account JSON key

## Assets to Prepare

### iOS (Apple App Store)
- [ ] App Icon: 1024x1024px PNG (no transparency)
- [ ] Screenshots for iPhone 6.7" (1290 x 2796px)
- [ ] Screenshots for iPhone 6.5" (1242 x 2688px)
- [ ] Screenshots for iPad Pro 12.9" (2048 x 2732px)
- [ ] App Preview video (optional)

### Android (Google Play)
- [ ] App Icon: 512x512px PNG
- [ ] Feature Graphic: 1024x500px PNG
- [ ] Phone screenshots (minimum 2, recommended 8+)
- [ ] Tablet screenshots (7" and 10")

## Privacy Policy
- [ ] Create privacy policy page
- [ ] Add URL to app.json
- [ ] Policy covers: data collection, usage, storage, security, user rights

## Build & Test

### Build Production Versions
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

- [ ] iOS build completed successfully
- [ ] Android build completed successfully

### Test Before Submission
- [ ] Test on iOS device via TestFlight
- [ ] Test on Android device via internal testing
- [ ] All features working correctly
- [ ] No crashes or critical bugs

## Store Listings

### Apple App Store Connect
- [ ] App created in App Store Connect
- [ ] All required fields filled:
  - [ ] App name
  - [ ] Subtitle (30 chars max)
  - [ ] Category: Finance
  - [ ] Age rating completed
  - [ ] Privacy policy URL
  - [ ] Support URL
  - [ ] Description (4000 chars max)
  - [ ] Keywords (100 chars max)
  - [ ] Screenshots uploaded
  - [ ] App icon uploaded
- [ ] App Store Connect App ID noted

### Google Play Console
- [ ] App created in Google Play Console
- [ ] All required fields filled:
  - [ ] App name
  - [ ] Short description (80 chars max)
  - [ ] Full description (4000 chars max)
  - [ ] Category: Finance
  - [ ] Content rating completed
  - [ ] Privacy policy URL
  - [ ] App icon uploaded
  - [ ] Feature graphic uploaded
  - [ ] Screenshots uploaded (min 2)
- [ ] Service account set up with Release Manager role

## Submission

### iOS Submission
```bash
eas submit --platform ios --profile production
```
- [ ] Build submitted to App Store Connect
- [ ] App status: "Waiting for Review"
- [ ] Monitor for review status updates

### Android Submission
```bash
eas submit --platform android --profile production
```
- [ ] Build submitted to Google Play Console
- [ ] App status: "In Review" or "Pending Publication"
- [ ] Monitor for review status updates

## Post-Submission

- [ ] Respond to any review feedback
- [ ] Monitor app analytics
- [ ] Respond to user reviews
- [ ] Plan for updates and bug fixes

## Version Updates (Future)

When updating the app:
1. Update `version` in app.json
2. Increment iOS `buildNumber`
3. Increment Android `versionCode`
4. Build new versions
5. Submit updates

---

**Need Help?** See [STORE_SUBMISSION.md](./STORE_SUBMISSION.md) for detailed instructions.

