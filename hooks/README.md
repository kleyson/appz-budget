# Git Hooks

This directory contains git hooks that are shared with the team. These hooks ensure code quality and consistency across all commits.

## Installation

After cloning the repository, run:

```bash
./install-hooks.sh
```

This will copy all hooks from this directory to `.git/hooks/` and make them executable.

## Available Hooks

### pre-commit

Runs `make verify` before each commit to ensure:

- ✅ Backend formatting, linting, and tests pass
- ✅ Frontend formatting, linting, type checking, and tests pass
- ✅ Mobile type checking, linting, and tests pass
- ✅ TUI formatting, linting, and tests pass

If any check fails, the commit will be blocked. You can skip the hook with `git commit --no-verify` (not recommended).

## Adding New Hooks

1. Add your hook script to this directory
2. Make it executable: `chmod +x hooks/your-hook-name`
3. Run `./install-hooks.sh` to install it
4. Document it in this README




