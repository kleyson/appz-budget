# Next Steps for Store Submission

## ✅ Completed
- EAS project initialized (ID: c47f2934-eb98-4f91-8860-6da630dc22cf)
- Privacy policy URL configured
- Support URL configured (GitHub Issues)
- Apple ID added to eas.json

## 🔄 Immediate Next Steps

### 1. Get Apple Team ID (Required for iOS)

You need to get your Apple Team ID from the Apple Developer portal:

**Option A: From Apple Developer Portal**
1. Go to https://developer.apple.com/account
2. Sign in with your Apple ID (kleyson@kleyson.ca)
3. Click on "Membership" in the sidebar
4. Your Team ID is displayed there (format: ABC123DEF4)

**Option B: From Xcode**
1. Open Xcode
2. Go to Xcode → Settings → Accounts
3. Select your Apple ID
4. Your Team ID is shown next to your team name

Once you have it, update `eas.json`:
```json
"appleTeamId": "YOUR_TEAM_ID_HERE"
```

### 2. Create App in App Store Connect (iOS)

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple ID
3. Click "My Apps" → "+" → "New App"
4. Fill in:
   - Platform: iOS
   - Name: Appz Budget
   - Primary Language: English
   - Bundle ID: Select `wtf.appz.budget` (you may need to register it first)
   - SKU: appz-budget-001 (or any unique identifier)
5. After creating, note the **App Store Connect App ID** (numeric ID)
6. Update `eas.json`:
   ```json
   "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID"
   ```

### 3. Set Up Google Play Console (Android)

1. Go to https://play.google.com/console
2. Sign in with your Google account
3. Click "Create app"
4. Fill in:
   - App name: Appz Budget
   - Default language: English
   - App or game: App
   - Free or paid: Free
   - Declarations: Check all that apply
5. Create the app

### 4. Create Google Play Service Account (Android)

1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "Google Play Android Developer API"
4. Go to "IAM & Admin" → "Service Accounts"
5. Click "Create Service Account"
6. Download the JSON key file
7. In Google Play Console:
   - Go to "Setup" → "API access"
   - Click "Link service account"
   - Upload the JSON key
   - Grant "Release Manager" role
8. Save the JSON file in your project (e.g., `mobile/google-play-key.json`)
9. Update `eas.json`:
   ```json
   "serviceAccountKeyPath": "./google-play-key.json"
   ```

### 5. Create Screenshots

You'll need screenshots for both stores. Here's how:

**For iOS:**
- Run the app in iOS Simulator
- Take screenshots of key screens:
  - Login screen
  - Main budget screen
  - Expense/Income management
  - Summary/analytics
- Resize to required dimensions:
  - iPhone 6.7": 1290 x 2796px
  - iPhone 6.5": 1242 x 2688px
  - iPad Pro 12.9": 2048 x 2732px

**For Android:**
- Run the app in Android Emulator
- Take screenshots of the same screens
- Resize to:
  - Phone: 16:9 or 9:16 aspect ratio
  - Tablet: 16:9 or 9:16 aspect ratio
- Create feature graphic: 1024x500px

**Tools for screenshots:**
- Use simulator/emulator screenshot tools
- Or use a tool like `fastlane frameit` or online screenshot generators

### 6. Build Production Versions

Once you have:
- ✅ Apple Team ID
- ✅ App Store Connect App ID (for iOS)
- ✅ Google Play service account key (for Android)

You can build:

```bash
cd mobile

# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production
```

Builds will take 10-20 minutes. You'll get download links when complete.

### 7. Test Before Submission

**iOS (TestFlight):**
1. After iOS build completes, it will be uploaded to App Store Connect
2. Go to App Store Connect → TestFlight
3. Add internal testers
4. Test the app thoroughly

**Android (Internal Testing):**
1. After Android build completes
2. Go to Google Play Console → Testing → Internal testing
3. Create a release and upload the AAB
4. Add testers
5. Test the app thoroughly

### 8. Complete Store Listings

**App Store Connect:**
- Fill in all required fields
- Upload screenshots
- Complete age rating questionnaire
- Add description, keywords, etc.

**Google Play Console:**
- Fill in store listing
- Upload screenshots and feature graphic
- Complete content rating
- Add descriptions

### 9. Submit to Stores

Once everything is ready:

```bash
# Submit iOS
eas submit --platform ios --profile production

# Submit Android
eas submit --platform android --profile production
```

Or submit manually through the store consoles.

## 📋 Current Status Checklist

- [x] EAS project initialized
- [x] Privacy policy URL configured
- [x] Support URL configured
- [x] Apple ID added
- [ ] Apple Team ID (get from developer portal)
- [ ] App Store Connect app created
- [ ] App Store Connect App ID added to eas.json
- [ ] Google Play Console app created
- [ ] Google Play service account created
- [ ] Service account key path added to eas.json
- [ ] Screenshots created
- [ ] Production builds completed
- [ ] Tested on TestFlight/Internal testing
- [ ] Store listings completed
- [ ] Submitted to stores

## 🎯 Priority Order

1. **Get Apple Team ID** (5 minutes)
2. **Create App Store Connect app** (10 minutes)
3. **Set up Google Play Console** (15 minutes)
4. **Create screenshots** (30-60 minutes)
5. **Build production versions** (20-40 minutes)
6. **Test and submit** (varies)

You're making great progress! 🚀

