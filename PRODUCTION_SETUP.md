# Production Setup Guide

## Overview
This guide will make the Adaptive AI Skill Mentor production-ready by:
1. Applying all database migrations
2. Fixing all test failures
3. Setting up environment variables
4. Verifying the complete system

## Step 1: Database Setup

### Apply All Migrations in Order

Execute these SQL files in your Supabase SQL Editor in this exact order:

1. **001_create_users_table.sql** - Creates users table
2. **002_create_personality_profiles_table.sql** - Creates personality profiles
3. **003_create_skills_table.sql** - Creates skills table
4. **004_create_roadmaps_table.sql** - Creates roadmaps table
5. **005_create_sessions_table.sql** - Creates sessions table
6. **006_create_performance_logs_table.sql** - Creates performance logs
7. **007_add_password_hash_to_users.sql** - Adds password authentication
8. **008_add_mentor_mode_to_sessions.sql** - Adds mentor mode preference

### Quick Migration Script

Run this in Supabase SQL Editor to apply all migrations at once:

```sql
-- Copy and paste the contents of each migration file here in order
-- Or use the individual files one by one
```

## Step 2: Environment Configuration

### Backend Environment (.env)

The backend `.env.example` already contains your credentials. Create the actual `.env` file:

```bash
cd backend
cp .env.example .env
```

**Verify these values in your `.env`:**
- ✅ OPENAI_API_KEY - Already set
- ✅ SUPABASE_URL - Already set
- ✅ SUPABASE_ANON_KEY - Already set
- ✅ SUPABASE_SERVICE_ROLE_KEY - Already set
- ⚠️ JWT_SECRET - Generate a secure secret

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend Environment

Create `frontend/.env`:

```bash
cd frontend
cat > .env << 'EOF'
VITE_API_URL=http://localhost:3000/api
EOF
```

For production deployment, update to your production API URL.

## Step 3: Fix Test Failures

### Backend Test Fixes

**Issue:** API tests fail due to missing authentication tokens

**Fix:** Update test files to mock authentication middleware

Files to update:
- `backend/src/routes/__tests__/skills.test.ts`
- `backend/src/routes/__tests__/sessions.test.ts`

### Frontend Test Fixes

**Issue:** Component tests fail due to missing AuthProvider wrapper

**Fix:** Wrap test components in AuthProvider

Files to update:
- `frontend/src/components/__tests__/LearningSession.test.tsx`
- `frontend/src/components/__tests__/Library.test.tsx`

## Step 4: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Step 5: Run Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd ../frontend
npm test
```

## Step 6: Start the Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## Step 7: Verify Database Schema

Run this verification query in Supabase SQL Editor:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables:
-- - users
-- - personality_profiles
-- - skills
-- - roadmaps
-- - sessions
-- - performance_logs

-- Verify foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

## Step 8: Test Complete User Flow

1. **Register a new user**
   - Navigate to http://localhost:5173/register
   - Create an account
   - Verify redirect to dashboard

2. **Create a skill**
   - Click "Create New Skill"
   - Complete character analysis
   - Verify roadmap generation

3. **Start learning session**
   - Select skill from library
   - Verify session starts with recap
   - Test interaction with AI mentor
   - Verify mastery score updates

4. **Test mentor mode selection**
   - Change mentor mode during session
   - Verify mode persists across interactions

5. **Test stretch tasks**
   - Achieve high mastery score (>80%)
   - Verify stretch task appears
   - Test skip and attempt actions

## Production Deployment Checklist

### Security
- [ ] Change JWT_SECRET to a secure random value
- [ ] Enable HTTPS for API endpoints
- [ ] Set up CORS properly for production domain
- [ ] Rotate API keys regularly
- [ ] Enable Supabase Row Level Security (RLS)

### Performance
- [ ] Enable database connection pooling
- [ ] Add Redis for session caching
- [ ] Implement rate limiting
- [ ] Enable gzip compression
- [ ] Optimize bundle size

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Add application logging
- [ ] Monitor API response times
- [ ] Track OpenAI API usage
- [ ] Set up uptime monitoring

### Database
- [ ] Enable automated backups
- [ ] Set up database indexes
- [ ] Configure connection limits
- [ ] Enable query performance monitoring

### Frontend
- [ ] Build production bundle: `npm run build`
- [ ] Deploy to hosting (Vercel, Netlify, etc.)
- [ ] Configure environment variables
- [ ] Enable CDN for static assets

### Backend
- [ ] Deploy to hosting (Railway, Render, etc.)
- [ ] Configure environment variables
- [ ] Set up health check endpoint
- [ ] Enable auto-scaling

## Troubleshooting

### Database Connection Issues
```bash
# Test Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
supabase.from('users').select('count').then(console.log);
"
```

### OpenAI API Issues
```bash
# Test OpenAI connection
node -e "
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
client.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }],
  max_tokens: 10
}).then(r => console.log('OpenAI OK:', r.choices[0].message.content));
"
```

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 5173
npx kill-port 5173
```

## Success Criteria

✅ All 8 database migrations applied successfully
✅ All backend tests passing (170/170)
✅ All frontend tests passing (127/127)
✅ Backend server starts without errors
✅ Frontend dev server starts without errors
✅ User can register and login
✅ User can create skills with character analysis
✅ User can start learning sessions
✅ AI mentor responds to user input
✅ Mastery scores update in real-time
✅ Roadmap progression works correctly
✅ Mentor mode selection persists

## Next Steps After Production Setup

1. **User Testing** - Invite beta users to test the application
2. **Performance Optimization** - Profile and optimize slow queries
3. **Feature Enhancements** - Implement optional property tests
4. **Documentation** - Create user guides and API documentation
5. **Analytics** - Add user behavior tracking
6. **Feedback Loop** - Collect and implement user feedback
