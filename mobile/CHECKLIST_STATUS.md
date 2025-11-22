# Store Submission Checklist - Current Status

## ✅ COMPLETED

### Configuration Steps

#### 1. Update app.json
- ✅ iOS bundle identifier: `wtf.appz.budget` ✓
- ✅ Android package name: `wtf.appz.budget` ✓
- ✅ App name: "Appz Budget" ✓
- ✅ Description: Present and appropriate ✓
- ❌ Privacy policy URL: **MISSING** (REQUIRED)
- ❌ Support/contact URL: **MISSING**

#### 2. Assets
- ✅ App Icon exists: 1024x1024px PNG ✓
- ✅ Adaptive Icon exists: 1024x1024px PNG ✓
- ❌ Screenshots: **NEED TO CREATE**
- ❌ Feature Graphic (Android): **NEED TO CREATE**

#### 3. EAS Configuration
- ✅ eas.json file exists ✓
- ❌ EAS CLI installed: **NOT INSTALLED**
- ❌ EAS project configured: **NOT CONFIGURED**
- ❌ Project ID in app.json: Still shows "YOUR_PROJECT_ID_HERE"

## ❌ TODO - IMMEDIATE ACTIONS NEEDED

### Priority 1: Required for Submission

1. **Privacy Policy** (REQUIRED by both stores)
   - [ ] Create privacy policy page/URL
   - [ ] Add URL to app.json (iOS and Android sections)

2. **Support URL** (REQUIRED by both stores)
   - [ ] Create support page/URL
   - [ ] Add URL to app.json

3. **EAS Setup**
   - [ ] Install EAS CLI: `npm install -g eas-cli`
   - [ ] Login to Expo: `eas login`
   - [ ] Configure EAS project: `cd mobile && eas build:configure`
   - [ ] This will update app.json with actual project ID

4. **Update eas.json with credentials**
   - [ ] Add Apple ID email
   - [ ] Add Apple Team ID (from Apple Developer portal)
   - [ ] Add Google Play service account JSON key path

### Priority 2: Assets Needed

5. **Screenshots** (REQUIRED for both stores)
   - [ ] iOS: iPhone 6.7" screenshots (1290 x 2796px)
   - [ ] iOS: iPhone 6.5" screenshots (1242 x 2688px)
   - [ ] iOS: iPad Pro 12.9" screenshots (2048 x 2732px)
   - [ ] Android: Phone screenshots (minimum 2, recommended 8+)
   - [ ] Android: Tablet screenshots (7" and 10")

6. **Android Feature Graphic**
   - [ ] Create 1024x500px PNG feature graphic

### Priority 3: Developer Accounts

7. **Developer Accounts**
   - [ ] Apple Developer account ($99/year) - for iOS
   - [ ] Google Play Developer account ($25 one-time) - for Android

### Priority 4: Build & Test

8. **Build Production Versions**
   - [ ] Build iOS: `eas build --platform ios --profile production`
   - [ ] Build Android: `eas build --platform android --profile production`

9. **Test Before Submission**
   - [ ] Test on iOS device via TestFlight
   - [ ] Test on Android device via internal testing
   - [ ] Verify all features work correctly
   - [ ] Check for crashes or bugs

### Priority 5: Store Listings

10. **App Store Connect Setup**
    - [ ] Create app in App Store Connect
    - [ ] Fill all required fields (name, subtitle, category, etc.)
    - [ ] Upload screenshots
    - [ ] Complete age rating questionnaire
    - [ ] Note App Store Connect App ID

11. **Google Play Console Setup**
    - [ ] Create app in Google Play Console
    - [ ] Fill all required fields
    - [ ] Upload screenshots and feature graphic
    - [ ] Complete content rating questionnaire
    - [ ] Set up service account

## 📋 NEXT STEPS

1. **Start with EAS Setup** (can be done now):
   ```bash
   npm install -g eas-cli
   eas login
   cd mobile
   eas build:configure
   ```

2. **Create Privacy Policy** (can use a generator or create simple page):
   - Must cover: data collection, usage, storage, security, user rights
   - Can be hosted on GitHub Pages, your website, or privacy policy generator

3. **Create Support URL**:
   - Can be a simple contact page or email link
   - Can use GitHub Issues, email, or support page

4. **Prepare Screenshots**:
   - Run app on simulator/device
   - Take screenshots of key features
   - Resize to required dimensions

5. **Get Developer Accounts** (if not already have):
   - Sign up for Apple Developer Program
   - Sign up for Google Play Developer Program

## 🔍 CURRENT CONFIGURATION

- **Bundle ID**: `wtf.appz.budget` ✓
- **App Name**: "Appz Budget" ✓
- **Version**: 1.0.0 ✓
- **Icons**: Present ✓
- **EAS Config**: File exists but needs credentials ✓

