# Appz Budget Mobile App

A React Native mobile application built with Expo for managing your personal budget. This app replicates all features from the web version.

## Features

- **Authentication**: Login, Register, Forgot Password, Reset Password
- **Monthly Budget Management**:
  - View and manage expenses
  - Track income
  - View summary and totals
- **Settings Management**:
  - Manage categories
  - Manage periods
  - Manage income types
  - User management (admin only)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (installed globally or via npx)
- iOS Simulator (for iOS development) or Android Emulator (for Android development)

## Installation

1. Navigate to the mobile directory:

```bash
cd mobile
```

2. Install dependencies:

```bash
npm install
```

## Configuration

The app uses dynamic API configuration stored locally on the device:

1. **On First Launch**: The app will prompt you to configure the API endpoint
2. **Settings**: Go to Settings → API Configuration to change the API URL and key
3. **Default**: The app defaults to the demo server (`https://budget.appz.wtf`) with API key `your-secret-api-key-change-this`

The API configuration is stored securely using AsyncStorage and persists across app sessions.

For local development:
- **iOS Simulator**: Use `http://localhost:8000`
- **Android Emulator**: Use `http://10.0.2.2:8000`
- **Physical Device**: Use your computer's local IP address (e.g., `http://192.168.1.100:8000`)

## Running the App

### Start the Expo development server:

```bash
npm start
```

### Run on iOS:

```bash
npm run ios
```

### Run on Android:

```bash
npm run android
```

### Run on Web:

```bash
npm run web
```

## Project Structure

```
mobile/
├── src/
│   ├── api/           # API client and endpoints
│   ├── components/    # Reusable components
│   │   └── settings/  # Settings management components
│   ├── contexts/      # React contexts (Auth, Theme)
│   ├── hooks/         # Custom React hooks for data fetching
│   ├── screens/       # Screen components
│   │   └── auth/      # Authentication screens
│   └── types/         # TypeScript type definitions
├── App.tsx            # Main app component with navigation
└── package.json       # Dependencies and scripts
```

## Key Technologies

- **Expo**: React Native framework and build service
- **Expo Router**: File-based routing
- **TanStack Query**: Data fetching and caching
- **Axios**: HTTP client
- **AsyncStorage**: Local storage for tokens and API config
- **expo-local-authentication**: Biometric authentication
- **TypeScript**: Type safety

## Features

✅ User authentication (login, register, password reset, change password)
✅ Biometric authentication (Face ID, Touch ID, fingerprint)
✅ Expense management (CRUD operations, reorder, clone to next month, mark as paid)
✅ Income management (CRUD operations)
✅ Category management
✅ Period management
✅ Income type management
✅ Month management (create, close, open months)
✅ Summary and analytics
✅ Dark mode support
✅ User management (admin panel)
✅ Excel import
✅ Backup and restore

## Notes

- The app uses the same backend API as the web version
- Authentication tokens are stored securely using AsyncStorage
- The app supports both light and dark themes

## Troubleshooting

### API Connection Issues

- Make sure your backend server is running
- Check that the API_BASE_URL is correctly configured
- For physical devices, ensure your device and computer are on the same network

### Build Issues

- Clear the Expo cache: `npx expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## License

Same as the main project.
