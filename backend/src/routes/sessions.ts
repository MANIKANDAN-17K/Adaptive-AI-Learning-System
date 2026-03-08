/**
 * Sessions API Routes
 * 
 * Handles endpoints for starting, interacting with, and ending learning sessions.
 */

import { Router, Response } from 'express';
import { supabase } from '../db';
import { Session, RoadmapNode, Skill, PerformanceLog } from '../types';
import { AIServiceOrchestrator } from '../services/AIServiceOrchestrator';
import { AdaptiveLearningEngine } from '../engine/AdaptiveLearningEngine';
import { authenticateToken, AuthenticatedRequest, validateRequest, validationSchemas } from '../middleware';

const router = Router();
const aiService = new AIServiceOrchestrator();
const adaptiveEngine = new AdaptiveLearningEngine();

/**
 * POST /api/sessions/start
 * 
 * Starts or resumes a learning session for a skill.
 * Retrieves skill and roadmap, generates recap if resuming.
 * 
 * Body: {
 *   skillId: string
 * }
 * 
 * Response: {
 *   sessionId: string,
 *   recap: string,
 *   currentNode: RoadmapNode
 * }
 * 
 * Requirements: 6.2, 6.4, 11.2, 15.1
 * Property 24: Recap Generation on Selection
 * Property 26: Session State Round Trip
 * Property 39: Learning Session Starts at First Node
 * Property 50: Recap Summary Round Trip
 */
