/**
 * Unit Test: Referential Integrity Schema Validation
 * 
 * Feature: adaptive-ai-skill-mentor, Property 33: Referential Integrity Enforcement
 * 
 * **Validates: Requirements 9.6, 18.7**
 * 
 * These unit tests verify that the database migration files correctly define
 * the foreign key constraints with ON DELETE CASCADE to maintain referential integrity.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Referential Integrity Schema Validation', () => {
  describe('Foreign Key Constraints with CASCADE', () => {
    const migrationsDir = path.join(__dirname, '../migrations');

    test('personality_profiles table has ON DELETE CASCADE for user_id', () => {
      const migrationPath = path.join(migrationsDir, '002_create_personality_profiles_table.sql');
      const content = fs.readFileSync(migrationPath, 'utf-8');

      // Verify foreign key constraint exists
      expect(content).toMatch(/FOREIGN KEY\s*\(user_id\)/i);
      expect(content).toMatch(/REFERENCES\s+users\s*\(id\)/i);
      
      // Verify ON DELETE CASCADE is specified
      expect(content).toMatch(/ON DELETE CASCADE/i);
    });

    test('skills table has ON DELETE CASCADE for user_id', () => {
      const migrationPath = path.join(migrationsDir, '003_create_skills_table.sql');
      const content = fs.readFileSync(migrationPath, 'utf-8');

      // Verify foreign key constraint exists
      expect(content).toMatch(/FOREIGN KEY\s*\(user_id\)/i);
      expect(content).toMatch(/REFERENCES\s+users\s*\(id\)/i);
      
      // Verify ON DELETE CASCADE is specified
      expect(content).toMatch(/ON DELETE CASCADE/i);
    });

    test('roadmaps table has ON DELETE CASCADE for skill_id', () => {
      const migrationPath = path.join(migrationsDir, '004_create_roadmaps_table.sql');
      const content = fs.readFileSync(migrationPath, 'utf-8');

      // Verify foreign key constraint exists
      expect(content).toMatch(/FOREIGN KEY\s*\(skill_id\)/i);
      expect(content).toMatch(/REFERENCES\s+skills\s*\(id\)/i);
      
      // Verify ON DELETE CASCADE is specified
      expect(content).toMatch(/ON DELETE CASCADE/i);
    });

    test('sessions table has ON DELETE CASCADE for skill_id', () => {
      const migrationPath = path.join(migrationsDir, '005_create_sessions_table.sql');
      const content = fs.readFileSync(migrationPath, 'utf-8');

      // Verify foreign key constraint exists
      expect(content).toMatch(/FOREIGN KEY\s*\(skill_id\)/i);
      expect(content).toMatch(/REFERENCES\s+skills\s*\(id\)/i);
      
      // Verify ON DELETE CASCADE is specified
      expect(content).toMatch(/ON DELETE CASCADE/i);
    });

    test('performance_logs table has ON DELETE CASCADE for session_id', () => {
      const migrationPath = path.join(migrationsDir, '006_create_performance_logs_table.sql');
      const content = fs.readFileSync(migrationPath, 'utf-8');

      // Verify foreign key constraint exists
      expect(content).toMatch(/FOREIGN KEY\s*\(session_id\)/i);
      expect(content).toMatch(/REFERENCES\s+sessions\s*\(id\)/i);
      
      // Verify ON DELETE CASCADE is specified
      expect(content).toMatch(/ON DELETE CASCADE/i);
    });
  });

  describe('Cascade Chain Validation', () => {
    test('all tables in the cascade chain reference requirements 18.7', () => {
      const migrationsDir = path.join(__dirname, '../migrations');
      const cascadeTables = [
        '002_create_personality_profiles_table.sql',
        '003_create_skills_table.sql',
        '004_create_roadmaps_table.sql',
        '005_create_sessions_table.sql',
        '006_create_performance_logs_table.sql'
      ];

      cascadeTables.forEach(filename => {
        const migrationPath = path.join(migrationsDir, filename);
        const content = fs.readFileSync(migrationPath, 'utf-8');
        
        // Each table with foreign keys should reference requirement 18.7
        expect(content).toContain('18.7');
      });
    });

    test('cascade chain is complete from users to performance_logs', () => {
      const migrationsDir = path.join(__dirname, '../migrations');
      
      // Verify the complete cascade chain:
      // users -> personality_profiles (via user_id)
      // users -> skills (via user_id)
      // skills -> roadmaps (via skill_id)
      // skills -> sessions (via skill_id)
      // sessions -> performance_logs (via session_id)

      const cascadeChain = [
        {
          file: '002_create_personality_profiles_table.sql',
          foreignKey: 'user_id',
          references: 'users'
        },
        {
          file: '003_create_skills_table.sql',
          foreignKey: 'user_id',
          references: 'users'
        },
        {
          file: '004_create_roadmaps_table.sql',
          foreignKey: 'skill_id',
          references: 'skills'
        },
        {
          file: '005_create_sessions_table.sql',
          foreignKey: 'skill_id',
          references: 'skills'
        },
        {
          file: '006_create_performance_logs_table.sql',
          foreignKey: 'session_id',
          references: 'sessions'
        }
      ];

      cascadeChain.forEach(({ file, foreignKey, references }) => {
        const migrationPath = path.join(migrationsDir, file);
        const content = fs.readFileSync(migrationPath, 'utf-8');
        
        // Verify foreign key and reference
        expect(content).toMatch(new RegExp(`FOREIGN KEY\\s*\\(${foreignKey}\\)`, 'i'));
        expect(content).toMatch(new RegExp(`REFERENCES\\s+${references}\\s*\\(id\\)`, 'i'));
        expect(content).toMatch(/ON DELETE CASCADE/i);
      });
    });
  });

  describe('Referential Integrity Documentation', () => {
    test('requirement 9.6 is documented in design', () => {
      const designPath = path.join(__dirname, '../../../.kiro/specs/adaptive-ai-skill-mentor/design.md');
      
      if (fs.existsSync(designPath)) {
        const content = fs.readFileSync(designPath, 'utf-8');
        
        // Verify Property 33 exists and references requirements 9.6 and 18.7
        expect(content).toContain('Property 33');
        expect(content).toContain('Referential Integrity');
        expect(content).toContain('9.6');
        expect(content).toContain('18.7');
      }
    });

    test('requirement 18 acceptance criteria 7 specifies foreign key constraints', () => {
      const requirementsPath = path.join(__dirname, '../../../.kiro/specs/adaptive-ai-skill-mentor/requirements.md');
      
      if (fs.existsSync(requirementsPath)) {
        const content = fs.readFileSync(requirementsPath, 'utf-8');
        
        // Verify Requirement 18 exists and mentions foreign keys and referential integrity
        expect(content).toContain('Requirement 18');
        expect(content).toMatch(/foreign key/i);
        expect(content).toMatch(/referential integrity/i);
      }
    });
  });
});
