# OneDev EAS Mobile Deployment Setup

This guide explains how to configure OneDev to automatically build and deploy mobile apps using EAS (Expo Application Services).

## Overview

The OneDev build spec (`.onedev-buildspec.yml`) is configured to:

- Build iOS and Android apps using EAS when code changes
- Automatically submit to App Store and Google Play when tags are created
- Run builds in parallel for faster deployment

## Prerequisites

1. **OneDev Project**: Your repository must be connected to a OneDev instance
2. **EAS Account**: You must have an Expo account with EAS access
3. **EAS Token**: Generate an Expo access token for CI/CD
4. **OneDev Shell Executor**: The build spec uses shell executors (not containers) for better performance. You'll need to configure a shell executor in OneDev:

   - **Server Shell Executor**: Runs on OneDev server (no agents needed)
   - **Remote Shell Executor**: Runs on agents (more flexible, requires agent installation)

   See [OneDev Plain Old Build documentation](https://docs.onedev.io/tutorials/cicd/plain-old-build) for setup instructions.

## Setup Steps

### 1. Generate Expo Access Token

1. Go to [expo.dev](https://expo.dev)
2. Navigate to Account Settings → Access Tokens
3. Create a new token with appropriate permissions
4. Copy the token (you'll need it for OneDev secrets)

### 2. Configure OneDev Shell Executor

The build spec uses shell executors instead of containers for better performance. Configure one of the following:

**Option A: Server Shell Executor** (Simpler, no agents needed)

1. Go to **Administration** → **Job Executors**
2. Create a new executor of type **Server Shell Executor**
3. Test and save

**Option B: Remote Shell Executor** (More flexible, requires agents)

1. Install OneDev agent on a machine with Node.js installed
2. Go to **Administration** → **Job Executors**
3. Create a new executor of type **Remote Shell Executor**
4. Select your agent
5. Test and save

See [OneDev Plain Old Build documentation](https://docs.onedev.io/tutorials/cicd/plain-old-build) for detailed setup.

### 3. Configure OneDev Job Secret

In your OneDev project:

1. Go to **Project Settings** → **Job Secrets**
2. Add a new secret:
   - **Name**: `expo_token`
   - **Value**: Your Expo access token from step 1
   - **Authorization**: Select appropriate users/groups

### 4. Verify Build Spec

The build spec file (`.onedev-buildspec.yml`) is already configured with:

- **Build Mobile iOS**: Builds iOS app on tag creation or main branch updates
- **Build Mobile Android**: Builds Android app on tag creation or main branch updates
- **Submit iOS to App Store**: Submits iOS app after successful build (on tags)
- **Submit Android to Google Play**: Submits Android app after successful build (on tags)

### 5. Configure Build Triggers

The build spec triggers on:

- **Tag Creation**: When a tag matching `v*` is created (e.g., `v1.0.0`)
- **Branch Updates**: When `main` branch is updated and `mobile/**` files change

You can customize triggers in `.onedev-buildspec.yml`:

```yaml
triggers:
  - type: TagCreateTrigger
    tags: "v*"
  - type: BranchUpdateTrigger
    branches: "main"
    paths: "mobile/**"
```

## Build Jobs

All jobs use **shell executors** (not containers) for better performance. This means:

- No container overhead
- Direct access to host Node.js (must be installed on executor)
- Faster execution
- Simpler setup

### Build Mobile iOS

- **Trigger**: Tags `v*` or updates to `main` branch with mobile changes
- **Executor**: Shell executor (server or remote)
- **Steps**:
  1. Checkout code
  2. Verify Node.js installation
  3. Install EAS CLI globally
  4. Install mobile dependencies
  5. Login to EAS
  6. Build iOS app with production profile (runs on EAS cloud)
  7. Publish artifacts

### Build Mobile Android

- **Trigger**: Tags `v*` or updates to `main` branch with mobile changes
- **Executor**: Shell executor (server or remote)
- **Steps**:
  1. Checkout code
  2. Verify Node.js installation
  3. Install EAS CLI globally
  4. Install mobile dependencies
  5. Login to EAS
  6. Build Android app with production profile (runs on EAS cloud)
  7. Publish artifacts

### Submit iOS to App Store

- **Trigger**: Tags `v*`
- **Dependencies**: Requires "Build Mobile iOS" to succeed
- **Executor**: Shell executor (server or remote)
- **Steps**:
  1. Checkout code
  2. Verify Node.js installation
  3. Install EAS CLI globally
  4. Install mobile dependencies
  5. Login to EAS
  6. Submit iOS app to App Store

### Submit Android to Google Play

- **Trigger**: Tags `v*`
- **Dependencies**: Requires "Build Mobile Android" to succeed
- **Executor**: Shell executor (server or remote)
- **Steps**:
  1. Checkout code
  2. Verify Node.js installation
  3. Install EAS CLI globally
  4. Install mobile dependencies
  5. Login to EAS
  6. Submit Android app to Google Play

## Workflow

### Automatic Builds

1. **On Push to Main**: If `mobile/**` files change, builds are triggered
2. **On Tag Creation**: When you create a tag like `v1.0.0`:
   - iOS and Android builds start
   - After successful builds, submissions to stores start automatically

### Manual Builds

You can also trigger builds manually in OneDev:

1. Go to **Builds** → **Run Job**
2. Select the job (e.g., "Build Mobile iOS")
3. Click **Run**

## Configuration

### Environment Variables

The build spec uses the `EXPO_TOKEN` environment variable which is set from the OneDev job secret `expo_token`.

### Shell Executors

The build spec uses shell executors (not containers) as recommended in the [OneDev Plain Old Build documentation](https://docs.onedev.io/tutorials/cicd/plain-old-build). This provides:

- Better performance (no container overhead)
- Simpler setup
- Direct access to host tools

**Requirements:**

- Node.js 18+ must be installed on the executor (server or agent)
- Git must be installed
- npm must be available

### Build Profiles

Builds use the `production` profile from `mobile/eas.json`. Make sure your `eas.json` is properly configured with:

- iOS build settings
- Android build settings
- Submission credentials (for store submission)

### Timeouts

- **Build Jobs**: 4 hours (14400 seconds)
- **Submit Jobs**: 2 hours (7200 seconds)

Adjust these in `.onedev-buildspec.yml` if needed:

```yaml
timeout: 14400 # 4 hours
```

## Troubleshooting

### Build Fails with "Node.js not found"

- Ensure Node.js 18+ is installed on the executor (server or agent)
- Verify Node.js is in the PATH
- For remote shell executor, check agent has Node.js installed

### Build Fails with "EXPO_TOKEN not found"

- Ensure the job secret `expo_token` is configured in OneDev
- Check that the secret is authorized for the build job
- Verify the token is valid and not expired

### EAS Login Fails

- Verify the Expo token is correct
- Check token permissions in Expo dashboard
- Ensure token hasn't been revoked

### Build Timeout

- Increase timeout in build spec
- Check EAS build queue status
- Verify network connectivity from OneDev agents

### Submission Fails

- Ensure `eas.json` has correct submission credentials
- Verify App Store Connect / Google Play credentials
- Check that previous build completed successfully

## Customization

### Change Build Profile

To use a different EAS build profile, modify the build command:

```yaml
commands: |
  eas build --platform ios --profile preview --non-interactive
```

### Add Additional Steps

You can add steps before or after builds:

```yaml
- type: CommandStep
  name: "Run Tests"
  runInContainer: true
  image: node:18
  workingDir: mobile
  interpreter:
    type: ShellInterpreter
    shell: bash
    commands: |
      npm test
  condition: SUCCESSFUL
```

### Custom Triggers

Modify triggers to run on different conditions:

```yaml
triggers:
  - type: PullRequestUpdateTrigger
    branches: "main"
  - type: ScheduleTrigger
    cronExpression: "0 2 * * *" # Daily at 2 AM
    branches: "main"
```

## Monitoring

- **Build Status**: Check OneDev build dashboard
- **EAS Builds**: Monitor at [expo.dev/builds](https://expo.dev/builds)
- **Store Submissions**: Check App Store Connect / Google Play Console

## Next Steps

1. Configure the `expo_token` secret in OneDev
2. Test a build by pushing to main branch or creating a tag
3. Monitor the first build to ensure everything works
4. Adjust configuration as needed

## Additional Resources

- [OneDev Build Spec Documentation](https://docs.onedev.io/tutorials/cicd/build-spec)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
