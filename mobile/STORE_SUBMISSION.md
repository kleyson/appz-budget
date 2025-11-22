# Store Submission Guide for Appz Budget

This guide will help you prepare and submit the Appz Budget mobile app to the Apple App Store and Google Play Store.

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: Install globally with `npm install -g eas-cli`
3. **Apple Developer Account**: Required for iOS submission ($99/year)
4. **Google Play Developer Account**: Required for Android submission ($25 one-time)

## Initial Setup

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

### 3. Configure EAS Project

```bash
cd mobile
eas build:configure
```

This will:
- Create an EAS project (if not already created)
- Update `app.json` with your project ID
- Set up the build configuration

### 4. Update app.json

Before building, make sure to update the following in `app.json`:

- **iOS Bundle Identifier**: Currently set to `wtf.appz.budget` (already configured)
- **Android Package Name**: Currently set to `wtf.appz.budget` (already configured)
- **Privacy Policy URL**: Add your privacy policy URL (required for both stores)
- **Support URL**: Add your support/contact URL

### 5. Update eas.json

Edit `eas.json` and update:
- **Apple ID**: Your Apple Developer account email
- **Apple Team ID**: Your Apple Developer Team ID (found in Apple Developer portal)
- **Android Service Account**: Path to your Google Play service account JSON key

## Building for Production

### iOS Build

```bash
eas build --platform ios --profile production
```

This will:
- Build the iOS app
- Generate an `.ipa` file
- Upload it to EAS servers

### Android Build

```bash
eas build --platform android --profile production
```

This will:
- Build the Android app
- Generate an `.aab` (Android App Bundle) file
- Upload it to EAS servers

## App Store Submission Checklist

### iOS (Apple App Store)

#### Required Information:
- [ ] App Name: "Appz Budget"
- [ ] Subtitle: Short description (30 characters max)
- [ ] Category: Finance
- [ ] Age Rating: Complete questionnaire
- [ ] Privacy Policy URL: Required
- [ ] Support URL: Required
- [ ] App Icon: 1024x1024px PNG (no transparency)
- [ ] Screenshots: Required for iPhone and iPad
  - iPhone 6.7" (1290 x 2796 pixels)
  - iPhone 6.5" (1242 x 2688 pixels)
  - iPad Pro 12.9" (2048 x 2732 pixels)
- [ ] App Preview Video (optional but recommended)
- [ ] Description: Up to 4000 characters
- [ ] Keywords: Up to 100 characters
- [ ] Promotional Text: Up to 170 characters (optional)
- [ ] What's New: Release notes for updates

#### Submission Steps:

1. **Create App in App Store Connect**:
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create a new app
   - Fill in all required information
   - Note your App Store Connect App ID

2. **Update eas.json**:
   - Add your `ascAppId` to the submit configuration

3. **Submit via EAS**:
   ```bash
   eas submit --platform ios --profile production
   ```

   Or manually:
   - Download the `.ipa` from EAS
   - Upload via Transporter app or App Store Connect

### Android (Google Play Store)

#### Required Information:
- [ ] App Name: "Appz Budget"
- [ ] Short Description: 80 characters max
- [ ] Full Description: 4000 characters max
- [ ] Category: Finance
- [ ] Content Rating: Complete questionnaire
- [ ] Privacy Policy URL: Required
- [ ] App Icon: 512x512px PNG
- [ ] Feature Graphic: 1024x500px PNG
- [ ] Screenshots: At least 2 required
  - Phone: 16:9 or 9:16 aspect ratio, min 320px, max 3840px
  - Tablet (7"): 16:9 or 9:16 aspect ratio
  - Tablet (10"): 16:9 or 9:16 aspect ratio

#### Submission Steps:

1. **Create App in Google Play Console**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Create a new app
   - Fill in store listing information
   - Complete content rating questionnaire

2. **Set up Service Account**:
   - Go to Google Cloud Console
   - Create a service account
   - Download JSON key
   - Add it to Google Play Console with "Release Manager" role
   - Save the path in `eas.json`

3. **Submit via EAS**:
   ```bash
   eas submit --platform android --profile production
   ```

   Or manually:
   - Download the `.aab` from EAS
   - Upload via Google Play Console

## Asset Requirements

### iOS Assets Needed:
- App Icon: 1024x1024px (PNG, no transparency)
- Screenshots for all required device sizes
- App Preview videos (optional)

### Android Assets Needed:
- App Icon: 512x512px (PNG)
- Feature Graphic: 1024x500px (PNG)
- Screenshots: Minimum 2, recommended 8+
- Phone screenshots: 16:9 or 9:16
- Tablet screenshots: 16:9 or 9:16

## Privacy Policy

You **must** have a privacy policy URL before submitting. The policy should cover:
- What data is collected
- How data is used
- Data storage and security
- Third-party services (if any)
- User rights

Example locations for privacy policy:
- Your website
- GitHub Pages
- Privacy policy generator services

## Testing Before Submission

### Test on Real Devices:
```bash
# Build preview version
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Install on devices via TestFlight (iOS) or direct install (Android)
```

### TestFlight (iOS):
1. Upload build to App Store Connect
2. Add internal/external testers
3. Test thoroughly before production release

### Internal Testing (Android):
1. Upload to Google Play Console
2. Create internal testing track
3. Add testers
4. Test thoroughly before production release

## Version Management

### Updating Version Numbers:

1. **app.json**:
   - `version`: User-facing version (e.g., "1.0.0")
   - iOS `buildNumber`: Increment for each build
   - Android `versionCode`: Increment for each build

2. **After each update**:
   ```bash
   # Update version in app.json, then:
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

## Common Issues

### iOS:
- **Missing Privacy Policy**: Required for submission
- **Missing Screenshots**: Required for all device sizes
- **Invalid Bundle ID**: Must be unique and follow reverse domain format
- **Code Signing Issues**: Ensure Apple Developer account is properly configured

### Android:
- **Missing Privacy Policy**: Required for submission
- **Invalid Package Name**: Must be unique and follow reverse domain format
- **Service Account Issues**: Ensure JSON key has correct permissions
- **Content Rating**: Must complete questionnaire before release

## Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Update EAS CLI
npm install -g eas-cli@latest

# Check configuration
eas build:configure

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)

## Next Steps

1. ✅ Complete app.json configuration
2. ✅ Set up EAS project
3. ✅ Create store listings
4. ✅ Generate required assets (screenshots, icons)
5. ✅ Create privacy policy
6. ✅ Build production versions
7. ✅ Test on TestFlight/Internal Testing
8. ✅ Submit to stores
9. ✅ Monitor reviews and respond to feedback

Good luck with your submission! 🚀

