# AWS Deployment Guide for Pokytalk

## Current Status
✅ **Frontend**: Successfully deployed on AWS Amplify  
❌ **Backend**: Needs separate deployment  

## Option 1: AWS App Runner (Recommended)

### Step 1: Deploy Backend to AWS App Runner

1. **Go to AWS App Runner Console**
   - Navigate to AWS App Runner
   - Click "Create service"

2. **Source Configuration**
   - Choose "Source code repository"
   - Connect your GitHub repository: `shahzoorali/pokytalk`
   - Branch: `main`
   - Root directory: `backend`

3. **Build Configuration**
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Port: `3001`

4. **Service Configuration**
   - Service name: `pokytalk-backend`
   - CPU: 1 vCPU
   - Memory: 2 GB
   - Environment variables:
     ```
     NODE_ENV=production
     PORT=3001
     ```

5. **Create Service**
   - Review and create
   - Note the service URL (e.g., `https://abc123.us-east-1.awsapprunner.com`)

### Step 2: Update Frontend Environment Variables

1. **Go to AWS Amplify Console**
   - Navigate to your app: `pokytalk`
   - Go to "Environment variables"

2. **Add Environment Variable**
   - Key: `NEXT_PUBLIC_BACKEND_URL`
   - Value: Your App Runner service URL (e.g., `https://abc123.us-east-1.awsapprunner.com`)

3. **Redeploy Frontend**
   - Amplify will automatically trigger a new build

## Option 2: AWS EC2 (Alternative)

### Step 1: Launch EC2 Instance

1. **Launch Instance**
   - AMI: Amazon Linux 2
   - Instance type: t3.small (or larger)
   - Security group: Allow HTTP (80), HTTPS (443), Custom TCP (3001)

2. **Connect and Setup**
   ```bash
   # Connect via SSH
   ssh -i your-key.pem ec2-user@your-instance-ip
   
   # Install Node.js
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   
   # Install Git
   sudo yum install -y git
   ```

3. **Deploy Backend**
   ```bash
   # Clone repository
   git clone https://github.com/shahzoorali/pokytalk.git
   cd pokytalk
   
   # Install dependencies
   npm install
   cd backend && npm install && cd ..
   
   # Build and start
   cd backend
   npm run build
   npm start
   ```

4. **Setup PM2 (Process Manager)**
   ```bash
   # Install PM2
   sudo npm install -g pm2
   
   # Start with PM2
   pm2 start dist/index.js --name pokytalk-backend
   pm2 startup
   pm2 save
   ```

### Step 2: Configure Domain and SSL

1. **Domain Setup**
   - Point your domain to EC2 IP
   - Or use AWS Route 53

2. **SSL Certificate**
   - Use AWS Certificate Manager
   - Or Let's Encrypt

## Option 3: AWS ECS with Fargate

### Step 1: Create ECS Cluster

1. **Create Cluster**
   - Type: Fargate
   - Name: `pokytalk-cluster`

2. **Create Task Definition**
   - CPU: 0.5 vCPU
   - Memory: 1 GB
   - Port mappings: 3001:3001

3. **Create Service**
   - Service type: Application Load Balancer
   - Target group: Port 3001

## Environment Variables

### Backend Environment Variables
```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://main.d1f9os3opaq69q.amplifyapp.com
```

### Frontend Environment Variables
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

## Testing the Deployment

1. **Test Backend Health**
   ```bash
   curl https://your-backend-url.com/health
   ```

2. **Test Frontend**
   - Visit: `https://main.d1f9os3opaq69q.amplifyapp.com`
   - Check browser console for connection errors

3. **Test WebSocket Connection**
   - Open browser dev tools
   - Check Network tab for WebSocket connections

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is configured for frontend domain
   - Update `CORS_ORIGIN` environment variable

2. **WebSocket Connection Failed**
   - Check if backend supports WebSocket
   - Verify port 3001 is accessible

3. **Environment Variables Not Loading**
   - Rebuild frontend after adding environment variables
   - Check Amplify build logs

### Logs and Monitoring

1. **Backend Logs**
   - AWS App Runner: Built-in logging
   - EC2: Check `/var/log/` or PM2 logs
   - ECS: CloudWatch logs

2. **Frontend Logs**
   - AWS Amplify: Build logs and access logs

## Cost Estimation

- **AWS Amplify**: ~$1/month (free tier available)
- **AWS App Runner**: ~$10-20/month
- **EC2 t3.small**: ~$15/month
- **ECS Fargate**: ~$20-30/month

## Recommended Architecture

```
Frontend (Amplify) → Backend (App Runner) → Database (if needed)
```

This provides:
- ✅ Scalability
- ✅ Managed infrastructure
- ✅ Cost-effective
- ✅ Easy deployment
