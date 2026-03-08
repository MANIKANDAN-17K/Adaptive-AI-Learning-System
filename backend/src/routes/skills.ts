/**
 * Skills API Routes
 * 
 * Handles endpoints for creating and retrieving skills.
 */

import { Router, Response } from 'express';
import { supabase } from '../db';
import { Skill } from '../types';
import { authenticateToken, AuthenticatedRequest, validateRequest, validationSchemas } from '../middleware';

const router = Router();

/**
 * POST /api/skills
 * 
 * Creates a new skill for a user.
 * Validates input and checks if user has a personality profile.
 * 
 * Body: {
 *   skillName: string,
 *   goal: string,
 *   timeline: number
 * }
 * 
 * Requirements: 2.1, 3.2, 3.3
 * Property 9: Skill Input Validation
 * Property 10: Skill Creation Persistence
 * Property 4: First Skill Triggers Character Analysis
 */
router.post(
  '/',
  authenticateToken,
  validateRequest(validationSchemas.skillCreation),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { skillName, goal, timeline } = req.body;
      const userId = req.user!.userId;

      // Check if user has a personality profile
      const { data: profile, error: profileError } = await supabase
        .from('personality_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const hasProfile = !profileError && profile !== null;

      // Insert skill record into database
      const { data: newSkill, error: insertError } = await supabase
        .from('skills')
        .insert({
          user_id: userId,
          skill_name: skillName.trim(),
          goal: goal.trim(),
          timeline: timeline,
          created_at: new Date().toISOString()
        })
        .select('id, user_id, skill_name, goal, timeline, created_at')
        .single();

      if (insertError || !newSkill) {
        console.error('Skill creation error:', insertError);
        res.status(500).json({ 
          error: 'Failed to create skill',
          message: insertError?.message || 'Unknown error'
        });
        return;
      }

      // Return the created skill with flag indicating if character analysis is needed
      res.status(201).json({
        skill: newSkill as Skill,
        needsCharacterAnalysis: !hasProfile
      });
    } catch (error) {
      console.error('Error creating skill:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/skills/:userId
 * 
 * Retrieves all skills for a user with progress metadata.
 * 
 * Requirements: 6.1
 * Property 23: Library Display Completeness
 */
router.get('/:userId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Query skills for the user
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (skillsError) {
      throw skillsError;
    }

    if (!skills || skills.length === 0) {
      res.json({ skills: [] });
      return;
    }

    // For each skill, get session data to calculate progress
    const skillsWithMetadata = await Promise.all(
      skills.map(async (skill) => {
        // Get the most recent session for this skill
        const { data: session } = await supabase
          .from('sessions')
          .select('mastery_score, last_activity')
          .eq('skill_id', skill.id)
          .order('last_activity', { ascending: false })
          .limit(1)
          .single();

        // Get the roadmap to calculate progress
        const { data: roadmap } = await supabase
          .from('roadmaps')
          .select('structure_json')
          .eq('skill_id', skill.id)
          .single();

        let progressPercentage = 0;
        let masteryLevel = 0;

        if (roadmap && roadmap.structure_json) {
          const nodes = roadmap.structure_json as any[];
          const completedNodes = nodes.filter(n => n.status === 'completed').length;
          progressPercentage = nodes.length > 0 ? (completedNodes / nodes.length) * 100 : 0;
        }

        if (session) {
          masteryLevel = session.mastery_score || 0;
        }

        return {
          ...skill,
          progressPercentage: Math.round(progressPercentage),
          masteryLevel: Math.round(masteryLevel),
          lastSessionDate: session?.last_activity || skill.created_at
        };
      })
    );

    res.json({ skills: skillsWithMetadata });
  } catch (error) {
    console.error('Error retrieving skills:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve skills',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/skills/:skillId
 * 
 * Retrieves a specific skill with its roadmap.
 * 
 * Requirements: 6.3
 */
router.get('/skill/:skillId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;

    if (!skillId) {
      res.status(400).json({ error: 'Skill ID is required' });
      return;
    }

    // Query skill
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .single();

    if (skillError || !skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    // Query roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('skill_id', skillId)
      .single();

    if (roadmapError) {
      // Roadmap might not exist yet
      res.json({ skill, roadmap: null });
      return;
    }

    res.json({ skill, roadmap });
  } catch (error) {
    console.error('Error retrieving skill:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve skill',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
