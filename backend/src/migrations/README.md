# Database Migrations

This directory contains SQL migration files for the Adaptive AI Skill Mentor database schema.

## Migration Files

Migrations are numbered sequentially and should be applied in order:

1. `001_create_users_table.sql` - Creates the users table
2. `002_create_personality_profiles_table.sql` - Creates the personality_profiles table
3. `003_create_skills_table.sql` - Creates the skills table
4. `004_create_roadmaps_table.sql` - Creates the roadmaps table
5. `005_create_sessions_table.sql` - Creates the sessions table
6. `006_create_performance_logs_table.sql` - Creates the performance_logs table (✓ Completed)

## How to Apply Migrations

### Using Supabase Dashboard

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of each migration file in order
4. Execute each migration script
5. Verify the tables were created successfully in the Table Editor

### Using Supabase CLI (Alternative)

If you have the Supabase CLI installed:

```bash
# Initialize Supabase in your project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Using psql (Direct Connection)

If you have direct PostgreSQL access:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f backend/src/migrations/001_create_users_table.sql
```

## Migration Best Practices

- Always apply migrations in sequential order
- Test migrations in a development environment first
- Keep migrations idempotent (use `IF NOT EXISTS` clauses)
- Document the purpose and requirements for each migration
- Never modify existing migration files after they've been applied to production
- Create new migration files for schema changes

## Rollback

To rollback a migration, create a new migration file with the reverse operations. For example:

```sql
-- Rollback: Drop users table
DROP TABLE IF EXISTS users CASCADE;
```

## Verification

After applying migrations, verify the schema:

```sql
-- List all tables
\dt

-- Describe users table
\d users

-- Check constraints
SELECT * FROM information_schema.table_constraints WHERE table_name = 'users';
```
