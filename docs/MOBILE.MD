# Mobile App Documentation

## Overview

The mobile app is built with **React Native + Expo** for iOS and Android. It's a companion app that connects to a self-hosted backend server.

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform and build service
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client

## Architecture

### Structure

```
mobile/src/
├── api/
│   └── client.ts              # API client (configure URL for emulator/device)
├── screens/                   # Expo Router screens
│   ├── (auth)/                # Authentication screens
│   ├── (tabs)/                # Main app tabs
│   └── SettingsScreen/        # Settings screens
├── hooks/                     # Custom hooks (same pattern as frontend)
│   ├── useExpenses.ts
│   ├── useCategories.ts
│   └── ...
├── contexts/
│   └── ApiConfigContext.tsx   # API configuration context
├── components/                 # Reusable components
└── types/                      # TypeScript types
```

### Navigation

- **Expo Router**: File-based routing
- **Tabs**: Bottom tab navigation for main app
- **Stack**: Stack navigation for auth and settings

## Development Setup

### Prerequisites

- Node.js 18+
- npm
- Expo CLI (optional, EAS CLI recommended)
- iOS Simulator (for iOS development)
- Android Emulator (for Android development)

### Installation

```bash
cd mobile
npm install
```

### Running

```bash
# Start Expo dev server
npm start

# Or using Makefile
make mobile-dev
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

### Building

```bash
# Development build
eas build --platform ios --profile development
eas build --platform android --profile development

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Configuration

### API Configuration

The app requires users to configure their backend API endpoint:

1. **First Launch**: User must configure API URL and API key
2. **Settings**: Can be changed in Settings → API Configuration
3. **Storage**: Configuration stored locally on device

### Default Configuration

- **Default API URL**: `https://budget.appz.wtf` (demo server)
- **Default API Key**: `your-secret-api-key-change-this` (demo key)

### API Context

`ApiConfigContext` manages:
- API URL
- API key
- Loading state
- Error handling

## Features

### Authentication

- Email/password login and registration
- Biometric authentication (Face ID, Touch ID, fingerprint)
- Password reset functionality
- Change password
- Secure token storage

### API Documentation

The backend provides interactive API documentation that can be accessed from any browser:

- **Swagger UI**: `https://your-backend-url/docs`
- **ReDoc**: `https://your-backend-url/redoc`
- **OpenAPI Schema**: `https://your-backend-url/openapi.json`

Use these to understand the API structure, test endpoints, and verify request/response formats.

### Budget Management

- Track expenses and income
- Monthly budget tracking
- Category and period management
- Summary and analytics
- Excel import support

### User Interface

- Dark mode support
- Native mobile experience
- Smooth animations
- Responsive design

### Security

- Biometric authentication using iOS Keychain / Android Keystore
- JWT tokens stored securely
- API keys stored locally
- HTTPS communication

## Store Submission

### Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: `npm install -g eas-cli`
3. **Apple Developer Account**: $99/year (for iOS)
4. **Google Play Developer Account**: $25 one-time (for Android)

### Initial Setup

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS project
cd mobile
eas project:init
```

### Configuration Files

#### app.json

Required fields:
- Bundle identifier: `wtf.appz.budget` (iOS & Android)
- Privacy policy URL (required)
- Support URL (required)
- App name: "Appz Budget"

#### eas.json

Contains build and submission profiles:
- Development profile
- Preview profile
- Production profile

**Important**: `eas.json` contains sensitive credentials and should NOT be committed. Use `eas.json.template` instead.

### Apple App Store Submission

#### Step 1: Get Apple Team ID

1. Go to https://developer.apple.com/account
2. Sign in with your Apple ID
3. Click "Membership" in sidebar
4. Note your Team ID (format: ABC123DEF4)

#### Step 2: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: Appz Budget
   - Bundle ID: `wtf.appz.budget`
   - SKU: `appz-budget-001`
4. Note the App Store Connect App ID

#### Step 3: Update eas.json

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      }
    }
  }
}
```

#### Step 4: Build and Submit

