# Fixing AWS Amplify Build Error

## The Problem

The error `cd: frontend: No such file or directory` means Amplify can't find the `frontend` directory.

## Most Likely Cause

**Amplify Root Directory Setting** - Check your Amplify app settings:

1. Go to AWS Amplify Console
2. Select your app
3. Go to **App settings** → **General**
4. Check **Root directory** setting

### If Root Directory is Set Incorrectly:

- **Should be**: Empty (or `/`)
- **If set to**: `frontend` or something else, that's the problem!

### Solution:

1. **Option A: Clear Root Directory** (Recommended)
   - Set Root directory to: **Empty** (leave blank)
   - This makes Amplify use the repo root
   - The `amplify.yml` will then find `frontend/` correctly

2. **Option B: Update amplify.yml for Subdirectory**
   - If root is set to `frontend`, update `amplify.yml` to not cd into frontend
   - But this is not recommended

## Current amplify.yml Structure

The current `amplify.yml` expects:
- Root directory: Empty (repo root)
- Frontend code: `frontend/` subdirectory
- Build output: `frontend/out/`

## Steps to Fix

1. **Check Amplify Settings**:
   - App settings → General → Root directory
   - Should be **empty**

2. **If Root Directory is Empty**:
   - The updated `amplify.yml` should work
   - Try redeploying

3. **If Root Directory is Set to `frontend`**:
   - Change it to empty
   - Or update `amplify.yml` to work from `frontend/` as root

## Alternative: Use Frontend as Root

If you want to set root to `frontend`, update `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: out
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

But **recommended approach**: Keep root empty and use the current `amplify.yml`.

