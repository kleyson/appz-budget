# EAS Setup Instructions

## Step 1: Initialize EAS Project

Run this command in the mobile directory:

```bash
cd mobile
eas project:init
```

When prompted:
- Answer "Yes" to create a new project
- The project will be created and linked automatically
- The project ID will be added to `app.json`

## Step 2: Update Privacy Policy and Support URLs

After you have your privacy policy and support URLs ready, update `app.json`:

1. **Privacy Policy URL** - Add to both iOS and Android sections:
   ```json
   "ios": {
     "privacyManifests": {
       "NSPrivacyAccessedAPITypes": []
     }
   },
   "android": {
     "privacyPolicy": "https://your-privacy-policy-url.com"
   }
   ```

2. **Support URL** - Add to app.json:
   ```json
   "expo": {
     "supportUrl": "https://your-support-url.com"
   }
   ```

## Step 3: Host Privacy Policy

You can host the privacy policy (`PRIVACY_POLICY.md`) on:
- GitHub Pages
- Your website
- A privacy policy generator service
- Or include it in your app's repository

## Step 4: Update eas.json with Credentials

Once you have your developer accounts:

### For iOS:
1. Get your Apple Team ID from [Apple Developer Portal](https://developer.apple.com/account)
2. Update `eas.json`:
   ```json
   "ios": {
     "appleId": "your-email@example.com",
     "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
     "appleTeamId": "YOUR_TEAM_ID"
   }
   ```

### For Android:
1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Add it to Google Play Console with "Release Manager" role
4. Update `eas.json`:
   ```json
   "android": {
     "serviceAccountKeyPath": "./path/to/api-key.json",
     "track": "internal"
   }
   ```

## Next Steps

After completing these steps, you can:
1. Build the app: `eas build --platform ios --profile production`
2. Test on TestFlight/Internal Testing
3. Submit to stores: `eas submit --platform ios --profile production`

