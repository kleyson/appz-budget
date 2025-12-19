# Apple App Store - Quick Reference (Copy-Paste Ready)

## Promotional Text

_(Copy this into App Store Connect → App Information → Promotional Text)_

Companion app for self-hosted Appz Budget. Track expenses, manage income, and visualize spending with biometric authentication, dark mode, and comprehensive analytics. Requires self-hosted backend.

---

## Description

_(Copy this into App Store Connect → App Information → Description)_

⚠️ Important: This is a companion mobile app that requires a self-hosted backend server.

Appz Budget is a modern, comprehensive budget management application designed to help you take complete control of your personal finances. This iOS app is the mobile companion to the self-hosted Appz Budget backend, allowing you to access your budget data from your iPhone or iPad.

Self-Hosted Requirement: To use this app, you must host your own backend server. The app connects to your self-hosted API endpoint where all your financial data is stored. This ensures complete privacy and data control - your financial information never leaves your own infrastructure. A demo server is available for testing, but for production use, you'll need to deploy your own backend (see our GitHub repository for setup instructions).

Whether you're tracking daily expenses, managing monthly income, or analyzing your spending patterns, Appz Budget provides all the tools you need in a beautiful, intuitive interface.

Key Features

📊 Monthly Budget Management

- Track expenses and income by month with intuitive month closing
- Organize transactions with custom categories and color coding
- Create and manage multiple income types with budgeted amounts
- Filter and view expenses by category, period, or month
- Clone expenses to the next month for recurring bills

💰 Income & Expense Tracking

- Add, edit, and delete expenses with detailed information
- Track multiple income sources and types
- Mark expenses as paid with payment tracking
- View comprehensive summaries and totals
- Visual analytics with interactive charts

🎨 Organization & Customization

- Create custom expense categories with personalized colors
- Set up custom periods for flexible budget tracking
- Manage income types for different revenue sources
- Dark mode support for comfortable viewing in any lighting
- Clean, modern interface optimized for mobile

🔐 Security & Privacy

- Secure biometric authentication (Face ID, Touch ID, fingerprint)
- JWT-based authentication with secure token storage
- Self-hosted backend option for complete data privacy
- Password reset functionality with email support
- All data transmitted over secure HTTPS connections

👥 User Management

- Admin panel for managing multiple users
- User account management and status control
- Secure authentication system
- Session management with automatic expiration handling

📈 Analytics & Reports

- Real-time budget summaries and totals
- Visual spending patterns and trends
- Category-based expense breakdowns
- Income vs. expense comparisons
- Monthly budget overviews

💾 Data Management

- Export and import your entire budget database
- Excel spreadsheet import for easy data migration
- Backup and restore functionality
- Data persistence across app sessions

Why Choose Appz Budget?

Complete Data Control: As a companion app to your self-hosted backend, your financial data never leaves your own infrastructure. No third-party tracking, no data sharing, complete privacy.

Self-Hosted Architecture: This mobile app connects to your own self-hosted Appz Budget backend server, giving you full control over your data storage, security, and access.

Modern Design: Built with React Native and Expo, Appz Budget offers a smooth, native mobile experience with beautiful animations and intuitive navigation.

Comprehensive Features: From basic expense tracking to advanced analytics, Appz Budget covers all your budget management needs in one app.

Cross-Platform: Available on iOS, Android, web, and even terminal - access your budget from anywhere, on any device, all connecting to your self-hosted backend.

Secure by Default: Biometric authentication ensures only you can access your financial data, while secure token storage protects your session.

Perfect For

- Individuals tracking personal expenses and income
- Families managing household budgets
- Anyone wanting detailed insights into their spending habits
- Users who value privacy and data control
- People who prefer self-hosted solutions

Getting Started

Prerequisites: You must have a self-hosted Appz Budget backend server running. See our GitHub repository for installation instructions.

1. Deploy your self-hosted backend server (or use the demo server for testing)
2. Configure your backend API endpoint in the app settings
3. Create your account or log in
4. Set up your categories and income types
5. Start tracking your expenses and income
6. Enable biometric authentication for quick, secure access

Note: This app is a companion to the self-hosted Appz Budget system. All data is stored on your own backend server, ensuring complete privacy and control over your financial information.

Technical Details

