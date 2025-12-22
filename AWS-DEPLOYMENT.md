# AWS Deployment Guide for Pokytalk

This guide will help you deploy Pokytalk to AWS with:
- **Frontend**: AWS Amplify (static hosting)
- **Backend**: AWS App Runner (containerized Node.js service)

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│  AWS Amplify    │────────▶│  AWS App Runner   │
│  (Frontend)     │  HTTPS  │  (Backend API)    │
│  Next.js Static │         │  Node.js + Socket │
└─────────────────┘         └──────────────────┘
```

## Prerequisites

- AWS Account
- GitHub repository with your code
- Domain name (optional, Amplify provides free subdomain)

## Step 1: Deploy Backend to AWS App Runner

### Option A: Using apprunner.yaml (Recommended)

1. **Go to AWS App Runner Console**
   - Navigate to: https://console.aws.amazon.com/apprunner/
   - Click "Create service"

2. **Source Configuration**
   - Choose "Source code repository"
   - Connect your GitHub account if not already connected
   - Select repository: `shahzoorali/pokytalk`
   - Branch: `main`
   - **Root directory**: Leave empty (we'll build from root)

3. **Build Configuration**
   - Choose "Use a configuration file"
   - App Runner will automatically detect `apprunner.yaml` in the root directory
   - **Note**: The apprunner.yaml is configured to build from the monorepo root

4. **Service Configuration**
   - Service name: `pokytalk-backend`
   - CPU: 1 vCPU (minimum)
   - Memory: 2 GB
   - Port: 3001

5. **Environment Variables**
   Add these in the App Runner console:
   ```
   NODE_ENV=production
   PORT=3001
   HOST=0.0.0.0
   FRONTEND_URL=https://your-amplify-url.amplifyapp.com
   ```
   **Note**: You'll update `FRONTEND_URL` after deploying the frontend.

6. **Create Service**
   - Review and click "Create & deploy"
   - Wait for deployment (5-10 minutes)
   - **Copy the service URL** (e.g., `https://abc123.us-east-1.awsapprunner.com`)

### Option B: Manual Configuration

If you prefer manual setup:

1. **Source Configuration**
   - Repository: Your GitHub repo
   - Branch: `main`
   - Root directory: Leave empty

2. **Build Configuration**
   - Build command:
     ```bash
     npm install && cd shared && npm install && npm run build && cd .. && cd backend && npm install && npm run build
     ```
   - Start command:
     ```bash
     cd backend && npm start
     ```
   - Port: `3001`

3. **Environment Variables** (same as Option A)

## Step 2: Deploy Frontend to AWS Amplify

1. **Go to AWS Amplify Console**
   - Navigate to: https://console.aws.amazon.com/amplify/
   - Click "New app" → "Host web app"

2. **Connect Repository**
   - Select "GitHub"
   - Authorize AWS to access your GitHub account
   - Select repository: `shahzoorali/pokytalk`
   - Branch: `main`

3. **Configure Build Settings**
   - Amplify will auto-detect `amplify.yml`
   - Verify the configuration:
     - Root directory: `/` (root of monorepo)
     - Build settings: Uses `amplify.yml`

4. **Environment Variables**
   Add these in Amplify Console → App Settings → Environment Variables:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-apprunner-url.us-east-1.awsapprunner.com
   ```
   **Important**: Use the App Runner service URL from Step 1.

5. **Review and Deploy**
   - Review settings
   - Click "Save and deploy"
   - Wait for build to complete (5-10 minutes)

6. **Get Your Frontend URL**
   - After deployment, Amplify provides a URL like: `https://main.abc123.amplifyapp.com`
   - Copy this URL

## Step 3: Update Backend CORS Configuration

1. **Go back to AWS App Runner**
   - Navigate to your `pokytalk-backend` service
   - Go to "Configuration" → "Environment variables"
   - Update `FRONTEND_URL` to your Amplify URL:
     ```
     FRONTEND_URL=https://main.abc123.amplifyapp.com
     ```
   - Click "Save changes"
   - App Runner will automatically redeploy

## Step 4: Verify Deployment

### Test Backend Health
```bash
curl https://your-apprunner-url.us-east-1.awsapprunner.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "stats": {...}
}
```

### Test Frontend
1. Open your Amplify URL in a browser
2. Open browser DevTools (F12)
3. Check Console for any errors
4. Check Network tab for WebSocket connections

### Test Voice Chat
1. Open the app in two different browser windows/tabs
2. Click "Start Voice Chat" on both
3. Verify users match
4. Test audio connection

## Environment Variables Reference

