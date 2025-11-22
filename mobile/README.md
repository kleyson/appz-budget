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

Before running the app, you need to configure the API base URL. Edit `src/api/client.ts` and update the `API_BASE_URL` constant:

```typescript
const API_BASE_URL = __DEV__ ? 'http://localhost:8000' : 'https://your-production-api.com';
```

For iOS Simulator, use `http://localhost:8000` for local development.
For Android Emulator, use `http://10.0.2.2:8000` for local development.
For physical devices, use your computer's local IP address (e.g., `http://192.168.1.100:8000`).

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

- **Expo**: React Native framework
- **React Navigation**: Navigation library
- **React Query**: Data fetching and caching
- **Axios**: HTTP client
- **AsyncStorage**: Local storage for tokens
- **TypeScript**: Type safety

## Features Replicated from Web Version

✅ User authentication (login, register, password reset)
✅ Expense management (CRUD operations)
✅ Income management (CRUD operations)
✅ Category management
✅ Period management
✅ Income type management
✅ Month management
✅ Summary and totals
✅ Dark mode support
✅ User management (admin)

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