- Built with React Native and Expo
- Requires iOS 15.1 or later
- Supports iPhone and iPad
- Optimized for all screen sizes
- Works offline with local caching
- Regular updates and improvements

Privacy Policy: https://github.com/kleyson/appz-budget
Support: https://github.com/kleyson/appz-budget/issues

Take control of your finances today with Appz Budget - where privacy, security, and powerful budget management come together.

---

## Keywords

_(Copy this into App Store Connect → App Information → Keywords)_

budget,expense,income,finance,money,spending,tracker,personal,financial,management,categories,analytics,biometric,secure,privacy,self-hosted

---

## Review Notes

_(Copy this into App Store Connect → App Review Information → Notes)_

App Overview
Important: Appz Budget is a companion mobile app that requires users to self-host their own backend server. This is not a standalone application - it is designed to work with a self-hosted Appz Budget backend instance.

The app allows users to track expenses, manage income, and analyze their spending patterns by connecting to their own backend API endpoint. All financial data is stored on the user's self-hosted server, not in the app or on our servers. This ensures complete data privacy and control.

A demo server is provided at https://budget.appz.wtf/ for testing purposes only. For production use, users must deploy their own backend server using the open-source Appz Budget backend (available on GitHub).

Testing Instructions

Demo Account Credentials:

- Email: admin@email.com
- Password: admin
- Demo URL: https://budget.appz.wtf/

Key Features to Test:

- Login/Registration with email and password
- Biometric authentication (Face ID/Touch ID) - available after first login
- Adding, editing, and deleting expenses
- Adding, editing, and deleting income entries
- Category and period management in Settings
- Monthly budget summaries and analytics
- Dark mode toggle
- User management (admin features)

API Configuration (Required)
This app requires users to self-host their own backend server. The app cannot function without a backend API endpoint.

The app requires users to configure their backend API endpoint on first launch. This is a core requirement - the app is designed as a companion to the self-hosted Appz Budget backend system. Users must:

1. Deploy their own Appz Budget backend server (instructions available on GitHub)
2. Configure the API endpoint in the app settings
3. Enter their API key for authentication

The demo server (https://budget.appz.wtf) is provided ONLY for testing and review purposes. For production use, users must host their own backend. The API configuration is stored locally on the device.

Authentication

- Standard email/password authentication
- Optional biometric authentication (Face ID, Touch ID, fingerprint)
- Biometric credentials are stored securely on the device using iOS Keychain
- JWT tokens are stored securely using AsyncStorage
- All API communication uses HTTPS

Data Privacy

- All financial data is stored on the user's configured backend server
- The app does not collect or transmit data to third-party services
- No analytics or tracking SDKs are included
- Biometric data never leaves the device
- API keys and tokens are stored locally on the device

Content & Functionality

- The app is a utility for personal budget management
- No user-generated content is shared publicly
- No social features or public sharing
- All data is private to the user's account
- No in-app purchases or subscriptions
- No advertisements

Compliance

- The app does not access sensitive user data beyond what's necessary for budget management
- No location tracking
- No contact access
- No photo library access
- No microphone or camera access
- Biometric authentication uses iOS native APIs (LocalAuthentication framework)
- Privacy manifest is included and properly configured

Known Limitations

- Requires self-hosted backend server - This is a companion app, not a standalone application
- Requires internet connection to connect to backend API
- First-time setup requires API configuration (demo credentials provided for testing only)
- Users must deploy and maintain their own backend server for production use
- Some features require admin privileges (user management)

Support
If you encounter any issues during review, please contact:

- Support URL: https://github.com/kleyson/appz-budget/issues
- The demo server is maintained and available 24/7 for testing

Additional Notes

- The app is built with Expo and React Native
- All network requests use secure HTTPS
- The app follows iOS Human Interface Guidelines
- Dark mode is fully supported
- The app is optimized for both iPhone and iPad

Thank you for reviewing Appz Budget!

---

## Additional Fields

**Subtitle**: Personal Budget Manager

**Category**: Finance

**Support URL**: https://github.com/kleyson/appz-budget/issues

**Marketing URL** (Optional): https://budget.appz.wtf/

**Privacy Policy URL**: https://github.com/kleyson/appz-budget/blob/main/mobile/PRIVACY_POLICY.md
