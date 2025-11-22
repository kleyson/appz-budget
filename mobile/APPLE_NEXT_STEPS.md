# Apple App Store - Next Steps

## ✅ Completed
- Apple Team ID: `JQ56AD9KGG`
- App Store Connect App ID: `6755663664`
- App created in App Store Connect
- eas.json configured

## 🚀 Next Steps

### Step 1: Build iOS Production Version

Build your iOS app for production:

```bash
cd mobile
eas build --platform ios --profile production
```

**What happens:**
- EAS will build your app in the cloud
- Takes 15-20 minutes
- You'll get a download link when complete
- The build will automatically be uploaded to App Store Connect

**Note:** The first build might take longer. You can monitor progress in the terminal or at https://expo.dev

---

### Step 2: Create Screenshots (While Building)

While the build is running, create your screenshots:

**Required Screenshots:**
1. **iPhone 6.7"** (iPhone 14 Pro Max, 15 Pro Max): 1290 x 2796px
2. **iPhone 6.5"** (iPhone 11 Pro Max, XS Max): 1242 x 2688px
3. **iPad Pro 12.9"**: 2048 x 2732px

**How to create:**
1. Run your app in iOS Simulator:
   ```bash
   cd mobile
   npm start
   # Then press 'i' to open iOS simulator
   ```

2. Navigate through key screens:
   - Login screen
   - Main budget/dashboard
   - Expense management
   - Income management
   - Summary/analytics
   - Settings

3. Take screenshots:
   - In Simulator: Device → Screenshot (or Cmd+S)
   - Or use: `xcrun simctl io booted screenshot screenshot.png`

4. Resize screenshots to required dimensions (you can use online tools or ImageMagick)

**Screenshot Tips:**
- Show the app's key features
- Use real data (not placeholder text)
- Make sure UI looks polished
- Include both light and dark mode if possible
- At least 3-5 screenshots per device size

---

### Step 3: Fill App Store Connect Listing

Go to https://appstoreconnect.apple.com → Your App → App Information

**Required Information:**
- [ ] **App Name**: Appz Budget ✅
- [ ] **Subtitle**: (30 chars max) - e.g., "Personal Budget Manager"
- [ ] **Category**: Finance
- [ ] **Age Rating**: Complete questionnaire
- [ ] **Privacy Policy URL**: Already set ✅
- [ ] **Support URL**: Already set ✅
- [ ] **Description**: (4000 chars max)
  - Write compelling description of your app
  - Highlight key features
  - Use the description from your README as a starting point
- [ ] **Keywords**: (100 chars max)
  - e.g., "budget,finance,expense,income,tracking,money"
- [ ] **Promotional Text**: (170 chars, optional)
  - Can be updated without app review
- [ ] **Screenshots**: Upload for each device size
- [ ] **App Icon**: 1024x1024px (already have ✅)

---

### Step 4: Test via TestFlight

After your build completes and is uploaded:

1. Go to App Store Connect → Your App → TestFlight
2. The build should appear automatically
3. Add internal testers:
   - Go to "Internal Testing"
   - Add testers (you can add yourself)
   - They'll receive an email invitation
4. Test the app thoroughly:
   - All features work
   - No crashes
   - UI looks good
   - Performance is acceptable

**TestFlight Tips:**
- Test on real devices (not just simulator)
- Test on different iOS versions if possible
- Check both light and dark modes
- Test all user flows

---

### Step 5: Complete App Store Listing

Before submitting, make sure:

- [ ] All screenshots uploaded
- [ ] Description complete
- [ ] Keywords added
- [ ] Age rating completed
- [ ] App information complete
- [ ] App reviewed and tested via TestFlight

---

### Step 6: Submit for Review

Once everything is ready:

**Option A: Via EAS (Recommended)**
```bash
cd mobile
eas submit --platform ios --profile production
```

**Option B: Manual Upload**
1. Go to App Store Connect → Your App → App Store
2. Click "+ Version or Platform"
3. Select your build
4. Fill in "What's New in This Version"
5. Click "Submit for Review"

**Review Process:**
- Usually takes 24-48 hours
- Apple will review your app
- You'll get notified of approval or rejection
- If rejected, they'll provide feedback

---

## 📋 Quick Checklist

- [x] Apple Team ID configured
- [x] App Store Connect App ID configured
- [ ] iOS production build completed
- [ ] Screenshots created and uploaded
- [ ] App Store listing filled out
- [ ] Tested via TestFlight
- [ ] Submitted for review

---

## 🎯 Priority Order

1. **Build the app** (15-20 min, can do other things while waiting)
2. **Create screenshots** (30-60 min)
3. **Fill App Store listing** (20-30 min)
4. **Test via TestFlight** (varies)
5. **Submit for review** (5 min)

---

## 💡 Pro Tips

- **Screenshots are critical** - they're the first thing users see
- **Description matters** - make it compelling and clear
- **Test thoroughly** - catch issues before Apple reviews
- **Be patient** - review process can take time
- **Respond quickly** - if Apple asks questions, respond promptly

Ready to build? Run: `eas build --platform ios --profile production` 🚀

