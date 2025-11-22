# Apple App Store Setup Guide

## Step 1: Get Your Apple Team ID

### Method 1: Apple Developer Portal (Recommended)

1. Go to https://developer.apple.com/account
2. Sign in with your Apple ID: `kleyson@kleyson.ca`
3. Click on **"Membership"** in the left sidebar
4. Your **Team ID** is displayed in the membership details
   - Format: `ABC123DEF4` (10 characters, letters and numbers)
   - Example: `A1B2C3D4E5`

### Method 2: App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple ID
3. Click on your name/account in the top right
4. Your Team ID is shown in the account information

### Method 3: Xcode (if installed)

1. Open Xcode
2. Go to **Xcode → Settings → Accounts**
3. Select your Apple ID
4. Your Team ID is shown next to your team name

**Once you have your Team ID, we'll add it to `eas.json`**

---

## Step 2: Register Bundle Identifier

Before creating the app, you need to register your bundle identifier:

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click the **"+"** button to add a new identifier
3. Select **"App IDs"** → Continue
4. Select **"App"** → Continue
5. Fill in:
   - **Description**: Appz Budget
   - **Bundle ID**: Select "Explicit" and enter: `wtf.appz.budget`
6. Enable any capabilities you need (most can be added later)
7. Click **"Continue"** → **"Register"**

**Note**: If you get an error that the bundle ID is already registered, that's fine - it means it's already set up!

---

## Step 3: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple ID
3. Click **"My Apps"** in the top navigation
4. Click the **"+"** button → **"New App"**
5. Fill in the form:
   - **Platform**: iOS
   - **Name**: Appz Budget
   - **Primary Language**: English (or your preferred language)
   - **Bundle ID**: Select `wtf.appz.budget` from the dropdown
   - **SKU**: `appz-budget-001` (or any unique identifier - this is internal only)
6. Click **"Create"**

### Get Your App Store Connect App ID

After creating the app:
1. You'll be taken to the app's page
2. Look at the URL - it will contain a number like: `https://appstoreconnect.apple.com/apps/1234567890/...`
3. The number (`1234567890`) is your **App Store Connect App ID**
4. Or look in the app information section - it's displayed there

**Save this App ID - we'll add it to `eas.json`**

---

## Step 4: Update eas.json

Once you have both:
- **Apple Team ID** (from Step 1)
- **App Store Connect App ID** (from Step 3)

Update `mobile/eas.json`:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "kleyson@kleyson.ca",
      "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",  // Replace this
      "appleTeamId": "YOUR_APPLE_TEAM_ID"            // Replace this
    },
    ...
  }
}
```

---

## Step 5: Prepare App Information (Can do later)

You'll need to fill in these in App Store Connect before submission:

- **App Name**: Appz Budget
- **Subtitle**: (30 characters max) - e.g., "Personal Budget Manager"
- **Category**: Finance
- **Age Rating**: Complete questionnaire
- **Privacy Policy URL**: Already set ✅
- **Support URL**: Already set ✅
- **Description**: (4000 characters max)
- **Keywords**: (100 characters max)
- **Screenshots**: Required for iPhone and iPad
- **App Icon**: 1024x1024px (already have ✅)

---

## Quick Checklist

- [ ] Get Apple Team ID from developer.apple.com
- [ ] Register bundle identifier `wtf.appz.budget` (if not already)
- [ ] Create app in App Store Connect
- [ ] Get App Store Connect App ID
- [ ] Update `eas.json` with Team ID and App ID
- [ ] Ready to build! 🚀

---

## Troubleshooting

### "Bundle ID already exists"
- This is fine! It means it's already registered. Just select it from the dropdown when creating the app.

### "You don't have permission"
- Make sure you're signed in with the correct Apple ID
- Verify you have an active Apple Developer Program membership ($99/year)

### "Team ID not found"
- Make sure you're looking at the Membership section in developer.apple.com
- The Team ID is different from your Apple ID

---

## Next Steps After Apple Setup

Once you have the Team ID and App ID in `eas.json`:
1. You can build iOS: `eas build --platform ios --profile production`
2. Create screenshots
3. Fill in App Store Connect listing
4. Submit for review

Let me know when you have your Team ID and App ID, and I'll help update the files! 🎯

