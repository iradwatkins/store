# Production Environment Setup Guide

## 🚨 Critical: Fix Google OAuth 400 Error

Your production deployment is failing with:
```
400. That's an error.
invalid_client - The OAuth client was not found
client_id=undefined
```

This means the Google OAuth credentials are not configured in production.

## Required Steps

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen if prompted
6. Application type: **Web application**
7. Add authorized redirect URIs:
   ```
   https://stores.stepperslife.com/api/auth/callback/google
   ```
8. Copy the **Client ID** and **Client Secret**

### 2. Set Environment Variables in Production

Add these environment variables to your production server:

```bash
# Authentication
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="https://stores.stepperslife.com"

# Google OAuth (REQUIRED!)
GOOGLE_CLIENT_ID="123456789-abc123.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your_secret_here"

# Email Service (Resend)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="SteppersLife Stores <noreply@stepperslife.com>"

# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Redis (if using caching)
REDIS_URL="redis://host:6379"
```

### 3. Platform-Specific Instructions

#### If using **Vercel**:
```bash
# Install Vercel CLI
npm install -g vercel

# Add environment variables
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Redeploy
vercel --prod
```

#### If using **Railway**:
1. Go to your Railway dashboard
2. Select your project
3. Click "Variables" tab
4. Add each environment variable
5. Railway will auto-redeploy

#### If using **DigitalOcean App Platform**:
1. Go to Apps dashboard
2. Select your app
3. Go to Settings → App-Level Environment Variables
4. Add each variable
5. Click "Save" to trigger redeploy

#### If using **Custom VPS/Server**:
```bash
# SSH into your server
ssh your-user@your-server-ip

# Navigate to deployment directory
cd /path/to/your/app

# Edit .env file
nano .env

# Add the environment variables above

# Restart your application
pm2 restart all
# OR
docker-compose down && docker-compose up -d
```

### 4. Verify Deployment

After setting environment variables:

1. Visit: https://stores.stepperslife.com/login
2. Click "Sign in with Google"
3. Should redirect to Google OAuth (no 400 error)
4. Complete login flow

## Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Example output: J3k9Lm2Nq5Pr8Sv1Tw4Xz6Bc7Df0Hk3
```

## Troubleshooting

### Still getting 400 error?
- Check that `GOOGLE_CLIENT_ID` is not empty or "undefined"
- Verify redirect URI matches exactly in Google Console
- Ensure environment variables are saved and app redeployed

### Can't find environment variable settings?
- Check your hosting platform's documentation
- Look for "Environment Variables", "Config Vars", or "Settings"

## Quick Test

Run this to verify Google OAuth is working:
```bash
curl -I https://stores.stepperslife.com/api/auth/signin/google
```

Should return `302 Found` (redirect), not `400 Bad Request`.

## Contact Support

If you're still having issues:
1. Check your hosting platform logs
2. Verify all environment variables are set
3. Ensure the app redeployed after adding variables
