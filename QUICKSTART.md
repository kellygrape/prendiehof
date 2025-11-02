# Quick Start Guide

## Automated Setup (Recommended)

Run the setup script:

```bash
./setup.sh
```

Then follow the instructions printed by the script.

## Manual Setup

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set JWT_SECRET to a random string
npm run dev
```

Backend runs on `http://localhost:3001`

### 2. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

### 3. First Login

1. Open `http://localhost:3000`
2. Enter a username and password to create the admin account
3. You're in! Start by going to the Admin Panel

## What's Next?

### Admin Tasks:
1. **Admin Panel** → **Manage Nominations** → Add nominations
2. **Admin Panel** → **Manage Users** → Add committee members

### Committee Members:
1. Login with credentials provided by admin
2. View nominations and vote
3. Check results dashboard

## Common Commands

```bash
# Backend
cd backend
npm run dev          # Development with auto-reload
npm start            # Production

# Frontend
cd frontend
npm run dev          # Development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Troubleshooting

**Port already in use:**
- Backend: Change `PORT` in `backend/.env`
- Frontend: Vite will prompt you to use an alternative port

**Can't login:**
- Check that backend is running on port 3001
- Check browser console for errors
- Verify `.env` file exists in backend/

**Database errors:**
- Delete `backend/nominations.db` to start fresh
- Backend will recreate the database on next start

## Need Help?

Check the full [README.md](README.md) for:
- Detailed API documentation
- Deployment guides
- Architecture overview
- Security best practices
