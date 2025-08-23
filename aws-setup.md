# AWS Amplify Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prerequisites
- AWS Account
- GitHub account
- Code pushed to GitHub repository

### 2. AWS Amplify Setup

1. **Go to AWS Amplify Console**
   - Navigate to: https://console.aws.amazon.com/amplify/

2. **Create New App**
   - Click "New app" → "Host web app"
   - Select "GitHub" as source
   - Connect your GitHub account
   - Select your pokytalk repository

3. **Configure Build Settings**
   - Amplify will auto-detect the `amplify.yml` file
   - Verify the build configuration
   - Set the root directory to `/` (monorepo root)

### 3. Environment Variables

Set these in Amplify Console → App Settings → Environment Variables:

```
NODE_ENV=production
FRONTEND_URL=https://your-app-name.amplifyapp.com
BACKEND_URL=https://your-app-name.amplifyapp.com
NEXT_PUBLIC_BACKEND_URL=https://your-app-name.amplifyapp.com
```

### 4. Advanced Settings

**Build Image**: Amazon Linux 2
**Node.js Version**: 18.x
**Package Manager**: npm

### 5. Domain Configuration (Optional)

- Add custom domain in Amplify console
- Update CORS settings in backend if using custom domain

## 🔧 Alternative: Separate Backend Deployment

If Amplify monorepo deployment has issues, deploy separately:

### Frontend: AWS Amplify
```bash
# Deploy only frontend
cd frontend
npm run build
# Upload build files to Amplify
```

### Backend: AWS AppRunner
```bash
# Create apprunner.yaml
# Deploy backend container to AppRunner
```

## 🛠️ Troubleshooting

### Common Issues:
1. **Build fails**: Check Node.js version compatibility
2. **Socket.io issues**: Verify WebSocket support in Amplify
3. **CORS errors**: Update backend CORS settings with Amplify URL

### Monitoring:
- Check Amplify build logs
- Monitor backend logs in CloudWatch
- Test Socket.io connections in browser console

## 📊 Expected Costs (Estimated)

**AWS Amplify**: 
- Build minutes: ~$0.01 per minute
- Hosting: ~$0.15 per GB served
- Storage: ~$0.023 per GB

**Monthly estimate for moderate usage**: $5-15/month

## 🎯 Production Considerations

1. **STUN/TURN Servers**: Consider dedicated servers for WebRTC
2. **SSL Certificate**: Amplify provides free SSL
3. **Monitoring**: Set up CloudWatch alarms
4. **Scaling**: Configure auto-scaling if needed
5. **Backup**: Regular database backups (if added later)

## 🚀 Go Live Checklist

- [ ] Code pushed to GitHub
- [ ] Amplify app created and connected
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Domain configured (optional)
- [ ] SSL certificate active
- [ ] Socket.io connections working
- [ ] WebRTC audio tested
- [ ] Mobile responsiveness verified
- [ ] Performance optimized
