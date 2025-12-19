# Security Audit Report - Sensitive Information Found

## 🚨 CRITICAL - Must Remove Immediately

### 1. **mobile/eas.json** - Real Apple Developer Credentials
**File:** `mobile/eas.json`
**Status:** ⚠️ **COMMITTED TO GIT**
**Contains:**
- `appleId`: "kleyson@kleyson.ca" (your personal email)
- `ascAppId`: "6755663664" (App Store Connect App ID)
- `appleTeamId`: "JQ56AD9KGG" (Apple Developer Team ID)

**Action Required:**
1. Remove this file from git history immediately
2. Use `mobile/eas.json.template` instead (already exists with placeholders)
3. Add `mobile/eas.json` to `.gitignore` (already there, but verify it's working)
4. Rotate/verify your Apple Developer credentials haven't been compromised

---

## ⚠️ HIGH PRIORITY - Personal Information

### 2. **Personal Email Address in Documentation**
**Files:**
- `mobile/SUBMIT_TO_APPLE.md` (lines 16, 110, 119)
- `mobile/APPLE_SETUP.md` (line 8, 88)
- `mobile/NEXT_STEPS.md` (line 17)
- `mobile/APPLE_NEXT_STEPS.md` (line 4)

**Contains:** `kleyson@kleyson.ca`

**Action Required:**
- Replace with placeholder: `YOUR_APPLE_ID@example.com` or `your-email@example.com`

### 3. **Apple Developer IDs in Documentation**
**Files:**
- `mobile/APPLE_NEXT_STEPS.md` (lines 4-5)
- `mobile/eas.json` (already covered above)

**Contains:**
- Apple Team ID: `JQ56AD9KGG`
- App Store Connect App ID: `6755663664`

**Action Required:**
- Replace with placeholders: `YOUR_APPLE_TEAM_ID` and `YOUR_ASC_APP_ID`

---

## ⚠️ MEDIUM PRIORITY - Default Credentials & Secrets

### 4. **Default Admin Credentials in Seed File**
**File:** `backend/seed.py` (lines 90-91, 99-100)

**Contains:**
- Email: `admin@email.com`
- Password: `admin`

**Note:** This is documented as temporary, but still exposed. Consider:
- Making it configurable via environment variables
- Adding a warning that these should be changed immediately
- Using a more secure default or requiring manual setup

### 5. **Default JWT Secret Key**
**File:** `backend/utils/auth.py` (line 11)

**Contains:**
```python
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
```

**Action Required:**
- This is a fallback, which is acceptable, but consider:
  - Making it fail if not set in production (no fallback)
  - Or using a more secure random default that's different per installation

### 6. **Default API Keys in Multiple Files**
**Files:**
- `docker-compose.yml` (line 8)
- `docker-compose.build.yml` (line 7, 13)
- `docker-compose.dev.yml` (line 7, 11)
- `tui/src/config/mod.rs` (line 28)
- Various documentation files

**Contains:** `your-secret-api-key-change-this`

**Note:** These are documented defaults, but consider:
- Making them fail if not set (no default)
- Or using environment variable placeholders in examples

---

## ℹ️ LOW PRIORITY - Public Information (May Want to Review)

### 7. **Docker Image Reference**
**File:** `docker-compose.yml` (line 3)

**Contains:** `ghcr.io/kleyson/appz-budget:latest`

**Note:** This is your GitHub Container Registry. If you want to keep this private, consider:
- Using a different registry
- Or documenting that users should change this

### 8. **Demo Server URL**
**Files:** Multiple files reference `https://budget.appz.wtf`

**Note:** This appears to be intentional for demo purposes. Consider if you want this public or if it should be removed from code examples.

---

## ✅ GOOD - Already Protected

1. ✅ `.gitignore` properly excludes:
   - `*.db` files (database files)
   - `.env` files
   - `mobile/eas.json` (in .gitignore, but file was committed before)
   - Private keys (`.pem`, `.key`, `.p8`, `.p12`)
   - Service account JSON files

2. ✅ `mobile/eas.json.template` exists with placeholders

3. ✅ `SECURITY.md` documents security best practices

---

## 📋 Recommended Actions Summary

### Immediate (Critical):
1. **Remove `mobile/eas.json` from git history** (it's already in .gitignore, but was committed)
2. **Verify Apple credentials** haven't been compromised
3. **Replace personal email** in documentation files

### High Priority:
4. Replace Apple Team ID and App ID in documentation
5. Review and potentially remove demo server URLs from code

### Medium Priority:
6. Make default admin credentials configurable
7. Consider removing JWT secret fallback in production
8. Review default API key usage

### Verification:
9. Run: `git log --all --full-history -- mobile/eas.json` to see commit history
10. Use `git filter-branch` or BFG Repo-Cleaner to remove from history
11. Force push after cleaning (if you have permission)

---

## 🔧 Commands to Fix

### Remove eas.json from git history:
```bash
# Option 1: Using git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch mobile/eas.json" \
  --prune-empty --tag-name-filter cat -- --all

# Option 2: Using BFG Repo-Cleaner (recommended)
# Download BFG, then:
bfg --delete-files mobile/eas.json
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Verify it's removed:
```bash
git log --all --full-history -- mobile/eas.json
# Should return nothing
```

### After cleanup:
```bash
# Force push (WARNING: This rewrites history)
git push origin --force --all
git push origin --force --tags
```

---

**Generated:** $(date)
**Repository:** budget
**Status:** ⚠️ Action Required