### Backend (App Runner)
| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3001` | Server port |
| `HOST` | `0.0.0.0` | Listen on all interfaces |
| `FRONTEND_URL` | `https://your-amplify-url.amplifyapp.com` | Frontend URL for CORS |

### Frontend (Amplify)
| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://your-apprunner-url.awsapprunner.com` | Backend API URL |

## Custom Domain Setup (Optional)

### For Amplify (Frontend)

1. **In Amplify Console**
   - Go to "Domain management"
   - Click "Add domain"
   - Enter your domain name
   - Follow DNS configuration instructions

2. **Update Environment Variables**
   - Update `FRONTEND_URL` in App Runner to your custom domain
   - Update `NEXT_PUBLIC_BACKEND_URL` in Amplify (if needed)

### For App Runner (Backend)

App Runner provides a default HTTPS URL. For custom domain:

1. **Use AWS Route 53**
   - Create a hosted zone for your domain
   - Create a CNAME record pointing to App Runner URL

2. **Or Use CloudFront**
   - Create CloudFront distribution
   - Point to App Runner origin
   - Use custom domain with CloudFront

## Monitoring and Logs

### App Runner Logs
- Go to App Runner service → "Logs" tab
- View real-time logs
- Or check CloudWatch Logs

### Amplify Logs
- Go to Amplify app → "Monitoring" tab
- View build logs and access logs

### CloudWatch Metrics
- App Runner: CPU, Memory, Request count
- Amplify: Build time, Deploy time

## Cost Estimation

### AWS App Runner
- **Free tier**: 750 hours/month of 1 vCPU, 2 GB memory
- **After free tier**: ~$0.007/vCPU-hour, ~$0.0008/GB-hour
- **Estimated monthly cost**: $10-20 (for moderate usage)

### AWS Amplify
- **Free tier**: 1000 build minutes/month, 15 GB served/month
- **After free tier**: $0.01/build minute, $0.15/GB served
- **Estimated monthly cost**: $1-5 (for moderate traffic)

### Total Estimated Cost
- **With free tier**: $0-5/month
- **After free tier**: $15-30/month

## Troubleshooting

### Backend Issues

**Problem**: Backend build fails
- **Solution**: Check App Runner logs for errors
- Verify Node.js version (should be 20)
- Ensure shared package builds before backend

**Problem**: CORS errors
- **Solution**: Verify `FRONTEND_URL` matches your Amplify URL exactly
- Check backend logs for CORS rejection messages

**Problem**: WebSocket connection fails
- **Solution**: App Runner supports WebSockets by default
- Check that port 3001 is configured correctly
- Verify Socket.io CORS settings

### Frontend Issues

**Problem**: Frontend build fails
- **Solution**: Check Amplify build logs
- Verify `amplify.yml` configuration
- Ensure shared package builds first

**Problem**: Can't connect to backend
- **Solution**: Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Check browser console for connection errors
- Verify backend is running (test `/health` endpoint)

**Problem**: Environment variables not working
- **Solution**: Rebuild frontend after adding variables
- Variables must start with `NEXT_PUBLIC_` to be available in browser
- Clear browser cache

### Connection Issues

**Problem**: Users can't match
- **Solution**: Verify both frontend and backend are deployed
- Check that both are using correct URLs
- Verify Socket.io connection in browser DevTools

**Problem**: Audio not working
- **Solution**: Check WebRTC connection in browser
- Verify STUN/TURN servers are accessible
- Check browser console for WebRTC errors

## Scaling Considerations

### App Runner Auto-Scaling
- App Runner automatically scales based on traffic
- Configure min/max instances in service settings
- Default: 1-25 instances

### Amplify Scaling
- Amplify automatically handles traffic spikes
- CDN distribution for global performance
- No manual scaling needed

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use AWS Secrets Manager for sensitive data (if needed)

2. **CORS Configuration**
   - Only allow specific frontend domains
   - Don't use wildcard (`*`) in production

3. **HTTPS**
   - Both Amplify and App Runner provide HTTPS by default
   - No additional SSL configuration needed

4. **Rate Limiting**
   - Consider adding rate limiting for production
   - Use AWS WAF if needed

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Set up monitoring and alerts
3. ✅ Configure custom domain (optional)
4. ✅ Set up CI/CD for automatic deployments
5. ✅ Add database if needed (for user persistence)
6. ✅ Set up backup strategy

## Support

For issues:
- Check AWS App Runner documentation
- Check AWS Amplify documentation
- Review application logs
- Test locally first before deploying

---

**Deployment Status Checklist**

- [ ] Backend deployed to App Runner
- [ ] Frontend deployed to Amplify
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Health check endpoint working
- [ ] Frontend connects to backend
- [ ] WebSocket connections working
- [ ] Voice chat tested
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up

