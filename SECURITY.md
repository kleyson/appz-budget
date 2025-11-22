# Security Guidelines

This document outlines security best practices for this project.

## Sensitive Data Handling

### ⚠️ Never Commit These to Git:

- API keys and secrets
- Service account JSON files (Google Play, etc.)
- Private keys (`.p8`, `.p12`, `.key`, `.pem`)
- Environment files with real credentials (`.env`, `.env.local`)
- Database files with real data
- JWT secret keys

### Files That Should Use Environment Variables:

1. **`mobile/eas.json`** - Contains:

   - `appleId` - Your Apple Developer email
   - `ascAppId` - App Store Connect App ID
   - `appleTeamId` - Apple Developer Team ID
   - `serviceAccountKeyPath` - Path to Google Play service account JSON

2. **Backend Environment Variables:**

   - `API_KEY` - Backend API authentication key
   - `JWT_SECRET_KEY` - JWT token signing key
   - `DATABASE_URL` - Database connection string

3. **Frontend Environment Variables:**
   - `VITE_API_KEY` - Frontend API key (development only)

## Setting Up EAS.json Securely

The `eas.json` file contains sensitive information. For open-source projects, use environment variables:

### Option 1: Use Local eas.json (Recommended for Open Source)

1. **Keep `eas.json.template` in git** (already done)
2. **Create local `eas.json`** (already in `.gitignore`):
   ```bash
   cp mobile/eas.json.template mobile/eas.json
   ```
3. **Fill in your real values** in `mobile/eas.json`
4. **Never commit `mobile/eas.json`** (already in `.gitignore`)

### Option 2: Use EAS Secrets (Alternative)

EAS doesn't directly support secrets in `eas.json` for submit credentials. Instead:

1. Use environment variables in your CI/CD
2. Or keep `eas.json` local and gitignored (Option 1)

### Option 2: Use Local Environment Variables

Create a `.env.local` file (already in `.gitignore`):

```bash
APPLE_ID=your-email@example.com
ASC_APP_ID=your-app-id
APPLE_TEAM_ID=your-team-id
```

Then use a build script to inject them.

### Option 3: Use a Template File

Keep `eas.json.template` in git with placeholders, and create `eas.json` locally (already in `.gitignore`).

## Default Values in Code

The following default values are **only for development** and should be changed in production:

- `your-secret-api-key-change-this` - Only used in `__DEV__` mode for mobile app
- `your-secret-key-change-in-production` - JWT secret fallback (should set `JWT_SECRET_KEY` env var)
- `admin123` - Default admin password (only for initial seed, change immediately)

## Google Play Service Account

The `serviceAccountKeyPath` in `eas.json` should point to a file that is:

- **NOT** committed to git
- Stored securely (use EAS secrets or local file)
- Added to `.gitignore`

## Checklist Before Committing

- [ ] No real API keys in code
- [ ] No real credentials in config files
- [ ] `eas.json` uses environment variables or placeholders
- [ ] Service account JSON files are in `.gitignore`
- [ ] `.env` files are in `.gitignore`
- [ ] Default passwords are documented as temporary

## If You Accidentally Commit Secrets

1. **Immediately rotate/revoke** the exposed secrets
2. Remove from git history using `git filter-branch` or BFG Repo-Cleaner
3. Add the file to `.gitignore`
4. Force push (if you have permission) or contact repository owner
