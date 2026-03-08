/**
 * Migration Tests
 * 
 * Tests to verify database migration files are correctly structured
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Database Migrations', () => {
  describe('001_create_users_table.sql', () => {
    const migrationPath = path.join(__dirname, '../migrations/001_create_users_table.sql');
    let migrationContent: string;

    beforeAll(() => {
      migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    });

    it('should exist', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it('should create users table', () => {
      expect(migrationContent).toContain('CREATE TABLE');
      expect(migrationContent).toContain('users');
    });

    it('should define id column as UUID primary key', () => {
      expect(migrationContent).toMatch(/id\s+UUID\s+PRIMARY KEY/i);
    });

    it('should define name column as VARCHAR NOT NULL', () => {
      expect(migrationContent).toMatch(/name\s+VARCHAR.*NOT NULL/i);
    });

    it('should define email column as VARCHAR NOT NULL UNIQUE', () => {
      expect(migrationContent).toMatch(/email\s+VARCHAR.*NOT NULL.*UNIQUE/i);
    });

    it('should define created_at column as TIMESTAMP', () => {
      expect(migrationContent).toMatch(/created_at\s+TIMESTAMP/i);
    });

    it('should have default value for created_at', () => {
      expect(migrationContent).toMatch(/created_at.*DEFAULT/i);
    });

    it('should use IF NOT EXISTS for idempotency', () => {
      expect(migrationContent).toContain('IF NOT EXISTS');
    });

    it('should create index on email', () => {
      expect(migrationContent).toMatch(/CREATE INDEX.*idx_users_email.*ON users\(email\)/i);
    });

    it('should reference requirement 18.1', () => {
      expect(migrationContent).toContain('18.1');
    });
  });

  describe('004_create_roadmaps_table.sql', () => {
    const migrationPath = path.join(__dirname, '../migrations/004_create_roadmaps_table.sql');
    let migrationContent: string;

    beforeAll(() => {
      migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    });

    it('should exist', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it('should create roadmaps table', () => {
      expect(migrationContent).toContain('CREATE TABLE');
      expect(migrationContent).toContain('roadmaps');
    });

    it('should define id column as UUID primary key', () => {
      expect(migrationContent).toMatch(/id\s+UUID\s+PRIMARY KEY/i);
    });

    it('should define skill_id column as UUID NOT NULL UNIQUE', () => {
      expect(migrationContent).toMatch(/skill_id\s+UUID\s+NOT NULL\s+UNIQUE/i);
    });

    it('should define structure_json column as JSONB NOT NULL', () => {
      expect(migrationContent).toMatch(/structure_json\s+JSONB\s+NOT NULL/i);
    });

    it('should define mastery_threshold column as FLOAT NOT NULL', () => {
      expect(migrationContent).toMatch(/mastery_threshold\s+FLOAT\s+NOT NULL/i);
    });

    it('should have CHECK constraint on mastery_threshold', () => {
      expect(migrationContent).toMatch(/CHECK\s*\(mastery_threshold\s*>=\s*0\s+AND\s+mastery_threshold\s*<=\s*100\)/i);
    });

    it('should define created_at column as TIMESTAMP', () => {
      expect(migrationContent).toMatch(/created_at\s+TIMESTAMP/i);
    });

    it('should have default value for created_at', () => {
      expect(migrationContent).toMatch(/created_at.*DEFAULT/i);
    });

    it('should use IF NOT EXISTS for idempotency', () => {
      expect(migrationContent).toContain('IF NOT EXISTS');
    });

    it('should create foreign key constraint to skills table', () => {
      expect(migrationContent).toMatch(/FOREIGN KEY\s*\(skill_id\)/i);
      expect(migrationContent).toMatch(/REFERENCES\s+skills\s*\(id\)/i);
    });

    it('should have ON DELETE CASCADE for foreign key', () => {
      expect(migrationContent).toMatch(/ON DELETE CASCADE/i);
    });

    it('should create index on skill_id', () => {
      expect(migrationContent).toMatch(/CREATE INDEX.*idx_roadmaps_skill_id.*ON roadmaps\(skill_id\)/i);
    });

    it('should create GIN index on structure_json', () => {
      expect(migrationContent).toMatch(/CREATE INDEX.*idx_roadmaps_structure_json.*ON roadmaps\s+USING GIN\s*\(structure_json\)/i);
    });

    it('should reference requirements 18.4 and 18.7', () => {
      expect(migrationContent).toContain('18.4');
      expect(migrationContent).toContain('18.7');
    });
  });

  describe('006_create_performance_logs_table.sql', () => {
    const migrationPath = path.join(__dirname, '../migrations/006_create_performance_logs_table.sql');
    let migrationContent: string;

    beforeAll(() => {
      migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    });

    it('should exist', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it('should create performance_logs table', () => {
      expect(migrationContent).toContain('CREATE TABLE');
      expect(migrationContent).toContain('performance_logs');
    });

    it('should define id column as UUID primary key', () => {
      expect(migrationContent).toMatch(/id\s+UUID\s+PRIMARY KEY/i);
    });

    it('should define session_id column as UUID NOT NULL', () => {
      expect(migrationContent).toMatch(/session_id\s+UUID\s+NOT NULL/i);
    });

    it('should define accuracy column as FLOAT NOT NULL', () => {
      expect(migrationContent).toMatch(/accuracy\s+FLOAT\s+NOT NULL/i);
    });

    it('should have CHECK constraint on accuracy', () => {
      expect(migrationContent).toMatch(/CHECK\s*\(accuracy\s*>=\s*0\s+AND\s+accuracy\s*<=\s*100\)/i);
    });

    it('should define speed column as FLOAT NOT NULL', () => {
      expect(migrationContent).toMatch(/speed\s+FLOAT\s+NOT NULL/i);
    });

    it('should have CHECK constraint on speed', () => {
      expect(migrationContent).toMatch(/CHECK\s*\(speed\s*>=\s*0\s+AND\s+speed\s*<=\s*100\)/i);
    });

    it('should define attempts column as INTEGER NOT NULL', () => {
      expect(migrationContent).toMatch(/attempts\s+INTEGER\s+NOT NULL/i);
    });

    it('should have CHECK constraint on attempts', () => {
      expect(migrationContent).toMatch(/CHECK\s*\(attempts\s*>\s*0\)/i);
    });

    it('should define timestamp column as TIMESTAMP', () => {
      expect(migrationContent).toMatch(/timestamp\s+TIMESTAMP/i);
    });

    it('should have default value for timestamp', () => {
      expect(migrationContent).toMatch(/timestamp.*DEFAULT/i);
    });

    it('should use IF NOT EXISTS for idempotency', () => {
      expect(migrationContent).toContain('IF NOT EXISTS');
    });

    it('should create foreign key constraint to sessions table', () => {
      expect(migrationContent).toMatch(/FOREIGN KEY\s*\(session_id\)/i);
      expect(migrationContent).toMatch(/REFERENCES\s+sessions\s*\(id\)/i);
    });

    it('should have ON DELETE CASCADE for foreign key', () => {
      expect(migrationContent).toMatch(/ON DELETE CASCADE/i);
    });

    it('should create index on session_id', () => {
      expect(migrationContent).toMatch(/CREATE INDEX.*idx_performance_logs_session_id.*ON performance_logs\(session_id\)/i);
    });

    it('should create index on timestamp', () => {
      expect(migrationContent).toMatch(/CREATE INDEX.*idx_performance_logs_timestamp.*ON performance_logs\(timestamp/i);
    });

    it('should reference requirements 18.6 and 18.7', () => {
      expect(migrationContent).toContain('18.6');
      expect(migrationContent).toContain('18.7');
    });
  });

  describe('Migration file naming', () => {
    it('should follow sequential naming convention', () => {
      const migrationsDir = path.join(__dirname, '../migrations');
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      
      expect(files).toContain('001_create_users_table.sql');
      
      // Verify naming pattern: NNN_description.sql
      files.forEach(file => {
        expect(file).toMatch(/^\d{3}_[a-z_]+\.sql$/);
      });
    });
  });
});
