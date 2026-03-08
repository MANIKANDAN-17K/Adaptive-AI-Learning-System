/**
 * Property-Based Test: Referential Integrity Enforcement
 * 
 * Feature: adaptive-ai-skill-mentor, Property 33: Referential Integrity Enforcement
 * 
 * **Validates: Requirements 9.6, 18.7**
 * 
 * Property: For any attempt to delete a user with associated skills, the database should
 * either prevent the deletion or cascade delete all related records (skills, roadmaps,
 * sessions, performance_logs) to maintain referential integrity.
 * 
 * This test verifies that the database maintains referential integrity through cascade
 * deletion. When a user is deleted, all related records should be automatically removed.
 */

import fc from 'fast-check';
import {
  createTestUser,
  createTestSkill,
  createTestRoadmap,
  createTestSession,
  createTestPerformanceLog,
  deleteUser,
  userExists,
  skillExists,
  roadmapExists,
  sessionExists,
  performanceLogExists,
  cleanupTestUser
} from './test-db-utils';

// Skip tests if database is not configured
const isDbConfigured = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
const describeOrSkip = isDbConfigured ? describe : describe.skip;

describeOrSkip('Property 33: Referential Integrity Enforcement', () => {
  // Arbitraries for generating test data
  const userNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
  const emailArb = fc.emailAddress();
  const skillNameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
  const goalArb = fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0);
  const timelineArb = fc.integer({ min: 1, max: 365 });
  const masteryThresholdArb = fc.float({ min: 0, max: 100 });
  const recapSummaryArb = fc.string({ minLength: 0, maxLength: 1000 });
  const masteryScoreArb = fc.float({ min: 0, max: 100 });
  const confidenceLevelArb = fc.constantFrom('low', 'medium', 'high');
  const accuracyArb = fc.float({ min: 0, max: 100 });
  const speedArb = fc.float({ min: 0, max: 100 });
  const attemptsArb = fc.integer({ min: 1, max: 10 });

  // Simple roadmap structure generator
  const roadmapStructureArb = fc.array(
    fc.record({
      node_id: fc.uuid(),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ minLength: 1, maxLength: 500 }),
      mastery_threshold: fc.float({ min: 0, max: 100 }),
      status: fc.constantFrom('locked', 'current', 'completed'),
      order: fc.integer({ min: 0, max: 20 })
    }),
    { minLength: 1, maxLength: 5 }
  );

  test('deleting a user cascades to all related records', async () => {
    await fc.assert(
      fc.asyncProperty(
        userNameArb,
        emailArb,
        skillNameArb,
        goalArb,
        timelineArb,
        roadmapStructureArb,
        masteryThresholdArb,
        recapSummaryArb,
        masteryScoreArb,
        confidenceLevelArb,
        accuracyArb,
        speedArb,
        attemptsArb,
        async (
          userName,
          email,
          skillName,
          goal,
          timeline,
          roadmapStructure,
          masteryThreshold,
          recapSummary,
          masteryScore,
          confidenceLevel,
          accuracy,
          speed,
          attempts
        ) => {
          // Make email unique for this test run
          const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@${email.split('@')[1] || 'example.com'}`;
          
          let userId: string | null = null;
          let skillId: string | null = null;
          let roadmapId: string | null = null;
          let sessionId: string | null = null;
          let performanceLogId: string | null = null;

          try {
            // Create a complete hierarchy of related records
            userId = await createTestUser(userName, uniqueEmail);
            expect(userId).toBeDefined();
            expect(await userExists(userId)).toBe(true);

            skillId = await createTestSkill(userId, skillName, goal, timeline);
            expect(skillId).toBeDefined();
            expect(await skillExists(skillId)).toBe(true);

            roadmapId = await createTestRoadmap(skillId, roadmapStructure, masteryThreshold);
            expect(roadmapId).toBeDefined();
            expect(await roadmapExists(roadmapId)).toBe(true);

            sessionId = await createTestSession(skillId, recapSummary, masteryScore, confidenceLevel);
            expect(sessionId).toBeDefined();
            expect(await sessionExists(sessionId)).toBe(true);

            performanceLogId = await createTestPerformanceLog(sessionId, accuracy, speed, attempts);
            expect(performanceLogId).toBeDefined();
            expect(await performanceLogExists(performanceLogId)).toBe(true);

            // Now delete the user - this should cascade to all related records
            await deleteUser(userId);

            // Verify that the user no longer exists
            expect(await userExists(userId)).toBe(false);

            // Verify that all related records have been cascade deleted
            expect(await skillExists(skillId)).toBe(false);
            expect(await roadmapExists(roadmapId)).toBe(false);
            expect(await sessionExists(sessionId)).toBe(false);
            expect(await performanceLogExists(performanceLogId)).toBe(false);

            // Mark as cleaned up
            userId = null;
          } catch (error) {
            // Clean up on error
            if (userId) {
              await cleanupTestUser(userId);
            }
            throw error;
          }
        }
      ),
      { numRuns: 10, timeout: 30000 } // Reduced runs for database operations, increased timeout
    );
  }, 60000); // 60 second timeout for the entire test

  test('deleting a user with multiple skills cascades all related records', async () => {
    await fc.assert(
      fc.asyncProperty(
        userNameArb,
        emailArb,
        fc.array(
          fc.record({
            skillName: skillNameArb,
            goal: goalArb,
            timeline: timelineArb,
            roadmapStructure: roadmapStructureArb,
            masteryThreshold: masteryThresholdArb,
            recapSummary: recapSummaryArb,
            masteryScore: masteryScoreArb,
            confidenceLevel: confidenceLevelArb,
            performanceLogs: fc.array(
              fc.record({
                accuracy: accuracyArb,
                speed: speedArb,
                attempts: attemptsArb
              }),
              { minLength: 1, maxLength: 3 }
            )
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (userName, email, skills) => {
          // Make email unique for this test run
          const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@${email.split('@')[1] || 'example.com'}`;
          
          let userId: string | null = null;
          const skillIds: string[] = [];
          const roadmapIds: string[] = [];
          const sessionIds: string[] = [];
          const performanceLogIds: string[] = [];

          try {
            // Create user
            userId = await createTestUser(userName, uniqueEmail);
            expect(await userExists(userId)).toBe(true);

            // Create multiple skills with their related records
            for (const skill of skills) {
              const skillId = await createTestSkill(userId, skill.skillName, skill.goal, skill.timeline);
              skillIds.push(skillId);
              expect(await skillExists(skillId)).toBe(true);

              const roadmapId = await createTestRoadmap(skillId, skill.roadmapStructure, skill.masteryThreshold);
              roadmapIds.push(roadmapId);
              expect(await roadmapExists(roadmapId)).toBe(true);

              const sessionId = await createTestSession(
                skillId,
                skill.recapSummary,
                skill.masteryScore,
                skill.confidenceLevel
              );
              sessionIds.push(sessionId);
              expect(await sessionExists(sessionId)).toBe(true);

              // Create multiple performance logs for this session
              for (const log of skill.performanceLogs) {
                const logId = await createTestPerformanceLog(sessionId, log.accuracy, log.speed, log.attempts);
                performanceLogIds.push(logId);
                expect(await performanceLogExists(logId)).toBe(true);
              }
            }

            // Delete the user - should cascade to all related records
            await deleteUser(userId);

            // Verify user is deleted
            expect(await userExists(userId)).toBe(false);

            // Verify all skills are deleted
            for (const skillId of skillIds) {
              expect(await skillExists(skillId)).toBe(false);
            }

            // Verify all roadmaps are deleted
            for (const roadmapId of roadmapIds) {
              expect(await roadmapExists(roadmapId)).toBe(false);
            }

            // Verify all sessions are deleted
            for (const sessionId of sessionIds) {
              expect(await sessionExists(sessionId)).toBe(false);
            }

            // Verify all performance logs are deleted
            for (const logId of performanceLogIds) {
              expect(await performanceLogExists(logId)).toBe(false);
            }

            // Mark as cleaned up
            userId = null;
          } catch (error) {
            // Clean up on error
            if (userId) {
              await cleanupTestUser(userId);
            }
            throw error;
          }
        }
      ),
      { numRuns: 5, timeout: 60000 } // Fewer runs for complex test, longer timeout
    );
  }, 120000); // 2 minute timeout for the entire test
});
