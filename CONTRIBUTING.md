# Contributing to Appz Budget Mobile

Thank you for your interest in contributing! Here are some guidelines to help you get started:

## Folder Structure

- `src/api/` - API client and endpoints
- `src/components/` - Reusable components
- `src/components/settings/` - Settings management components
- `src/contexts/` - React contexts (Auth, Theme)
- `src/hooks/` - Custom React hooks for data fetching
- `src/screens/` - Screen components
- `src/screens/auth/` - Authentication screens
- `src/types/` - TypeScript type definitions

## How to Add a New Screen

1. Create a new file in `src/screens/` (e.g., `NewFeatureScreen.tsx`).
2. Add your component logic and UI.
3. Register the screen in the navigation (if needed).

## How to Add a New Component

1. Create a new file in `src/components/`.
2. Write your reusable component.
3. Add documentation and props typing.

## Setup Instructions

- See `README.md` and `SETUP_INSTRUCTIONS.md` for environment setup and build steps.

## Code Style

- Use TypeScript for all files.
- Follow ESLint and Prettier rules.
- Add comments for complex logic.

## Security & Privacy

- Store tokens and API keys securely using AsyncStorage.
- Do not hardcode sensitive information.
- Update privacy policy links in `app.json` and documentation as needed.

## Submitting Changes

- Fork the repo, create a feature branch, and submit a pull request.
- Ensure your code passes linting and tests.

---

For questions, open an issue or contact the maintainer.
