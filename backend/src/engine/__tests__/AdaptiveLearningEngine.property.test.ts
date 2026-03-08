/**
 * Property-Based Test: Mastery Score Calculation
 * 
 * Feature: adaptive-ai-skill-mentor, Property 14: Mastery Score Calculation
 * 
 * **Validates: Requirements 4.1, 12.3**
 * 
 * Property: For any accuracy value (0-100) and speed value (0-100), the calculated
 * Mastery_Score should equal (accuracy × 0.7) + (speed × 0.3) and be within the range [0, 100].
 * 
 * This test verifies that the mastery score calculation is correct across all valid inputs
 * and maintains the expected mathematical properties.
 */

import fc from 'fast-check';
import { AdaptiveLearningEngine } from '../AdaptiveLearningEngine';

describe('Property 14: Mastery Score Calculation', () => {
  let engine: AdaptiveLearningEngine;

  beforeEach(() => {
    engine = new AdaptiveLearningEngine();
  });

  test('mastery score calculation is correct for all valid inputs', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }), // accuracy
        fc.float({ min: 0, max: 100, noNaN: true }), // speed
        (accuracy, speed) => {
          const masteryScore = engine.calculateMasteryScore(accuracy, speed);
          const expected = (accuracy * 0.7) + (speed * 0.3);
          
          // Verify the formula is applied correctly
          expect(masteryScore).toBeCloseTo(expected, 5);
          
          // Verify the result is within valid range
          expect(masteryScore).toBeGreaterThanOrEqual(0);
          expect(masteryScore).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mastery score is always within [0, 100] range', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (accuracy, speed) => {
          const masteryScore = engine.calculateMasteryScore(accuracy, speed);
          
          // The result must always be in the valid range
          expect(masteryScore).toBeGreaterThanOrEqual(0);
          expect(masteryScore).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mastery score weights accuracy more heavily than speed', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        (value) => {
          // When accuracy is high and speed is 0, score should be higher
          // than when speed is high and accuracy is 0
          const highAccuracyScore = engine.calculateMasteryScore(value, 0);
          const highSpeedScore = engine.calculateMasteryScore(0, value);
          
          // Since accuracy weight (0.7) > speed weight (0.3),
          // high accuracy should always produce a higher score
          if (value > 0) {
            expect(highAccuracyScore).toBeGreaterThan(highSpeedScore);
          } else {
            // When value is 0, both should be 0
            expect(highAccuracyScore).toBe(0);
            expect(highSpeedScore).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mastery score is monotonically increasing with accuracy', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 99, noNaN: true }), // accuracy1 (max 99 to ensure accuracy2 > accuracy1)
        fc.float({ min: 0, max: 100, noNaN: true }), // speed (constant)
        (accuracy1, speed) => {
          const accuracy2 = accuracy1 + 1; // Slightly higher accuracy
          
          const score1 = engine.calculateMasteryScore(accuracy1, speed);
          const score2 = engine.calculateMasteryScore(accuracy2, speed);
          
          // Higher accuracy should produce higher or equal mastery score
          expect(score2).toBeGreaterThanOrEqual(score1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mastery score is monotonically increasing with speed', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }), // accuracy (constant)
        fc.float({ min: 0, max: 99, noNaN: true }),  // speed1 (max 99 to ensure speed2 > speed1)
        (accuracy, speed1) => {
          const speed2 = speed1 + 1; // Slightly higher speed
          
          const score1 = engine.calculateMasteryScore(accuracy, speed1);
          const score2 = engine.calculateMasteryScore(accuracy, speed2);
          
          // Higher speed should produce higher or equal mastery score
          expect(score2).toBeGreaterThanOrEqual(score1);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mastery score at boundaries produces expected values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { accuracy: 0, speed: 0, expected: 0 },
          { accuracy: 100, speed: 100, expected: 100 },
          { accuracy: 100, speed: 0, expected: 70 },
          { accuracy: 0, speed: 100, expected: 30 }
        ),
        (testCase) => {
          const masteryScore = engine.calculateMasteryScore(testCase.accuracy, testCase.speed);
          expect(masteryScore).toBeCloseTo(testCase.expected, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mastery score rejects invalid accuracy values', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.float({ min: Math.fround(-1000), max: Math.fround(-0.01), noNaN: true }), // Negative values
          fc.float({ min: Math.fround(100.01), max: Math.fround(1000), noNaN: true })  // Values above 100
        ),
        fc.float({ min: 0, max: 100, noNaN: true }), // Valid speed
        (invalidAccuracy, speed) => {
          expect(() => engine.calculateMasteryScore(invalidAccuracy, speed)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mastery score rejects invalid speed values', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }), // Valid accuracy
        fc.oneof(
          fc.float({ min: Math.fround(-1000), max: Math.fround(-0.01), noNaN: true }), // Negative values
          fc.float({ min: Math.fround(100.01), max: Math.fround(1000), noNaN: true })  // Values above 100
        ),
        (accuracy, invalidSpeed) => {
          expect(() => engine.calculateMasteryScore(accuracy, invalidSpeed)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mastery score is commutative in terms of order of operations', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (accuracy, speed) => {
          // Calculate in different ways to verify consistency
          const score1 = engine.calculateMasteryScore(accuracy, speed);
          const score2 = (accuracy * 0.7) + (speed * 0.3);
          const score3 = (speed * 0.3) + (accuracy * 0.7); // Reversed order
          
          expect(score1).toBeCloseTo(score2, 5);
          expect(score1).toBeCloseTo(score3, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
