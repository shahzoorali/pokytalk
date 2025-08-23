# GitHub Repository Setup Guide

## 🚀 Step-by-Step Instructions

### 1. Create GitHub Repository

1. **Go to GitHub.com** and sign in to your account
2. **Click the "+" icon** in the top right corner
3. **Select "New repository"**
4. **Fill in the details:**
   - Repository name: `pokytalk`
   - Description: `Voice chat application with random people - built with Next.js, Node.js, and WebRTC`
   - Make it **Public** (recommended for open source)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. **Click "Create repository"**

### 2. Connect Local Repository to GitHub

After creating the repository, GitHub will show you the commands. Run these in your terminal:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/pokytalk.git

# Set the main branch
git branch -M main

# Push the code
git push -u origin main
```

### 3. Verify the Push

1. **Refresh your GitHub repository page**
2. **You should see all the files:**
   - `frontend/` - Next.js application
   - `backend/` - Node.js server
   - `shared/` - Shared TypeScript types
   - `amplify.yml` - AWS Amplify configuration
   - `README.md` - Project documentation
   - `package.json` - Root package configuration

### 4. Repository Structure

Your GitHub repository should contain:

```
pokytalk/
├── frontend/          # Next.js frontend
├── backend/           # Node.js backend
├── shared/            # Shared types
├── amplify.yml        # AWS Amplify config
├── docker-compose.yml # Docker setup
├── README.md          # Documentation
├── aws-setup.md       # AWS deployment guide
└── package.json       # Root configuration
```

## 🔗 Next Steps After GitHub Setup

### 1. AWS Amplify Deployment
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your GitHub account
4. Select the `pokytalk` repository
5. Amplify will auto-detect the `amplify.yml` configuration

### 2. Environment Variables
Set these in Amplify Console:
```
NODE_ENV=production
FRONTEND_URL=https://your-app-name.amplifyapp.com
NEXT_PUBLIC_BACKEND_URL=https://your-app-name.amplifyapp.com
```

### 3. Test Deployment
- Amplify will automatically build and deploy
- Check the build logs for any issues
- Test the live application

## 🛠️ Troubleshooting

### If you get authentication errors:
```bash
# Use GitHub CLI (if installed)
gh auth login

# Or use personal access token
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/pokytalk.git
```

### If you need to update the remote URL:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/pokytalk.git
```

## 📋 Checklist

- [ ] GitHub repository created
- [ ] Repository is public
- [ ] Local code committed
- [ ] Remote origin added
- [ ] Code pushed to GitHub
- [ ] All files visible in GitHub
- [ ] Ready for AWS Amplify deployment

## 🎯 Repository URL

Your repository will be available at:
`https://github.com/YOUR_USERNAME/pokytalk`

Replace `YOUR_USERNAME` with your actual GitHub username.
