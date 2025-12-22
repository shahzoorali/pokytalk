# App Runner Setup Guide

## Configuration Files

You have **two options** for App Runner setup:

### Option 1: Root Directory Setup (Recommended for Monorepo)

**Root Directory**: Leave **EMPTY** (or set to `/`)

**Config File Location**: `apprunner.yaml` in the **repository root**

**App Runner Settings:**
- Source: GitHub repository
- Branch: `main`
- **Root directory**: Leave empty (this means repo root)
- Build configuration: "Use a configuration file"
- App Runner will automatically find `apprunner.yaml` in the root

**Why this works:**
- The `apprunner.yaml` in root can access both `shared/` and `backend/` folders
- Builds shared package first, then backend
- All dependencies are properly resolved

### Option 2: Backend Directory Setup (Alternative)

**Root Directory**: `backend`

**Config File Location**: `backend/apprunner.yaml`

**App Runner Settings:**
- Source: GitHub repository  
- Branch: `main`
- **Root directory**: `backend`
- Build configuration: "Use a configuration file"
- App Runner will find `backend/apprunner.yaml`

**Note**: This option requires modifying `backend/apprunner.yaml` to handle the shared package differently, which is more complex.

## Recommended: Use Option 1

### Step-by-Step Setup:

1. **Go to AWS App Runner Console**
   - https://console.aws.amazon.com/apprunner/
   - Click "Create service"

2. **Source Configuration**
   - Choose "Source code repository"
   - Connect GitHub if needed
   - Repository: `shahzoorali/pokytalk`
   - Branch: `main`
   - **Root directory**: **LEAVE EMPTY** (this is the key!)

3. **Build Configuration**
   - Choose "Use a configuration file"
   - App Runner will automatically detect `apprunner.yaml` in the root

4. **Service Configuration**
   - Service name: `pokytalk-backend`
   - CPU: 1 vCPU
   - Memory: 2 GB
   - Port: 3001

5. **Environment Variables**
   Add these:
   ```
   NODE_ENV=production
   PORT=3001
   HOST=0.0.0.0
   FRONTEND_URL=https://main.d3gfn1idq9v9m2.amplifyapp.com
   ```

6. **Create Service**
   - Review and create
   - Wait for deployment

## Troubleshooting

### Error: "apprunner.yaml not found"

**Cause**: Root directory is set incorrectly

**Solution**: 
- Make sure **Root directory** is **EMPTY** (not `/`, not `backend`, just empty)
- Or verify `apprunner.yaml` exists in the repository root

### Error: "Cannot find module @pokytalk/shared"

**Cause**: Shared package not built before backend

**Solution**: 
- Verify `apprunner.yaml` builds shared package first
- Check build logs to see if shared package builds successfully

### Error: Build fails

**Check build logs for:**
1. Node.js version (should be 20)
2. npm install errors
3. TypeScript compilation errors
4. Missing dependencies

## File Structure

```
pokytalk/                    ← Root directory (empty in App Runner)
├── apprunner.yaml          ← Config file (Option 1)
├── package.json
├── shared/
│   ├── package.json
│   └── src/
├── backend/
│   ├── apprunner.yaml      ← Config file (Option 2, not recommended)
│   ├── package.json
│   └── src/
└── frontend/
```

## Verification

After deployment, test the backend:

```bash
curl https://your-apprunner-url.awsapprunner.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "stats": {...}
}
```

