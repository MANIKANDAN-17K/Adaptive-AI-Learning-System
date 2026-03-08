/**
 * Roadmap API Routes
 * 
 * Handles endpoints for generating and retrieving roadmaps.
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../db';
import { Roadmap, RoadmapNode } from '../types';
import { AIServiceOrchestrator } from '../services/AIServiceOrchestrator';

const router = Router();
const aiService = new AIServiceOrchestrator();

/**
 * POST /api/roadmaps/generate
 * 
 * Generates a new roadmap for a skill using AI.
 * Stores the roadmap with structure_json in database.
 * Initializes first node as 'current', rest as 'locked'.
 * 
 * Body: {
 *   skillId: string,
 *   skillName: string,
 *   goal: string,
 *   timeline: number,
 *   profile: PersonalityProfile
 * }
 * 
 * Requirements: 3.4, 3.5, 11.1, 11.2
 * Property 11: Roadmap Sequential Structure
 * Property 12: Roadmap Persistence Round Trip
 */
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { skillId, skillName, goal, timeline, profile } = req.body;

    // Validate required fields
    if (!skillId) {
      res.status(400).json({ error: 'Skill ID is required' });
      return;
    }

    if (!skillName) {
      res.status(400).json({ error: 'Skill name is required' });
      return;
    }

    if (!goal) {
      res.status(400).json({ error: 'Goal is required' });
      return;
    }

    if (timeline === undefined || timeline === null) {
      res.status(400).json({ error: 'Timeline is required' });
      return;
    }

    if (!profile) {
      res.status(400).json({ error: 'Personality profile is required' });
      return;
    }

    // Verify the skill exists
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id')
      .eq('id', skillId)
      .single();

    if (skillError || !skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    // Check if roadmap already exists for this skill
    const { data: existingRoadmap } = await supabase
      .from('roadmaps')
      .select('id')
      .eq('skill_id', skillId)
      .single();

    if (existingRoadmap) {
      res.status(409).json({ 
        error: 'Roadmap already exists for this skill',
        roadmapId: existingRoadmap.id
      });
      return;
    }

    // Generate roadmap using AI service
    const roadmapNodes = await aiService.generateRoadmap(
      skillName,
      goal,
      timeline,
      profile
    );

    // Ensure first node is 'current' and rest are 'locked'
    const initializedNodes = roadmapNodes.map((node, index) => ({
      ...node,
      status: index === 0 ? 'current' as const : 'locked' as const
    }));

    // Calculate default mastery threshold (average of all node thresholds)
    const avgThreshold = initializedNodes.reduce((sum, node) => sum + node.mastery_threshold, 0) / initializedNodes.length;

    // Store roadmap in database
    const { data: newRoadmap, error: insertError } = await supabase
      .from('roadmaps')
      .insert({
        skill_id: skillId,
        structure_json: initializedNodes,
        mastery_threshold: Math.round(avgThreshold)
      })
      .select('id, skill_id, structure_json, mastery_threshold')
      .single();

    if (insertError || !newRoadmap) {
      console.error('Roadmap creation error:', insertError);
      res.status(500).json({ 
        error: 'Failed to create roadmap',
        message: insertError?.message || 'Unknown error'
      });
      return;
    }

    res.status(201).json({
      roadmapId: newRoadmap.id,
      structure: newRoadmap.structure_json as RoadmapNode[]
    });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/roadmaps/:skillId
 * 
 * Retrieves the roadmap for a specific skill.
 * Returns roadmap with all node states.
 * 
 * Requirements: 20.2
 * Property 25: Roadmap Immutability
 * Property 55: Node State Persistence
 */
router.get('/:skillId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { skillId } = req.params;

    if (!skillId) {
      res.status(400).json({ error: 'Skill ID is required' });
      return;
    }

    // Query roadmap by skill_id
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('skill_id', skillId)
      .single();

    if (roadmapError || !roadmap) {
      res.status(404).json({ error: 'Roadmap not found' });
      return;
    }

    res.json({ roadmap: roadmap as Roadmap });
  } catch (error) {
    console.error('Error retrieving roadmap:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve roadmap',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
