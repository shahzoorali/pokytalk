# Quick Deployment Checklist

## Backend: AWS App Runner

1. **Go to**: https://console.aws.amazon.com/apprunner/
2. **Create service** → Source code repository
3. **Repository**: `shahzoorali/pokytalk`, Branch: `main`
4. **Root directory**: Leave empty (uses repo root)
5. **Build config**: Use configuration file (auto-detects `apprunner.yaml`)
5. **Environment variables**:
   ```
   NODE_ENV=production
   PORT=3001
   HOST=0.0.0.0
   FRONTEND_URL=https://your-amplify-url.amplifyapp.com
   ```
6. **Copy service URL** (e.g., `https://abc123.us-east-1.awsapprunner.com`)

## Frontend: AWS Amplify

1. **Go to**: https://console.aws.amazon.com/amplify/
2. **New app** → Host web app → GitHub
3. **Repository**: `shahzoorali/pokytalk`, Branch: `main`
4. **Build settings**: Auto-detects `amplify.yml`
5. **Environment variables**:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-apprunner-url.awsapprunner.com
   ```
6. **Copy Amplify URL** (e.g., `https://main.abc123.amplifyapp.com`)

## Update Backend CORS

1. Go back to App Runner
2. Update `FRONTEND_URL` with your Amplify URL
3. Service will auto-redeploy

## Test

```bash
# Test backend
curl https://your-apprunner-url.awsapprunner.com/health

# Open frontend in browser
# Open DevTools → Check console for errors
# Test voice chat with two tabs
```

## Cost

- **Free tier**: $0-5/month
- **After free tier**: ~$15-30/month

See [AWS-DEPLOYMENT.md](AWS-DEPLOYMENT.md) for detailed instructions.

