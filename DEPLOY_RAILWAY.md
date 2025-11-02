# Deploying to Railway

Railway is perfect for this application because it supports SQLite databases with persistent storage. This guide will walk you through deploying both the backend and frontend.

## Prerequisites

1. Create a free Railway account at https://railway.app
2. Install Railway CLI (optional but helpful):
   ```bash
   npm install -g @railway/cli
   ```
3. Have your GitHub repository ready (or create one)

## Deployment Strategy

We'll deploy two services:
1. **Backend Service** - Express API with SQLite database
2. **Frontend Service** - React app that talks to the backend

## Step 1: Push to GitHub

First, push your code to GitHub:

```bash
cd /Users/kellyanne/Sites/prendiehofnominations

# Initialize git if you haven't already
git init
git add .
git commit -m "Initial commit - Hall of Fame Nominations Portal"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/hof-nominations.git
git push -u origin master
```

## Step 2: Deploy Backend to Railway

1. **Go to https://railway.app and login**

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will detect it's a monorepo

3. **Configure Backend Service**
   - Click on the service that was created
   - Go to **Settings** → **Root Directory**
   - Set root directory to: `backend`
   - Go to **Settings** → **Service Name**
   - Rename to: `hof-backend`

4. **Add Environment Variables**
   - Go to **Variables** tab
   - Add these variables:
     ```
     PORT=3001
     JWT_SECRET=<generate-a-random-string-here>
     NODE_ENV=production
     ```
   - For JWT_SECRET, use a random string (you can generate one with: `openssl rand -hex 32`)

5. **Enable Persistent Storage (Important!)**
   - Go to **Settings** → **Volumes**
   - Click "New Volume"
   - Mount Path: `/app/data`
   - This ensures your SQLite database persists

6. **Update Database Path for Production**
   - We need to store the database in the persistent volume

7. **Deploy**
   - Railway will automatically build and deploy
   - Wait for deployment to complete
   - Copy the public URL (something like: `https://hof-backend.up.railway.app`)

## Step 3: Deploy Frontend to Railway

1. **Add Another Service**
   - In your Railway project, click "New"
   - Select "GitHub Repo" (same repo)
   - Click on the new service

2. **Configure Frontend Service**
   - Go to **Settings** → **Root Directory**
   - Set root directory to: `frontend`
   - Go to **Settings** → **Service Name**
   - Rename to: `hof-frontend`

3. **Add Environment Variables**
   - Go to **Variables** tab
   - Add this variable:
     ```
     VITE_API_URL=https://YOUR-BACKEND-URL.up.railway.app/api
     ```
   - Replace `YOUR-BACKEND-URL` with the URL from Step 2

4. **Configure Build**
   - Go to **Settings** → **Build**
   - Build Command: `npm run build`
   - Start Command: `npx serve -s dist -l $PORT`

5. **Install serve package**
   - We need to add serve to serve the built frontend
   - In your local frontend folder:
     ```bash
     cd frontend
     npm install --save serve
     ```
   - Commit and push:
     ```bash
     git add package.json package-lock.json
     git commit -m "Add serve for production"
     git push
     ```

6. **Deploy**
   - Railway will automatically rebuild and deploy
   - Copy the public URL (something like: `https://hof-frontend.up.railway.app`)

## Step 4: Import Your Nominations

Now that both services are deployed, you need to import your nominations:

### Option A: Using Railway CLI (Easiest)

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Select the backend service
railway service

# Copy your CSV file and run import
railway run node import-nominations.js nominations.csv
```

### Option B: Using Railway Shell

1. Go to your backend service in Railway dashboard
2. Click on **Deployments**
3. Click on the latest deployment
4. Click **View Logs** and find the shell icon
5. Upload your CSV file (if Railway supports file upload) or paste the data
6. Run: `node import-nominations.js nominations.csv`

### Option C: Use the Web Interface

1. First, visit your frontend URL and create an admin account
2. Use the Admin Panel to manually add nominations
3. Or create a CSV upload feature in the web interface (we can add this if needed)

## Step 5: Configure Backend CORS

Update the backend to allow requests from your frontend domain:

Edit `backend/server.js` and update the CORS configuration:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

Add `FRONTEND_URL` environment variable in Railway backend:
```
FRONTEND_URL=https://your-frontend-url.up.railway.app
```

## Step 6: Create Admin Account and Test

1. Visit your frontend URL: `https://your-frontend-url.up.railway.app`
2. Create your first admin account
3. Test the application
4. Import your nominations using one of the methods above

## Updating the Database Path for Persistent Storage

We need to update the database to use the persistent volume:

Edit `backend/database.js`:

```javascript
const dbPath = process.env.NODE_ENV === 'production'
  ? '/app/data/nominations.db'
  : join(__dirname, 'nominations.db');

const db = new Database(dbPath);
```

Commit and push this change.

## Monitoring and Maintenance

**View Logs:**
- Go to your service in Railway
- Click on **Deployments** → Select deployment → **View Logs**

**Database Backup:**
```bash
# Using Railway CLI
railway run cp /app/data/nominations.db ./backup.db
railway run cat /app/data/nominations.db > backup.db
```

**Environment Variables:**
- Update anytime in the Railway dashboard under Variables
- Service will automatically redeploy

## Costs

Railway offers:
- **Free Tier**: $5 of usage per month (usually enough for small apps)
- **Usage-based**: After free tier, pay only for what you use
- **Typical costs**: $5-20/month for a small app like this

Your SQLite database is stored in the persistent volume (free within limits).

## Troubleshooting

**Backend not connecting:**
- Check environment variables are set correctly
- Check logs for errors
- Verify PORT is set to 3001 or let Railway assign it automatically

**Frontend can't reach backend:**
- Verify VITE_API_URL is set correctly
- Check CORS settings in backend
- Make sure backend is deployed and running

**Database not persisting:**
- Verify volume is mounted at `/app/data`
- Check database path in database.js points to the volume

**Import script can't find CSV:**
- Use Railway shell to upload file
- Or use Railway CLI with `railway run`

## Alternative: Single Service Deployment

If you prefer to serve everything from one service, you can:

1. Build the frontend
2. Serve it from the Express backend using `express.static`
3. Deploy only the backend service

Let me know if you want instructions for this approach!

## Next Steps

After deployment:
1. Set up a custom domain (optional, available in Railway)
2. Enable automatic deployments from GitHub
3. Set up monitoring/alerts
4. Create database backup schedule

Your Hall of Fame Nominations Portal is now live! 🎉
