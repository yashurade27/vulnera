# Deployment Guide for Vercel

## Required Environment Variables

You **must** configure these environment variables in your Vercel project settings before deployment:

### 1. Database Configuration

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

- Get this from your Neon dashboard
- Make sure to include `?sslmode=require` at the end

### 2. NextAuth Configuration

```bash
# Generate a secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"

# Your production URL
NEXTAUTH_URL="https://your-app.vercel.app"
```

**Important**: 
- The `NEXTAUTH_SECRET` must be a secure random string
- The `NEXTAUTH_URL` must match your exact Vercel deployment URL
- Vercel automatically sets `VERCEL_URL`, but you still need `NEXTAUTH_URL`

### 3. Email Configuration (Resend)

```bash
RESEND_API_KEY="re_your_api_key_here"
FROM_EMAIL="noreply@your-domain.com"
```

### 4. Node Environment

```bash
NODE_ENV="production"
```

## How to Set Environment Variables on Vercel

### Via Vercel Dashboard:

1. Go to your project on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with:
   - **Name**: Variable name (e.g., `NEXTAUTH_SECRET`)
   - **Value**: The actual value
   - **Environment**: Select **Production**, **Preview**, and **Development** (or as needed)
4. Click **Save**
5. **Important**: Redeploy your app after adding variables

### Via Vercel CLI:

```bash
# Set a variable for production
vercel env add NEXTAUTH_SECRET production

# Set a variable for all environments
vercel env add DATABASE_URL production preview development
```

## Generating NEXTAUTH_SECRET

On Windows PowerShell:
```powershell
# Generate a random base64 string
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

On Linux/Mac:
```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## Database Migration on Production

After deploying, you need to run migrations on your production database:

```bash
# Using Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
```

Or manually:
1. Get your production `DATABASE_URL` from Vercel
2. Set it locally: `$env:DATABASE_URL="your-production-url"`
3. Run: `npx prisma migrate deploy`

## Common Deployment Issues

### 1. NextAuth Error: "Cannot convert undefined or null to object"

**Cause**: Missing or incorrect `NEXTAUTH_SECRET` or `NEXTAUTH_URL`

**Fix**:
- Ensure both variables are set in Vercel
- Redeploy after setting them
- Check that `NEXTAUTH_URL` matches your deployment URL exactly

### 2. Wallet Connection Error: "Plugin Closed"

**Cause**: Session not properly initialized before wallet operations

**Fix**: Already handled in code with:
- Session loading states
- Connected wallet checks
- Proper error boundaries

### 3. Database Connection Errors

**Cause**: Incorrect `DATABASE_URL` or database not accessible

**Fix**:
- Verify the connection string is correct
- Ensure your Neon database allows connections from Vercel IPs
- Check that `?sslmode=require` is appended to the URL

### 4. Prisma Client Not Generated

**Cause**: Build failed to generate Prisma client

**Fix**: Already handled with `postinstall` script in `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

## Vercel Build Settings

Ensure your Vercel project has these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)
- **Node Version**: 18.x or higher

## Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] `NEXTAUTH_SECRET` is a secure random string
- [ ] `NEXTAUTH_URL` matches your deployment URL
- [ ] `DATABASE_URL` is correct and accessible
- [ ] Database migrations have been applied
- [ ] Code pushed to GitHub branch connected to Vercel
- [ ] Vercel build completed successfully
- [ ] Test authentication flow on production
- [ ] Test wallet connection on production
- [ ] Test bounty creation and funding flow

## Monitoring

After deployment, monitor:

1. **Vercel Logs**: Check for runtime errors
2. **Browser Console**: Look for client-side errors
3. **Database**: Verify migrations are applied
4. **Wallet Integration**: Test with Phantom/Solflare on devnet/mainnet

## Rollback

If deployment fails:

1. Go to Vercel dashboard
2. Navigate to **Deployments**
3. Find the last working deployment
4. Click **⋯** → **Promote to Production**

## Support

If issues persist:
- Check Vercel deployment logs
- Review browser console errors
- Verify all environment variables are set
- Test locally with production environment variables