router.post('/start', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.body;

    // Validate required fields
    if (!skillId) {
      res.status(400).json({ error: 'Skill ID is required' });
      return;
    }

    // Retrieve skill from database
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .single();

    if (skillError || !skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    // Retrieve roadmap from database
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('skill_id', skillId)
      .single();

    if (roadmapError || !roadmap) {
      res.status(404).json({ error: 'Roadmap not found for this skill' });
      return;
    }

    const roadmapNodes = roadmap.structure_json as RoadmapNode[];

    // Find the current node (first non-completed node)
    let currentNode = roadmapNodes.find(node => node.status === 'current');
    
    // If no current node, find the first locked node or the first node
    if (!currentNode) {
      currentNode = roadmapNodes.find(node => node.status === 'locked') || roadmapNodes[0];
    }

    if (!currentNode) {
      res.status(500).json({ error: 'No valid node found in roadmap' });
      return;
    }

    // Check if session already exists for this skill
    const { data: existingSession, error: sessionQueryError } = await supabase
      .from('sessions')
      .select('*')
      .eq('skill_id', skillId)
      .order('last_activity', { ascending: false })
      .limit(1)
      .single();

    let session: Session;
    let recap = '';

    if (sessionQueryError || !existingSession) {
      // Create new session
      const { data: newSession, error: insertError } = await supabase
        .from('sessions')
        .insert({
          skill_id: skillId,
          recap_summary: '',
          mastery_score: 0,
          confidence_level: 'medium',
          last_activity: new Date().toISOString()
        })
        .select('*')
        .single();

      if (insertError || !newSession) {
        console.error('Session creation error:', insertError);
        res.status(500).json({ 
          error: 'Failed to create session',
          message: insertError?.message || 'Unknown error'
        });
        return;
      }

      session = newSession as Session;
      recap = `Welcome to your learning journey for ${skill.skill_name}! Let's start with: ${currentNode.title}`;
    } else {
      // Resume existing session
      session = existingSession as Session;

      // Get performance history for recap generation
      const { data: performanceHistory } = await supabase
        .from('performance_logs')
        .select('*')
        .eq('session_id', session.id)
        .order('timestamp', { ascending: false })
        .limit(10);

      // Generate recap using AI service
      try {
        recap = await aiService.generateRecap(
          skill as Skill,
          session,
          (performanceHistory || []) as PerformanceLog[]
        );
      } catch (error) {
        console.error('Error generating recap:', error);
        // Fallback recap if AI service fails
        recap = `Welcome back to ${skill.skill_name}! Your current mastery score is ${session.mastery_score.toFixed(1)}%. Let's continue with: ${currentNode.title}`;
      }

      // Update last_activity timestamp
      await supabase
        .from('sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', session.id);
    }

    // Determine mentor mode for initial session state
    // Use stored preference or default to 'Professional'
    const userPreferredMode = (session.mentor_mode_preference || 'Professional') as any;
    const mentorMode = adaptiveEngine.selectMentorTone(session.confidence_level as 'low' | 'medium' | 'high', userPreferredMode);

    res.json({
      sessionId: session.id,
      recap,
      currentNode,
      masteryScore: session.mastery_score,
      confidenceLevel: session.confidence_level,
      mentorMode
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/sessions/:sessionId/mentor-mode
 * 
 * Updates the mentor mode preference for a session.
 * Persists the user's selected mentor mode to the database.
 * 
 * Params: {
 *   sessionId: string
 * }
 * 
 * Body: {
 *   mentorMode: MentorMode
 * }
 * 
 * Response: {
 *   success: boolean,
 *   mentorMode: MentorMode
 * }
 * 
 * Requirements: 5.2, 5.3
 * Property 19: Mentor Mode Selection Persistence
 * Property 20: Mentor Mode Prompt Configuration
 */
router.put('/:sessionId/mentor-mode', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { mentorMode } = req.body;

    // Validate required fields
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    if (!mentorMode) {
      res.status(400).json({ error: 'Mentor mode is required' });
      return;
    }

    // Validate mentor mode value
    const validModes = ['Professional', 'Friendly', 'Supportive', 'Challenger'];
    if (!validModes.includes(mentorMode)) {
      res.status(400).json({ 
        error: 'Invalid mentor mode',
        message: `Mentor mode must be one of: ${validModes.join(', ')}`
      });
      return;
    }

    // Update session with new mentor mode preference
    const { data: session, error: updateError } = await supabase
      .from('sessions')
      .update({ 
        mentor_mode_preference: mentorMode,
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating mentor mode:', updateError);
      res.status(500).json({ 
        error: 'Failed to update mentor mode',
        message: updateError.message
      });
      return;
    }

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({
      success: true,
      mentorMode
    });
  } catch (error) {
    console.error('Error updating mentor mode:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

/**
 * POST /api/sessions/:sessionId/interact
 * 
 * Handles user interaction during a learning session.
 * Calculates mastery score, derives confidence level, stores performance log,
 * checks for node progression, generates stretch tasks if applicable,
 * and returns AI mentor response.
 * 
 * Body: {
 *   userInput: string,
 *   accuracy: number,
 *   speed: number,
 *   attempts: number
 * }
 * 
 * Response: {
 *   mentorResponse: string,
 *   masteryScore: number,
 *   confidenceLevel: string,
 *   nextNode?: RoadmapNode,
 *   stretchTask?: Task
 * }
 * 
 * Requirements: 4.1, 4.2, 4.5, 4.8, 8.5, 11.3, 12.1, 12.2
 * Property 16: Node Progression on Threshold
 * Property 18: Performance Log Completeness
 * Property 28: User Input Triggers AI Response
 * Property 31: Performance Log Accumulation
 */
router.post(
  '/:sessionId/interact',
  authenticateToken,
  validateRequest(validationSchemas.sessionInteraction),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { userInput, accuracy, speed, attempts } = req.body;

    // Validate required fields
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    if (!userInput || typeof userInput !== 'string') {
      res.status(400).json({ error: 'User input is required' });
      return;
    }

    if (accuracy === undefined || accuracy === null || typeof accuracy !== 'number') {
      res.status(400).json({ error: 'Accuracy is required and must be a number' });
      return;
    }

    if (speed === undefined || speed === null || typeof speed !== 'number') {
      res.status(400).json({ error: 'Speed is required and must be a number' });
      return;
    }

    if (attempts === undefined || attempts === null || typeof attempts !== 'number') {
      res.status(400).json({ error: 'Attempts is required and must be a number' });
      return;
    }

    // Validate ranges
    if (accuracy < 0 || accuracy > 100) {
      res.status(400).json({ error: 'Accuracy must be between 0 and 100' });
      return;
    }

    if (speed < 0 || speed > 100) {
      res.status(400).json({ error: 'Speed must be between 0 and 100' });
      return;
    }

    if (attempts < 1) {
      res.status(400).json({ error: 'Attempts must be at least 1' });
      return;
    }

    // Retrieve session from database
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Retrieve skill
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('*')
      .eq('id', session.skill_id)
      .single();

    if (skillError || !skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    // Retrieve roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('skill_id', session.skill_id)
      .single();

    if (roadmapError || !roadmap) {
      res.status(404).json({ error: 'Roadmap not found' });
      return;
    }

    // Retrieve personality profile
    const { data: profile, error: profileError } = await supabase
      .from('personality_profiles')
      .select('*')
      .eq('user_id', skill.user_id)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ error: 'Personality profile not found' });
      return;
    }

    // Calculate mastery score using adaptive engine
    const masteryScore = adaptiveEngine.calculateMasteryScore(accuracy, speed);

    // Get performance history for confidence derivation
    const { data: performanceHistory } = await supabase
      .from('performance_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(10);

    const recentScores = (performanceHistory || []).map((log: any) => 
      adaptiveEngine.calculateMasteryScore(log.accuracy, log.speed)
    );

    // Derive confidence level
    const confidenceLevel = adaptiveEngine.deriveConfidenceLevel(
      userInput,
      recentScores,
      attempts
    );

    // Store performance log
    const { error: logError } = await supabase
      .from('performance_logs')
      .insert({
        session_id: sessionId,
        accuracy,
        speed,
        attempts,
        timestamp: new Date().toISOString()
      });

    if (logError) {
      console.error('Error storing performance log:', logError);
      // Continue execution even if logging fails
    }

    // Update session with new mastery score and confidence level
    await supabase
      .from('sessions')
      .update({
        mastery_score: masteryScore,
        confidence_level: confidenceLevel,
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId);

    // Get current roadmap nodes
    let roadmapNodes = roadmap.structure_json as RoadmapNode[];
    const currentNodeIndex = roadmapNodes.findIndex(node => node.status === 'current');
    const currentNode = roadmapNodes[currentNodeIndex];

    if (!currentNode) {
      res.status(500).json({ error: 'No current node found in roadmap' });
      return;
    }

    // Check if node threshold is met for progression
    let nextNode: RoadmapNode | undefined;
    if (masteryScore >= currentNode.mastery_threshold && currentNodeIndex < roadmapNodes.length - 1) {
      // Mark current node as completed
      roadmapNodes[currentNodeIndex].status = 'completed';
      
      // Unlock next node
      roadmapNodes[currentNodeIndex + 1].status = 'current';
      nextNode = roadmapNodes[currentNodeIndex + 1];

      // Update roadmap in database
      await supabase
        .from('roadmaps')
        .update({ structure_json: roadmapNodes })
        .eq('id', roadmap.id);
    }

    // Check if stretch task should be generated
    let stretchTask;
    if (adaptiveEngine.shouldGenerateStretchTask(masteryScore, confidenceLevel)) {
      try {
        stretchTask = await aiService.generateStretchTask(currentNode, masteryScore);
      } catch (error) {
        console.error('Error generating stretch task:', error);
        // Continue without stretch task if generation fails
      }
    }

    // Determine difficulty level
    const difficulty = adaptiveEngine.adjustDifficulty(masteryScore);

    // Determine mentor mode (with adaptive adjustments)
    // Use stored preference or default to 'Professional'
    const userPreferredMode = (session.mentor_mode_preference || 'Professional') as any;
    const mentorMode = adaptiveEngine.selectMentorTone(confidenceLevel, userPreferredMode);

    // Generate mentor response
    let mentorResponse: string;
    try {
      mentorResponse = await aiService.generateMentorResponse(
        userInput,
        {
          skill: skill as any,
          currentNode,
          masteryScore,
          confidenceLevel,
          performanceHistory: (performanceHistory || []) as any[],
          personalityProfile: profile as any
        },
        mentorMode,
        difficulty,
        sessionId  // Pass sessionId for conversation memory
      );
    } catch (error) {
      console.error('Error generating mentor response:', error);
      // Fallback response if AI service fails
      mentorResponse = `Thank you for your response. Your current mastery score is ${masteryScore.toFixed(1)}%. Keep up the good work!`;
    }

    res.json({
      mentorResponse,
      masteryScore,
      confidenceLevel,
      mentorMode,
      nextNode,
      stretchTask
    });
  } catch (error) {
    console.error('Error processing interaction:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/sessions/:sessionId/end
 * 
 * Ends a learning session and stores a recap summary for the next session.
 * 
 * Body: {
 *   recapSummary: string
 * }
 * 
 * Response: {
 *   success: boolean
 * }
 * 
 * Requirements: 6.5, 15.4
 * Property 27: Session Update Completeness
 * Property 50: Recap Summary Round Trip
 */
router.put(
  '/:sessionId/end',
  authenticateToken,
  validateRequest(validationSchemas.sessionEnd),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { recapSummary } = req.body;

    // Validate required fields
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    if (!recapSummary || typeof recapSummary !== 'string') {
      res.status(400).json({ error: 'Recap summary is required' });
      return;
    }

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Update session with recap summary and last_activity timestamp
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        recap_summary: recapSummary.trim(),
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
      res.status(500).json({ 
        error: 'Failed to end session',
        message: updateError.message
      });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