```bash
# Build iOS app
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

#### Required Assets

- App Icon: 1024x1024px PNG (no transparency)
- Screenshots:
  - iPhone 6.7": 1290 x 2796px
  - iPhone 6.5": 1242 x 2688px
  - iPad Pro 12.9": 2048 x 2732px

#### Store Listing

Required information:
- App name: "Appz Budget"
- Subtitle: 30 characters max
- Category: Finance
- Description: 4000 characters max
- Keywords: 100 characters max
- Privacy policy URL
- Support URL
- Age rating questionnaire

See [APPLE_STORE_SUBMISSION.md](./APPLE_STORE_SUBMISSION.md) for detailed submission information.

### Google Play Store Submission

#### Step 1: Create App in Google Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in app details

#### Step 2: Create Service Account

1. Go to https://console.cloud.google.com
2. Create service account
3. Enable "Google Play Android Developer API"
4. Download JSON key file
5. Link service account in Google Play Console with "Release Manager" role

#### Step 3: Update eas.json

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./path/to/google-play-key.json",
        "track": "internal"
      }
    }
  }
}
```

#### Step 4: Build and Submit

```bash
# Build Android app
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --profile production
```

#### Required Assets

- App Icon: 512x512px PNG
- Feature Graphic: 1024x500px PNG
- Screenshots: Minimum 2, recommended 8+
  - Phone: 16:9 or 9:16 aspect ratio
  - Tablet: 16:9 or 9:16 aspect ratio

## Privacy Policy

A privacy policy is **required** for both stores. See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for a template.

The privacy policy should cover:
- What data is collected
- How data is used
- Data storage and security
- User rights
- Third-party services

## Testing

### TestFlight (iOS)

1. Build production version
2. Upload to App Store Connect
3. Add internal/external testers
4. Test thoroughly before public release

### Internal Testing (Android)

1. Build production version
2. Upload to Google Play Console
3. Create internal testing track
4. Add testers
5. Test thoroughly before public release

## Version Management

### Updating Versions

In `app.json`:
- `version`: User-facing version (e.g., "1.0.0")
- `ios.buildNumber`: Increment for each iOS build
- `android.versionCode`: Increment for each Android build

## Common Commands

```bash
# Development
make mobile-dev         # Start Expo dev server
npm start               # Start Expo dev server

# Building
eas build --platform ios --profile production
eas build --platform android --profile production

# Submission
eas submit --platform ios --profile production
eas submit --platform android --profile production

# Testing
make test-mobile        # Run mobile tests
make lint-mobile        # ESLint
make type-check-mobile  # TypeScript check
```

## Security Considerations

### Sensitive Files

**Never commit:**
- `mobile/eas.json` (contains real credentials)
- Service account JSON files
- Private keys (`.p8`, `.p12`, `.key`, `.pem`)

**Use instead:**
- `mobile/eas.json.template` (with placeholders)
- Environment variables
- EAS secrets

See [SECURITY.md](./SECURITY.md) for detailed security guidelines.

## Documentation Files

- [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) - EAS setup guide
- [APPLE_SETUP.md](./APPLE_SETUP.md) - Apple App Store setup
- [APPLE_NEXT_STEPS.md](./APPLE_NEXT_STEPS.md) - Apple submission steps
- [APPLE_STORE_SUBMISSION.md](./APPLE_STORE_SUBMISSION.md) - Complete Apple submission guide
- [APPLE_STORE_QUICK_REFERENCE.md](./APPLE_STORE_QUICK_REFERENCE.md) - Quick reference for Apple submission
- [SUBMIT_TO_APPLE.md](./SUBMIT_TO_APPLE.md) - How to submit IPA to Apple
- [STORE_SUBMISSION.md](./STORE_SUBMISSION.md) - General store submission guide
- [STORE_CHECKLIST.md](./STORE_CHECKLIST.md) - Submission checklist
- [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) - Privacy policy template

## Demo Server

A demo server is available at `https://budget.appz.wtf/` for testing purposes.

**Demo Credentials:**
- Email: `admin@email.com`
- Password: `admin1`
- API Key: `your-secret-api-key-change-this`

**Note**: For production use, users must deploy their own backend server.

