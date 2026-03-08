/**
 * Unit tests for AdaptiveLearningEngine
 * 
 * These tests verify specific examples and edge cases for the adaptive learning engine.
 */

import { AdaptiveLearningEngine } from '../AdaptiveLearningEngine';

describe('AdaptiveLearningEngine', () => {
  let engine: AdaptiveLearningEngine;

  beforeEach(() => {
    engine = new AdaptiveLearningEngine();
  });

  describe('calculateMasteryScore', () => {
    it('should calculate mastery score with the correct formula', () => {
      // Test case: accuracy = 80, speed = 60
      // Expected: (80 * 0.7) + (60 * 0.3) = 56 + 18 = 74
      const result = engine.calculateMasteryScore(80, 60);
      expect(result).toBeCloseTo(74, 2);
    });

    it('should return 0 when both accuracy and speed are 0', () => {
      const result = engine.calculateMasteryScore(0, 0);
      expect(result).toBe(0);
    });

    it('should return 100 when both accuracy and speed are 100', () => {
      const result = engine.calculateMasteryScore(100, 100);
      expect(result).toBe(100);
    });

    it('should weight accuracy more heavily than speed', () => {
      // High accuracy, low speed
      const highAccuracy = engine.calculateMasteryScore(100, 0);
      // Low accuracy, high speed
      const highSpeed = engine.calculateMasteryScore(0, 100);
      
      // High accuracy should result in higher mastery score
      expect(highAccuracy).toBeGreaterThan(highSpeed);
      expect(highAccuracy).toBeCloseTo(70, 2); // 100 * 0.7 = 70
      expect(highSpeed).toBeCloseTo(30, 2);    // 100 * 0.3 = 30
    });

    it('should handle decimal values correctly', () => {
      const result = engine.calculateMasteryScore(75.5, 82.3);
      const expected = (75.5 * 0.7) + (82.3 * 0.3);
      expect(result).toBeCloseTo(expected, 2);
    });

    it('should throw error when accuracy is below 0', () => {
      expect(() => engine.calculateMasteryScore(-1, 50)).toThrow(
        'Accuracy must be between 0 and 100, got -1'
      );
    });

    it('should throw error when accuracy is above 100', () => {
      expect(() => engine.calculateMasteryScore(101, 50)).toThrow(
        'Accuracy must be between 0 and 100, got 101'
      );
    });

    it('should throw error when speed is below 0', () => {
      expect(() => engine.calculateMasteryScore(50, -1)).toThrow(
        'Speed must be between 0 and 100, got -1'
      );
    });

    it('should throw error when speed is above 100', () => {
      expect(() => engine.calculateMasteryScore(50, 101)).toThrow(
        'Speed must be between 0 and 100, got 101'
      );
    });

    it('should handle boundary values at 0', () => {
      expect(engine.calculateMasteryScore(0, 50)).toBeCloseTo(15, 2);
      expect(engine.calculateMasteryScore(50, 0)).toBeCloseTo(35, 2);
    });

    it('should handle boundary values at 100', () => {
      expect(engine.calculateMasteryScore(100, 50)).toBeCloseTo(85, 2);
      expect(engine.calculateMasteryScore(50, 100)).toBeCloseTo(65, 2);
    });
  });

  describe('deriveConfidenceLevel', () => {
    it('should return high confidence for positive tone, improving trend, and low retries', () => {
      const result = engine.deriveConfidenceLevel(
        'I am confident and understand this clearly',
        [60, 70, 80],
        1
      );
      expect(result).toBe('high');
    });

    it('should return low confidence for uncertain tone, declining trend, and high retries', () => {
      const result = engine.deriveConfidenceLevel(
        'I am unsure and confused about this',
        [80, 70, 60],
        4
      );
      expect(result).toBe('low');
    });

    it('should return medium confidence for neutral inputs', () => {
      const result = engine.deriveConfidenceLevel(
        'This is a neutral statement',
        [70, 70, 70],
        2
      );
      expect(result).toBe('medium');
    });

    it('should handle empty performance trend', () => {
      const result = engine.deriveConfidenceLevel(
        'I understand this',
        [],
        1
      );
      expect(result).toBe('high');
    });

    it('should handle mixed signals', () => {
      const result = engine.deriveConfidenceLevel(
        'I am confident but also confused',
        [70, 70],
        2
      );
      expect(result).toBe('medium');
    });
  });

  describe('shouldGenerateStretchTask', () => {
    it('should return true when mastery > 80 and confidence is high', () => {
      expect(engine.shouldGenerateStretchTask(85, 'high')).toBe(true);
      expect(engine.shouldGenerateStretchTask(90, 'high')).toBe(true);
      expect(engine.shouldGenerateStretchTask(100, 'high')).toBe(true);
    });

    it('should return false when mastery <= 80', () => {
      expect(engine.shouldGenerateStretchTask(80, 'high')).toBe(false);
      expect(engine.shouldGenerateStretchTask(75, 'high')).toBe(false);
      expect(engine.shouldGenerateStretchTask(50, 'high')).toBe(false);
    });

    it('should return false when confidence is not high', () => {
      expect(engine.shouldGenerateStretchTask(85, 'medium')).toBe(false);
      expect(engine.shouldGenerateStretchTask(85, 'low')).toBe(false);
      expect(engine.shouldGenerateStretchTask(90, 'medium')).toBe(false);
    });

    it('should return false when both conditions are not met', () => {
      expect(engine.shouldGenerateStretchTask(75, 'medium')).toBe(false);
      expect(engine.shouldGenerateStretchTask(50, 'low')).toBe(false);
    });
  });

  describe('adjustDifficulty', () => {
    it('should return simplified when mastery < 50', () => {
      expect(engine.adjustDifficulty(0)).toBe('simplified');
      expect(engine.adjustDifficulty(25)).toBe('simplified');
      expect(engine.adjustDifficulty(49)).toBe('simplified');
    });

    it('should return standard when mastery is between 50 and 80', () => {
      expect(engine.adjustDifficulty(50)).toBe('standard');
      expect(engine.adjustDifficulty(65)).toBe('standard');
      expect(engine.adjustDifficulty(80)).toBe('standard');
    });

    it('should return advanced when mastery > 80', () => {
      expect(engine.adjustDifficulty(81)).toBe('advanced');
      expect(engine.adjustDifficulty(90)).toBe('advanced');
      expect(engine.adjustDifficulty(100)).toBe('advanced');
    });
  });

  describe('selectMentorTone', () => {
    it('should return Supportive for low confidence regardless of preference', () => {
      expect(engine.selectMentorTone('low', 'Professional')).toBe('Supportive');
      expect(engine.selectMentorTone('low', 'Friendly')).toBe('Supportive');
      expect(engine.selectMentorTone('low', 'Challenger')).toBe('Supportive');
      expect(engine.selectMentorTone('low', 'Supportive')).toBe('Supportive');
    });

    it('should return Challenger for high confidence regardless of preference', () => {
      expect(engine.selectMentorTone('high', 'Professional')).toBe('Challenger');
      expect(engine.selectMentorTone('high', 'Friendly')).toBe('Challenger');
      expect(engine.selectMentorTone('high', 'Supportive')).toBe('Challenger');
      expect(engine.selectMentorTone('high', 'Challenger')).toBe('Challenger');
    });

    it('should return user preference for medium confidence', () => {
      expect(engine.selectMentorTone('medium', 'Professional')).toBe('Professional');
      expect(engine.selectMentorTone('medium', 'Friendly')).toBe('Friendly');
      expect(engine.selectMentorTone('medium', 'Supportive')).toBe('Supportive');
      expect(engine.selectMentorTone('medium', 'Challenger')).toBe('Challenger');
    });
  });
});
