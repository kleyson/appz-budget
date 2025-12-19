# How to Submit Your IPA to Apple App Store

There are two main ways to submit your iOS app (IPA) to Apple:

## Method 1: Using EAS Submit (Recommended - Automated) 🚀

This is the easiest method if you're using Expo/EAS Build.

### Prerequisites

1. **Make sure `eas.json` is configured** with your Apple credentials:
   ```json
   "submit": {
     "production": {
       "ios": {
         "appleId": "kleyson@kleyson.ca",
         "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
         "appleTeamId": "YOUR_APPLE_TEAM_ID"
       }
     }
   }
   ```

2. **You must have already built the app**:
   ```bash
   cd mobile
   eas build --platform ios --profile production
   ```

### Steps to Submit

1. **Navigate to your mobile directory**:
   ```bash
   cd mobile
   ```

2. **Submit the latest build**:
   ```bash
   eas submit --platform ios --profile production
   ```

3. **Follow the prompts**:
   - EAS will ask you to authenticate with Apple (if not already done)
   - It will find your latest production build
   - It will upload the IPA to App Store Connect automatically

4. **That's it!** The build will appear in App Store Connect within a few minutes.

### What Happens Next

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → **App Store** tab
3. Click **"+ Version or Platform"** (if first submission)
4. Select your uploaded build from the dropdown
5. Complete the submission form:
   - Add "What's New in This Version" (release notes)
   - Answer export compliance questions (if prompted)
   - Click **"Submit for Review"**

---

## Method 2: Manual Upload (Alternative)

If you prefer to upload manually or if EAS Submit doesn't work:

### Option A: Using Transporter App (Recommended for Manual)

1. **Download Transporter** from the Mac App Store (free)

2. **Get your IPA file**:
   - If you built with EAS: Download from [expo.dev](https://expo.dev) → Your project → Builds
   - Or use: `eas build:list` to see your builds and download links

3. **Open Transporter**:
   - Drag and drop your `.ipa` file into Transporter
   - Click **"Deliver"**
   - Sign in with your Apple ID
   - Wait for upload to complete

4. **Go to App Store Connect**:
   - Navigate to your app → **App Store** tab
   - The build should appear within 10-30 minutes
   - Select it and submit for review

### Option B: Using Xcode Organizer

1. **Open Xcode**

2. **Go to Window → Organizer** (or press `Cmd+Shift+O` and type "Organizer")

3. **Select "Archives"** tab

4. **If you have an archive**:
   - Select your archive
   - Click **"Distribute App"**
   - Choose **"App Store Connect"**
   - Follow the wizard to upload

5. **If you don't have an archive**:
   - You'll need to build from Xcode first
   - Or use the IPA from EAS Build (use Transporter instead)

### Option C: Using Command Line (altool/notarytool)

If you have the IPA file locally:

```bash
# Using notarytool (recommended for macOS 13+)
xcrun notarytool submit YourApp.ipa \
  --apple-id "kleyson@kleyson.ca" \
  --team-id "YOUR_TEAM_ID" \
  --password "app-specific-password" \
  --wait

# Or using altool (older method)
xcrun altool --upload-app \
  --type ios \
  --file YourApp.ipa \
  --username "kleyson@kleyson.ca" \
  --password "app-specific-password"
```

**Note**: You'll need to generate an app-specific password from [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords

---

## Complete Submission Workflow

### Step 1: Build Your App
```bash
cd mobile
eas build --platform ios --profile production
```

Wait for the build to complete (usually 10-20 minutes).

### Step 2: Submit to App Store Connect
```bash
eas submit --platform ios --profile production
```

### Step 3: Complete App Store Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **App Store** tab
3. Click **"+ Version or Platform"** (for first submission)
4. Fill in:
   - **Version**: e.g., "1.0.0"
   - **What's New**: Release notes for this version
   - **Build**: Select your uploaded build from dropdown
   - **Export Compliance**: Answer questions about encryption
   - **Advertising Identifier**: Select if you use it (you don't)

### Step 4: Submit for Review

1. Review all information
2. Click **"Submit for Review"**
3. Wait for Apple's review (usually 24-48 hours)

---

## Troubleshooting

### "No builds found"
- Make sure you've built with `eas build --platform ios --profile production`
- Check that the build completed successfully
- Verify you're in the correct project directory

### "Authentication failed"
- Make sure your Apple ID in `eas.json` is correct
- You may need to authenticate: `eas submit --platform ios` will prompt you
- Ensure you have an active Apple Developer Program membership

### "Build not appearing in App Store Connect"
- Wait 10-30 minutes after upload
- Check the "TestFlight" tab - it might appear there first
- Refresh the page
- Check that the bundle ID matches your App Store Connect app

### "Invalid bundle identifier"
- Verify your bundle ID in `app.json` matches the one in App Store Connect
- Should be: `wtf.appz.budget`

### "Missing required information"
- Make sure you've completed:
  - App description
  - Screenshots (at least for one device size)
  - Privacy policy URL
  - Support URL
  - Age rating questionnaire

---

## Quick Reference Commands

```bash
# Build for production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Check build status
eas build:list

# View build details
eas build:view [BUILD_ID]

# Check submission status
# (Check in App Store Connect)
```

---

## What to Expect After Submission

1. **Processing** (10-30 minutes): Apple processes your build
2. **Waiting for Review** (24-48 hours): Apple reviews your app
3. **In Review** (few hours to 1 day): Active review process
4. **Approved** or **Rejected**: You'll receive an email notification

### If Approved:
- Your app will be available on the App Store within a few hours
- You can set it to release automatically or manually

### If Rejected:
- Apple will provide specific feedback
- Fix the issues and resubmit
- You can reply to reviewers in App Store Connect

---

## Important Notes

- ⚠️ **First submission**: Make sure all required information is complete (screenshots, description, privacy policy, etc.)
- ⚠️ **TestFlight**: Your build will also appear in TestFlight, which is great for testing before public release
- ⚠️ **Version numbers**: Each submission needs a new version number (increment in `app.json`)
- ⚠️ **Build numbers**: Each build needs a unique build number (increment in `app.json` → `ios.buildNumber`)

---

## Need Help?

- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Apple Developer Forums](https://developer.apple.com/forums/)

Good luck with your submission! 🎉

