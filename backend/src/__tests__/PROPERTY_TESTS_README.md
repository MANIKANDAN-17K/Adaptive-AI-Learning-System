# Property-Based Tests for Referential Integrity

## Overview

This directory contains property-based tests for the Adaptive AI Skill Mentor backend, specifically testing **Property 33: Referential Integrity Enforcement**.

## Test Files

### 1. `referential-integrity.unit.test.ts`
**Status:** ✅ Always runs (no database required)

Unit tests that verify the database migration files correctly define foreign key constraints with `ON DELETE CASCADE`. These tests:
- Check that all foreign key constraints are properly defined
- Verify the cascade chain from users → skills → roadmaps/sessions → performance_logs
- Validate that migration files reference the correct requirements

**Run with:**
```bash
npm test -- referential-integrity.unit.test.ts
```

### 2. `referential-integrity.property.test.ts`
**Status:** ⚠️ Requires live database connection

Property-based tests that verify referential integrity enforcement by:
- Creating complete hierarchies of related records (user → skill → roadmap → session → performance_logs)
- Deleting the parent user record
- Verifying that all related records are cascade deleted
- Testing with randomly generated data across 10+ iterations

**Run with:**
```bash
# Set up environment variables first
export SUPABASE_URL=your_supabase_project_url
export SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Run the property tests
npm test -- referential-integrity.property.test.ts
```

## Property 33: Referential Integrity Enforcement

**Validates:** Requirements 9.6, 18.7

**Property Statement:**
> For any attempt to delete a user with associated skills, the database should either prevent the deletion or cascade delete all related records (skills, roadmaps, sessions, performance_logs) to maintain referential integrity.

**Implementation:**
The database uses `ON DELETE CASCADE` constraints to automatically delete all related records when a parent record is deleted. This ensures:
- No orphaned records remain in the database
- Referential integrity is always maintained
- Data consistency is preserved

## Database Setup for Property Tests

### Prerequisites
1. A Supabase project with PostgreSQL database
2. All migrations applied (001-006)
3. Service role key with full database access

### Environment Variables
Create a `.env` file in the `backend` directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Running Migrations
```bash
# Apply all migrations to your database
cd backend/src/migrations
# Follow instructions in APPLY_MIGRATIONS.md
```

## Test Behavior

### When Database is NOT Configured
- Property tests are automatically skipped
- Unit tests still run and verify schema definitions
- No errors are thrown

### When Database IS Configured
- Property tests run with randomly generated data
- Each test creates a complete hierarchy of records
- Tests verify cascade deletion works correctly
- Cleanup is automatic (cascade deletion handles it)

## Test Configuration

### Property Test Settings
- **Iterations:** 10 runs for single skill test, 5 runs for multiple skills test
- **Timeout:** 60-120 seconds (database operations are slower than in-memory tests)
- **Data Generation:** Uses `fast-check` library to generate random valid data

### Data Generators
- User names: 1-50 characters, non-empty
- Emails: Valid email format
- Skill names: 1-100 characters, non-empty
- Goals: 1-500 characters, non-empty
- Timelines: 1-365 days
- Mastery scores: 0-100
- Confidence levels: 'low', 'medium', 'high'
- Accuracy/Speed: 0-100
- Attempts: 1-10

## Troubleshooting

### Tests are Skipped
**Cause:** Database environment variables not set
**Solution:** Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your environment

### Connection Timeout
**Cause:** Database is unreachable or slow
**Solution:** 
- Check your internet connection
- Verify Supabase project is active
- Increase timeout in test configuration

### Foreign Key Constraint Violations
**Cause:** Migrations not applied correctly
**Solution:**
- Verify all migrations (001-006) are applied
- Check that foreign key constraints exist in database
- Run unit tests to verify schema

### Cleanup Errors
**Cause:** Cascade deletion not working
**Solution:**
- Verify `ON DELETE CASCADE` is in migration files
- Check database logs for constraint errors
- Ensure service role key has sufficient permissions

## Integration with CI/CD

### Recommended Approach
1. **Unit tests:** Run on every commit (no database required)
2. **Property tests:** Run on pull requests with test database
3. **Integration tests:** Run before deployment with staging database

### GitHub Actions Example
```yaml
- name: Run Unit Tests
  run: npm test -- referential-integrity.unit.test.ts

- name: Run Property Tests
  env:
    SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
  run: npm test -- referential-integrity.property.test.ts
```

## Related Files

- **Migrations:** `backend/src/migrations/001-006_*.sql`
- **Database Utils:** `backend/src/__tests__/db-utils.ts`
- **Requirements:** `.kiro/specs/adaptive-ai-skill-mentor/requirements.md` (Req 9.6, 18.7)
- **Design:** `.kiro/specs/adaptive-ai-skill-mentor/design.md` (Property 33)

## Further Reading

- [Property-Based Testing with fast-check](https://github.com/dubzzz/fast-check)
- [PostgreSQL Foreign Key Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
