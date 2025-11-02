# Hall of Fame Nominations Portal

A full-stack web application for managing Hall of Fame nominations and committee voting.

## Features

- **User Authentication**: Secure login system for committee members and administrators
- **Admin Panel**: Upload and manage nominations
- **Voting Interface**: Committee members can view nominations and cast votes (Yes/No/Abstain)
- **Results Dashboard**: Real-time voting results with visual breakdowns
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

**Frontend:**
- React 18
- React Router for navigation
- Vite for fast development and building

**Backend:**
- Node.js with Express
- SQLite database (easy setup, no external database required)
- JWT authentication
- bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js 18+ installed on your machine
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project directory**

2. **Set up the backend:**

```bash
cd backend
npm install
```

3. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and set your own values:
```
PORT=3001
JWT_SECRET=your-random-secret-key-here
NODE_ENV=development
```

**Important**: Change `JWT_SECRET` to a random secure string!

4. **Set up the frontend:**

```bash
cd ../frontend
npm install
```

### Running the Application

You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### First Time Setup

1. Open your browser to `http://localhost:3000`
2. You'll see the login page
3. Since no admin exists yet, enter a username and password to create the first admin account
4. After creating the admin account, you'll be logged in automatically

### Using the Application

**As an Admin:**
1. Go to the Admin Panel from the navigation
2. Add nominations with details (name, category, achievements, etc.)
3. Create committee member accounts
4. Committee members can now login and vote

**As a Committee Member:**
1. Login with your credentials
2. Browse all nominations
3. Click on a nomination to view details and vote
4. View results to see how voting is progressing

## Project Structure

```
prendiehofnominations/
├── backend/
│   ├── database.js          # Database schema and initialization
│   ├── server.js            # Express server and API routes
│   ├── package.json
│   ├── .env.example
│   └── nominations.db       # SQLite database (created automatically)
│
└── frontend/
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── pages/          # Page components
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Nominations.jsx
    │   │   ├── NominationDetail.jsx
    │   │   ├── AdminPanel.jsx
    │   │   └── Results.jsx
    │   ├── utils/
    │   │   └── api.js      # API client functions
    │   ├── App.jsx         # Main app component with routing
    │   ├── App.css         # Application styles
    │   └── main.jsx        # Entry point
    ├── package.json
    └── vite.config.js
```

## API Endpoints

### Authentication
- `POST /api/auth/init-admin` - Create first admin account
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user (admin only)

### Nominations
- `GET /api/nominations` - Get all nominations
- `GET /api/nominations/:id` - Get single nomination
- `POST /api/nominations` - Create nomination (admin only)
- `PUT /api/nominations/:id` - Update nomination (admin only)
- `DELETE /api/nominations/:id` - Delete nomination (admin only)

### Voting
- `POST /api/votes/:nominationId` - Submit or update vote
- `GET /api/votes/my-votes` - Get current user's votes
- `GET /api/votes/results` - Get voting results

### Users
- `GET /api/users` - Get all users (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Stats
- `GET /api/stats` - Get dashboard statistics

## Deployment Options

### Option 1: Vercel (Easiest - Free Tier Available)

Vercel is perfect for this full-stack application:

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Create `vercel.json` in the root directory:**
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "devCommand": "cd frontend && npm run dev",
  "installCommand": "cd backend && npm install && cd ../frontend && npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    }
  ]
}
```

3. **Create `api/index.js` for Vercel serverless:**
```javascript
// This wraps your Express app for Vercel
const app = require('../backend/server.js');
module.exports = app;
```

4. **Deploy:**
```bash
vercel
```

### Option 2: Netlify + Backend Hosting

**Frontend on Netlify:**
```bash
cd frontend
npm run build
# Deploy the dist/ folder to Netlify
```

**Backend on Railway/Render:**
- Push your backend code to GitHub
- Connect Railway or Render to your repository
- Set environment variables in their dashboard
- Deploy

### Option 3: DigitalOcean App Platform

1. Create a DigitalOcean account
2. Use App Platform to deploy from GitHub
3. Configure two components: frontend (static site) and backend (web service)
4. Set environment variables
5. Deploy

### Option 4: Traditional VPS (DigitalOcean Droplet, AWS EC2, etc.)

1. Set up a Linux server
2. Install Node.js
3. Clone your repository
4. Install dependencies for both frontend and backend
5. Build the frontend: `cd frontend && npm run build`
6. Use PM2 to run the backend: `pm2 start backend/server.js`
7. Set up Nginx as a reverse proxy
8. Configure SSL with Let's Encrypt

## Database

The application uses SQLite for simplicity. The database file (`nominations.db`) is created automatically when you first start the backend.

**Database Tables:**
- `users` - Committee members and admins
- `nominations` - Hall of Fame nominations
- `votes` - Committee member votes

For production with many users, consider migrating to PostgreSQL. The code can be easily adapted to use PostgreSQL instead of SQLite.

## Security Notes

- Always change the `JWT_SECRET` in production
- Use strong passwords for all accounts
- The SQLite database file should be backed up regularly
- Consider using HTTPS in production (handled automatically by most hosting platforms)
- Don't commit `.env` file to version control

## Backup

To backup your data:
```bash
# Backup the SQLite database
cp backend/nominations.db backend/nominations.db.backup
```

## Future Enhancements

Potential features to add:
- Email notifications when voting opens/closes
- Voting periods with start/end dates
- Export results to PDF or CSV
- File upload for nomination documents
- Comments and discussion on nominations
- Vote history and audit log
- Multi-round voting
- Weighted voting options

## Support

For issues or questions, please check the code comments or create an issue in the repository.

## License

MIT License - feel free to use and modify for your organization's needs.
