# Deployment Guide

This project is structured for separate deployments:
- **Frontend**: AWS Amplify (uses `amplify.yml`)
- **Backend**: AWS App Runner (uses `backend/apprunner.yaml`)

## Project Structure

```
pokytalk/
├── amplify.yml              # Frontend deployment config (AWS Amplify)
├── frontend/                # Frontend code (Next.js)
│   ├── src/
│   │   ├── types.ts         # Shared types (inlined)
│   │   ├── app/
│   │   ├── components/
│   │   └── hooks/
│   └── package.json
├── backend/                 # Backend code (Node.js + Socket.io)
│   ├── apprunner.yaml       # Backend deployment config (AWS App Runner)
│   ├── src/
│   │   ├── types.ts         # Shared types (inlined)
│   │   ├── index.ts
│   │   └── ...
│   └── package.json
└── package.json             # Root package (for local development)
```

## Backend Deployment (AWS App Runner)

### Step 1: Create App Runner Service

1. Go to AWS App Runner Console: https://console.aws.amazon.com/apprunner/
2. Click "Create service"

### Step 2: Configure Source

- **Source**: Source code repository
- **Repository**: Your GitHub repo (e.g., `shahzoorali/pokytalk`)
- **Branch**: `main`
- **Root directory**: `backend`

### Step 3: Configure Build

- Choose **"Use a configuration file"**
- App Runner will find `backend/apprunner.yaml`

### Step 4: Service Settings

- **Service name**: `pokytalk-backend`
- **CPU**: 1 vCPU
- **Memory**: 2 GB

### Step 5: Environment Variables

Add these in the App Runner console:
```
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=https://your-amplify-url.amplifyapp.com
```

### Step 6: Create Service

- Review and create
- Wait for deployment (~5-10 minutes)
- Copy the service URL (e.g., `https://abc123.us-east-1.awsapprunner.com`)

---

## Frontend Deployment (AWS Amplify)

### Step 1: Create Amplify App

1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"

### Step 2: Connect Repository

- **Source**: GitHub
- **Repository**: Your repo
- **Branch**: `main`

### Step 3: Configure Build

- Amplify will auto-detect `amplify.yml`
- Root directory: Leave empty (uses repo root)

### Step 4: Environment Variables

Add in Amplify Console → Environment Variables:
```
NEXT_PUBLIC_BACKEND_URL=https://your-apprunner-url.awsapprunner.com
```

### Step 5: Deploy

- Review and deploy
- Wait for build (~5-10 minutes)
- Copy the Amplify URL (e.g., `https://main.abc123.amplifyapp.com`)

---

## Post-Deployment

### Update Backend CORS

After getting your Amplify URL, update the App Runner environment variable:
- Key: `FRONTEND_URL`
- Value: `https://main.abc123.amplifyapp.com`

### Test the Application

1. Open your Amplify URL in a browser
2. Check browser console for connection logs
3. Test with two browser tabs to verify matching works

---

## Local Development

```bash
# Install dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:3001
```

---

## Configuration Files

### `backend/apprunner.yaml`
- Runtime: nodejs18
- Build: `npm install && npm run build`
- Start: `npm start`
- Port: 3001

### `amplify.yml`
- Build: `cd frontend && npm install && npm run build`
- Artifacts: `frontend/out`

