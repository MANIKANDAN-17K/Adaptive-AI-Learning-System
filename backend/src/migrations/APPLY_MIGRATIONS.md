# How to Apply Database Migrations

## Quick Start Guide

### Step 1: Set Up Supabase Project

If you haven't already:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Apply Migration via Supabase Dashboard

**This is the recommended method for the users table migration:**

1. Log in to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of `backend/src/migrations/001_create_users_table.sql`
5. Paste into the SQL Editor
6. Click "Run" to execute the migration
7. Verify success in the "Table Editor" - you should see the `users` table

### Step 4: Verify the Migration

Run this SQL query in the Supabase SQL Editor to verify:

```sql
-- Check if users table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';
```

Expected output:
- 4 columns: id (uuid), name (varchar), email (varchar), created_at (timestamp)
- Primary key constraint on id
- Unique constraint on email
- Index on email column

### Alternative: Using Supabase CLI

If you prefer using the CLI:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Create a migration file (already done)
# supabase migration new create_users_table

# Copy the SQL content to supabase/migrations/
# Then push to remote
supabase db push
```

### Troubleshooting

**Error: "relation 'users' already exists"**
- The table has already been created. This is safe to ignore if using `IF NOT EXISTS`.

**Error: "permission denied"**
- Make sure you're using the service role key, not the anon key
- Check that your Supabase project is active

**Error: "connection refused"**
- Verify your SUPABASE_URL is correct
- Check your internet connection
- Ensure your Supabase project is not paused

### Next Steps

After successfully applying this migration:
1. Proceed to task 2.2: Create personality_profiles table
2. Continue with remaining migrations in sequential order
3. Test the schema by inserting a test user via the Supabase dashboard

### Testing the Users Table

You can test the table with this SQL:

```sql
-- Insert a test user
INSERT INTO users (name, email)
VALUES ('Test User', 'test@example.com')
RETURNING *;

-- Query the user
SELECT * FROM users WHERE email = 'test@example.com';

-- Clean up test data
DELETE FROM users WHERE email = 'test@example.com';
```
