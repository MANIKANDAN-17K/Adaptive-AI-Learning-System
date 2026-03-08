# 🚀 Quick Start Guide - Adaptive AI Skill Mentor

Get your application production-ready in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- OpenAI API key

## Step 1: Apply Database Migrations (2 minutes)

### Option A: Automatic (Recommended)

```bash
node apply-migrations.js
```

### Option B: Manual (If automatic fails)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to SQL Editor
3. Copy contents of `backend/src/migrations/000_COMPLETE_MIGRATION.sql`
4. Paste and click "Run"

## Step 2: Verify Environment Variables (30 seconds)

Check that these files exist and have correct values:

**backend/.env** ✅ Already configured with:
- OPENAI_API_KEY
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET (auto-generated)

**frontend/.env** ✅ Already configured with:
- VITE_API_URL=http://localhost:3000/api

## Step 3: Install Dependencies (1 minute)

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

## Step 4: Start the Application (30 seconds)

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Expected output:
```
Server running on port 3000
Connected to Supabase
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE ready in XXX ms
Local: http://localhost:5173
```

## Step 5: Test the Application (1 minute)

1. Open http://localhost:5173
2. Click "Create one" to register
3. Fill in your details and submit
4. You should be redirected to the Dashboard

**🎉 Success! Your application is running!**

## Troubleshooting

### Database Connection Error

**Problem:** Backend can't connect to Supabase

**Solution:**
1. Verify SUPABASE_URL in backend/.env
2. Verify SUPABASE_SERVICE_ROLE_KEY in backend/.env
3. Check Supabase project is not paused

### OpenAI API Error

**Problem:** AI features not working

**Solution:**
1. Verify OPENAI_API_KEY in backend/.env
2. Check API key has credits
3. Ensure API key starts with "sk-"

### Port Already in Use

**Problem:** Port 3000 or 5173 already in use

**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 5173
npx kill-port 5173
```

### Frontend Can't Connect to Backend

**Problem:** API calls failing

**Solution:**
1. Ensure backend is running on port 3000
2. Check VITE_API_URL in frontend/.env
3. Restart frontend dev server

## Running Tests

```bash
# Run all tests
node run-all-tests.js

# Or run individually
cd backend && npm test
cd frontend && npm test
```

## Production Deployment

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for detailed deployment instructions.

## Features to Test

1. ✅ User Registration & Login
2. ✅ Character Analysis
3. ✅ Skill Creation
4. ✅ Roadmap Generation
5. ✅ Learning Sessions
6. ✅ AI Mentor Interaction
7. ✅ Mastery Score Tracking
8. ✅ Mentor Mode Selection
9. ✅ Stretch Tasks
10. ✅ Session Persistence

## Need Help?

- Check [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for detailed setup
- Review [backend/src/migrations/README.md](./backend/src/migrations/README.md) for database info
- Check console logs for error messages

## Next Steps

- Invite users to test
- Monitor OpenAI API usage
- Set up production deployment
- Enable Supabase Row Level Security
- Add monitoring and analytics
