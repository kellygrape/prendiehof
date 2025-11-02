# Railway Deployment - Quick Start

Follow these steps to deploy your Hall of Fame Nominations Portal to Railway.

## Prerequisites

1. A Railway account (free): https://railway.app
2. Your code pushed to GitHub
3. Your nominations CSV file ready

## Quick Deployment Steps

### 1. Push to GitHub

```bash
cd /Users/kellyanne/Sites/prendiehofnominations
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/hof-nominations.git
git push -u origin master
```

### 2. Deploy Backend

1. Go to https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will create a service
5. Click the service → **Settings** → **Root Directory** → Set to `backend`
6. **Settings** → **Service Name** → Rename to `hof-backend`
7. Click **Variables** → Add:
   ```
   PORT=3001
   JWT_SECRET=<generate-random-string>
   NODE_ENV=production
   ```
8. **Settings** → **Volumes** → **New Volume**
   - Mount Path: `/app/data`
9. Wait for deployment, then copy the URL (e.g., `https://hof-backend.up.railway.app`)

### 3. Deploy Frontend

1. In same project, click **"New"** → **"GitHub Repo"** (same repo)
2. Click new service → **Settings** → **Root Directory** → Set to `frontend`
3. **Settings** → **Service Name** → Rename to `hof-frontend`
4. Click **Variables** → Add:
   ```
   VITE_API_URL=https://YOUR-BACKEND-URL.up.railway.app/api
   ```
   (Replace with your actual backend URL from step 2)
5. Wait for deployment, then copy the URL (e.g., `https://hof-frontend.up.railway.app`)

### 4. Update Backend CORS

1. Go back to backend service
2. **Variables** → Add:
   ```
   FRONTEND_URL=https://YOUR-FRONTEND-URL.up.railway.app
   ```
   (Replace with your actual frontend URL from step 3)

### 5. Create Admin & Import Data

1. Visit your frontend URL
2. Create first admin account
3. To import nominations, use Railway CLI:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Link to your project
   railway link

   # Select backend service
   railway service

   # Copy CSV and run import
   railway run node import-nominations.js nominations.csv
   ```

## That's It! 🎉

Your app is now live at your frontend URL!

## Costs

- **Free tier**: $5 usage/month (usually sufficient for small apps)
- **After free tier**: Pay-as-you-go, typically $5-20/month

## Troubleshooting

**Frontend can't connect to backend:**
- Check `VITE_API_URL` is set correctly
- Verify backend is running (check logs)

**Database not persisting:**
- Ensure volume is mounted at `/app/data`
- Check backend logs for database path

**Need help?**
See full guide: `DEPLOY_RAILWAY.md`
