/**
 * Character Analysis API Routes
 * 
 * Handles endpoints for conducting character analysis and retrieving personality profiles.
 * These endpoints support the personalization system by analyzing user learning preferences.
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../db';
import { AIServiceOrchestrator } from '../services/AIServiceOrchestrator';
import { PersonalityProfile } from '../types';

const router = Router();
const aiService = new AIServiceOrchestrator();

/**
 * GET /api/character-analysis/:userId
 * 
 * Retrieves the personality profile for a user if it exists.
 * Returns null if no profile has been created yet.
 * 
 * Requirements: 2.3 - Provide option to skip character analysis if profile exists
 */
router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Query personality_profiles table
    const { data, error } = await supabase
      .from('personality_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no profile found, return null (not an error)
      if (error.code === 'PGRST116') {
        res.json({ profile: null });
        return;
      }
      throw error;
    }

    // Return the profile
    res.json({ profile: data as PersonalityProfile });
  } catch (error) {
    console.error('Error retrieving personality profile:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve personality profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/character-analysis
 * 
 * Conducts character analysis based on user responses and stores the resulting profile.
 * 
 * Body: {
 *   userId: string,
 *   responses: Array<{ question: string, response: string }>
 * }
 * 
 * Requirements: 2.2, 2.5 - Store personality profile and analyze user responses
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, responses } = req.body;

    // Validate input
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      res.status(400).json({ error: 'Responses array is required and must not be empty' });
      return;
    }

    // Validate each response has question and response fields
    for (const r of responses) {
      if (!r.question || !r.response) {
        res.status(400).json({ 
          error: 'Each response must have question and response fields' 
        });
        return;
      }
    }

    // Call AI service to conduct character analysis
    const profile = await aiService.conductCharacterAnalysis(responses);
    
    // Add user_id to the profile
    profile.user_id = userId;

    // Store the profile in the database
    const { data, error } = await supabase
      .from('personality_profiles')
      .upsert(profile, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Return the stored profile
    res.status(201).json({ profile: data as PersonalityProfile });
  } catch (error) {
    console.error('Error conducting character analysis:', error);
    res.status(500).json({ 
      error: 'Failed to conduct character analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
