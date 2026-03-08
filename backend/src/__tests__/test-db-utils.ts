/**
 * Database Utilities for Testing
 * 
 * Provides helper functions for setting up and tearing down test data
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create a Supabase client for testing
 */
export function getTestDbClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

/**
 * Create a test user in the database
 */
export async function createTestUser(name: string, email: string): Promise<string> {
  const client = getTestDbClient();
  
  const { data, error } = await client
    .from('users')
    .insert({ name, email })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return data.id;
}

/**
 * Create a test skill for a user
 */
export async function createTestSkill(
  userId: string,
  skillName: string,
  goal: string,
  timeline: number
): Promise<string> {
  const client = getTestDbClient();
  
  const { data, error } = await client
    .from('skills')
    .insert({ user_id: userId, skill_name: skillName, goal, timeline })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test skill: ${error.message}`);
  }

  return data.id;
}

/**
 * Create a test roadmap for a skill
 */
export async function createTestRoadmap(
  skillId: string,
  structureJson: any,
  masteryThreshold: number
): Promise<string> {
  const client = getTestDbClient();
  
  const { data, error } = await client
    .from('roadmaps')
    .insert({ skill_id: skillId, structure_json: structureJson, mastery_threshold: masteryThreshold })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test roadmap: ${error.message}`);
  }

  return data.id;
}

/**
 * Create a test session for a skill
 */
export async function createTestSession(
  skillId: string,
  recapSummary: string,
  masteryScore: number,
  confidenceLevel: string
): Promise<string> {
  const client = getTestDbClient();
  
  const { data, error } = await client
    .from('sessions')
    .insert({
      skill_id: skillId,
      recap_summary: recapSummary,
      mastery_score: masteryScore,
      confidence_level: confidenceLevel
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test session: ${error.message}`);
  }

  return data.id;
}

/**
 * Create a test performance log for a session
 */
export async function createTestPerformanceLog(
  sessionId: string,
  accuracy: number,
  speed: number,
  attempts: number
): Promise<string> {
  const client = getTestDbClient();
  
  const { data, error } = await client
    .from('performance_logs')
    .insert({
      session_id: sessionId,
      accuracy,
      speed,
      attempts
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test performance log: ${error.message}`);
  }

  return data.id;
}

/**
 * Delete a user by ID
 */
export async function deleteUser(userId: string): Promise<void> {
  const client = getTestDbClient();
  
  const { error } = await client
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Check if a user exists
 */
export async function userExists(userId: string): Promise<boolean> {
  const client = getTestDbClient();
  
  const { data, error } = await client
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check user existence: ${error.message}`);
  }

  return data !== null;
}

/**
 * Check if a skill exists
 */
export async function skillExists(skillId: string): Promise<boolean> {
  const client = getTestDbClient();
  
  const { data, error } = await client
    .from('skills')
    .select('id')
    .eq('id', skillId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check skill existence: ${error.message}`);
  }

  return data !== null;
}

/**
 * Check if a roadmap exists
 */
export async function roadmapExists(roadmapId: string): Promise<boolean> {
  const client = getTestDbClient();
  
  const { data, error } = await client
    .from('roadmaps')
    .select('id')
    .eq('id', roadmapId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check roadmap existence: ${error.message}`);
  }

  return data !== null;
}

/**
 * Check if a session exists
 */
export async function sessionExists(sessionId: string): Promise<boolean> {
  const client = getTestDbClient();
  
  const { data, error } = await client
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check session existence: ${error.message}`);
  }

  return data !== null;
}

/**
 * Check if a performance log exists
 */
export async function performanceLogExists(logId: string): Promise<boolean> {
  const client = getTestDbClient();
  
  const { data, error } = await client
    .from('performance_logs')
    .select('id')
    .eq('id', logId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check performance log existence: ${error.message}`);
  }

  return data !== null;
}

/**
 * Clean up test data by deleting a user (which should cascade)
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  try {
    await deleteUser(userId);
  } catch (error) {
    // Ignore errors during cleanup
    console.warn(`Cleanup warning: ${error}`);
  }
}
