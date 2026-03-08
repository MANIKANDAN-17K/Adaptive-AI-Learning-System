/**
 * Adaptive Learning Engine
 * 
 * Core engine that calculates performance metrics and determines adaptive
 * adjustments for the learning experience based on real-time user performance.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 12.3, 12.4
 */

import { MentorMode } from '../types';

/**
 * AdaptiveLearningEngine provides methods for calculating performance metrics
 * and determining adaptive adjustments to the learning experience.
 */
export class AdaptiveLearningEngine {
  /**
   * Calculate mastery score based on accuracy and speed metrics
   * 
   * Formula: (accuracy × 0.7) + (speed × 0.3)
   * 
   * @param accuracy - Correctness score (0-100)
   * @param speed - Response speed score (0-100)
   * @returns Mastery score (0-100)
   * 
   * @throws {Error} If accuracy or speed are outside the valid range [0, 100]
   * 
   * Requirements: 4.1, 12.3
   * Property 14: Mastery Score Calculation
   */
  calculateMasteryScore(accuracy: number, speed: number): number {
    // Validate inputs
    if (accuracy < 0 || accuracy > 100) {
      throw new Error(`Accuracy must be between 0 and 100, got ${accuracy}`);
    }
    if (speed < 0 || speed > 100) {
      throw new Error(`Speed must be between 0 and 100, got ${speed}`);
    }

    // Calculate mastery score using the specified formula
    const masteryScore = (accuracy * 0.7) + (speed * 0.3);

    // Ensure result is within valid range (should always be true given input validation)
    return Math.max(0, Math.min(100, masteryScore));
  }

  /**
   * Derive confidence level from language tone, performance trends, and retry frequency
   * 
   * Analyzes multiple factors to determine user confidence:
   * - Language tone: positive/assertive vs hesitant/uncertain
   * - Performance trends: improving vs declining
   * - Retry frequency: low retries indicate confidence
   * 
   * @param languageTone - Sentiment score from user language (-1 to 1, where 1 is most confident)
   * @param performanceTrend - Array of recent mastery scores showing trend
   * @param retryFrequency - Average number of retries per task
   * @returns Confidence level: 'low', 'medium', or 'high'
   * 
   * Requirements: 4.2, 12.4
   * Property 15: Confidence Level Derivation
   */
  deriveConfidenceLevel(
    languageTone: string,
    performanceTrend: number[],
    retryFrequency: number
  ): 'low' | 'medium' | 'high' {
    // Parse language tone to sentiment score
    // Simple heuristic: look for confidence indicators
    const confidenceKeywords = ['confident', 'sure', 'understand', 'got it', 'easy', 'clear'];
    const uncertainKeywords = ['unsure', 'confused', 'difficult', 'hard', 'maybe', 'think', 'guess'];
    
    const lowerTone = languageTone.toLowerCase();
    const hasConfidence = confidenceKeywords.some(word => lowerTone.includes(word));
    const hasUncertainty = uncertainKeywords.some(word => lowerTone.includes(word));
    
    let toneScore = 0; // -1 to 1
    if (hasConfidence && !hasUncertainty) toneScore = 1;
    else if (hasUncertainty && !hasConfidence) toneScore = -1;
    else if (hasConfidence && hasUncertainty) toneScore = 0;
    else toneScore = 0; // Neutral
    
    // Analyze performance trend
    let trendScore = 0; // -1 to 1
    if (performanceTrend.length >= 2) {
      const recent = performanceTrend.slice(-3); // Last 3 scores
      const isImproving = recent.length >= 2 && recent[recent.length - 1] > recent[0];
      const isDeclining = recent.length >= 2 && recent[recent.length - 1] < recent[0];
      const avgScore = recent.reduce((sum, score) => sum + score, 0) / recent.length;
      
      if (isImproving && avgScore > 70) trendScore = 1;
      else if (isDeclining || avgScore < 50) trendScore = -1;
      else trendScore = 0;
    }
    
    // Analyze retry frequency
    let retryScore = 0; // -1 to 1
    if (retryFrequency <= 1) retryScore = 1; // Low retries = high confidence
    else if (retryFrequency >= 3) retryScore = -1; // High retries = low confidence
    else retryScore = 0;
    
    // Combine scores with weights
    const confidenceScore = (toneScore * 0.4) + (trendScore * 0.4) + (retryScore * 0.2);
    
    // Map to confidence level
    if (confidenceScore > 0.3) return 'high';
    if (confidenceScore < -0.3) return 'low';
    return 'medium';
  }

  /**
   * Determine if a stretch task should be generated
   * 
   * Stretch tasks are optional advanced challenges generated when the user
   * demonstrates high mastery and confidence.
   * 
   * @param masteryScore - Current mastery score (0-100)
   * @param confidenceLevel - Current confidence level
   * @returns True if stretch task should be generated
   * 
   * Requirements: 4.4
   */
  shouldGenerateStretchTask(
    masteryScore: number,
    confidenceLevel: 'low' | 'medium' | 'high'
  ): boolean {
    return masteryScore > 80 && confidenceLevel === 'high';
  }

  /**
   * Adjust difficulty level based on mastery score
   * 
   * Determines the appropriate difficulty level for content delivery:
   * - Simplified: For struggling learners (mastery < 50%)
   * - Standard: For learners on track (mastery 50-80%)
   * - Advanced: For high performers (mastery > 80%)
   * 
   * @param masteryScore - Current mastery score (0-100)
   * @returns Difficulty level: 'simplified', 'standard', or 'advanced'
   * 
   * Requirements: 4.3
   */
  adjustDifficulty(masteryScore: number): 'simplified' | 'standard' | 'advanced' {
    if (masteryScore < 50) return 'simplified';
    if (masteryScore > 80) return 'advanced';
    return 'standard';
  }

  /**
   * Select appropriate mentor tone based on confidence level and user preference
   * 
   * Applies adaptive adjustments to mentor tone while preserving user preference:
   * - Low confidence: Use supportive tone (temporarily override to Supportive)
   * - High confidence: Use motivating tone (temporarily override to Challenger)
   * - Medium confidence: Use user's preferred mode
   * 
   * The original user preference is preserved and restored when confidence normalizes.
   * 
   * @param confidenceLevel - Current confidence level
   * @param userPreference - User's selected mentor mode
   * @returns Mentor mode to use for current interaction
   * 
   * Requirements: 4.6, 4.7, 5.5
   * Property 17: Adaptive Tone Adjustment
   * Property 22: Adaptive Mode Preservation
   */
  selectMentorTone(
    confidenceLevel: 'low' | 'medium' | 'high',
    userPreference: MentorMode
  ): MentorMode {
    // Apply adaptive adjustments based on confidence
    if (confidenceLevel === 'low') {
      return 'Supportive'; // Override to supportive for low confidence
    }
    if (confidenceLevel === 'high') {
      return 'Challenger'; // Override to motivating for high confidence
    }
    // Medium confidence: use user preference
    return userPreference;
  }
}
