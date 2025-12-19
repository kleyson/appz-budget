# GitHub Actions Workflows

## Test Workflow (`test.yml`)

Runs on:
- Pull requests to `main`, `master`, or `develop`
- Pushes to `main`, `master`, or `develop`

What it does:
- Runs backend tests with pytest
- Runs frontend linting (non-blocking)
- Builds frontend to verify it compiles
- **Blocks PR merge if tests fail** (when branch protection is enabled)

### Enabling PR Blocking

To block PRs when tests fail:
1. Go to repository Settings → Branches
2. Add branch protection rule for `main` (or `master`)
3. Enable "Require status checks to pass before merging"
4. Select status check: `Run Tests / test`

## Build and Release (`build-and-release.yml`)

Runs on:
- Pushes to tags matching `v*` (e.g., `v1.0.0`)
- Manual workflow dispatch

What it does:
- Builds Docker image with frontend and backend
- Pushes to GitHub Container Registry (ghcr.io)
- Tags image with version, latest, and branch name

### Using the Docker Image

```bash
# Pull the image
docker pull ghcr.io/your-username/your-repo:latest

# Run the container
docker run -p 8000:8000 \
  -e API_KEY=your-secret-api-key \
  ghcr.io/your-username/your-repo:latest
```

### Build Arguments

- `VITE_API_KEY`: Required at build time for frontend API configuration
  - Can be set as GitHub secret: `VITE_API_KEY`
  - Or passed via workflow dispatch input
