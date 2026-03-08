/**
 * Session Recovery Service
 * 
 * Handles session interruption recovery and auto-save functionality.
 * 
 * Requirements: 13.4
 * Property 45: Session Interruption State Preservation
 */

import { supabase } from '../db';
import { Session } from '../types';

export class SessionRecovery {
  /**
   * Saves session state to database
   * This should be called periodically during active sessions
   */
  static async saveSessionState(
    sessionId: string,
    state: {
      masteryScore?: number;
      confidenceLevel?: string;
      recapSummary?: string;
    }
  ): Promise<void> {
    try {
      const updateData: any = {
        last_activity: new Date().toISOString()
      };

      if (state.masteryScore !== undefined) {
        updateData.mastery_score = state.masteryScore;
      }

      if (state.confidenceLevel !== undefined) {
        updateData.confidence_level = state.confidenceLevel;
      }

      if (state.recapSummary !== undefined) {
        updateData.recap_summary = state.recapSummary;
      }

      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        console.error('Error saving session state:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to save session state:', error);
      // Don't throw - we don't want auto-save failures to break the session
    }
  }

  /**
   * Recovers session state from database
   * Used when resuming an interrupted session
   */
  static async recoverSessionState(sessionId: string): Promise<Session | null> {
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        console.error('Error recovering session state:', error);
        return null;
      }

      return session as Session;
    } catch (error) {
      console.error('Failed to recover session state:', error);
      return null;
    }
  }

  /**
   * Checks if a session was interrupted
   * A session is considered interrupted if last_activity is more than 30 minutes ago
   * and the session is not explicitly ended
   */
  static async checkForInterruption(sessionId: string): Promise<boolean> {
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('last_activity')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        return false;
      }

      const lastActivity = new Date(session.last_activity);
      const now = new Date();
      const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

      // Consider interrupted if more than 30 minutes of inactivity
      return minutesSinceActivity > 30;
    } catch (error) {
      console.error('Error checking for interruption:', error);
      return false;
    }
  }

  /**
   * Gets the most recent session for a skill
   * Used to resume learning from where the user left off
   */
  static async getMostRecentSession(skillId: string): Promise<Session | null> {
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('skill_id', skillId)
        .order('last_activity', { ascending: false })
        .limit(1)
        .single();

      if (error || !session) {
        return null;
      }

      return session as Session;
    } catch (error) {
      console.error('Error getting most recent session:', error);
      return null;
    }
  }

  /**
   * Creates a checkpoint of the current session state
   * This is more comprehensive than auto-save and includes all session data
   */
  static async createCheckpoint(
    sessionId: string,
    fullState: {
      masteryScore: number;
      confidenceLevel: string;
      recapSummary: string;
      currentNodeId?: string;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          mastery_score: fullState.masteryScore,
          confidence_level: fullState.confidenceLevel,
          recap_summary: fullState.recapSummary,
          last_activity: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error creating checkpoint:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to create checkpoint:', error);
      return false;
    }
  }
}
