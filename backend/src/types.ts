/**
 * Core data models and types for the Adaptive AI Skill Mentor
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the backend application, ensuring type safety and consistency.
 */

// ============================================================================
// User Model
// ============================================================================

/**
 * User represents a registered user in the system
 */
export interface User {
  id: string;              // UUID primary key
  name: string;            // User's display name
  email: string;           // Unique email address
  created_at: Date;        // Account creation timestamp
}

// ============================================================================
// Personality Profile Model
// ============================================================================

/**
 * PersonalityProfile stores the results of character analysis
 * Used to personalize learning experiences and mentor interactions
 */
export interface PersonalityProfile {
  user_id: string;         // Foreign key to users.id
  tone_type: string;       // Preferred communication style
  confidence_level: string; // Initial confidence assessment
  motivation_index: number; // Motivation score (0-100)
}

// ============================================================================
// Skill Model
// ============================================================================

/**
 * Skill represents a learning objective created by a user
 */
export interface Skill {
  id: string;              // UUID primary key
  user_id: string;         // Foreign key to users.id
  skill_name: string;      // Name of the skill
  goal: string;            // User's learning objective
  timeline: number;        // Expected completion time (days)
  created_at: Date;        // Skill creation timestamp
}

// ============================================================================
// Roadmap Model
// ============================================================================

/**
 * RoadmapNode represents a discrete learning milestone within a roadmap
 */
export interface RoadmapNode {
  node_id: string;         // Unique node identifier
  title: string;           // Node title
  description: string;     // Learning content description
  mastery_threshold: number; // Required score to unlock next node
  status: 'locked' | 'current' | 'completed';
  order: number;           // Sequential position in roadmap
}

/**
 * Roadmap represents the complete learning path for a skill
 * The structure is generated once and never regenerated
 */
export interface Roadmap {
  id: string;              // UUID primary key
  skill_id: string;        // Foreign key to skills.id
  structure_json: RoadmapNode[]; // Complete roadmap structure
  mastery_threshold: number; // Default threshold for nodes
}

// ============================================================================
// Session Model
// ============================================================================

/**
 * Session represents an active or past learning session for a skill
 */
export interface Session {
  id: string;              // UUID primary key
  skill_id: string;        // Foreign key to skills.id
  recap_summary: string;   // Summary for next session recap
  mastery_score: number;   // Current mastery score (0-100)
  confidence_level: string; // Current confidence level
  last_activity: Date;     // Last interaction timestamp
  mentor_mode_preference?: string; // User-selected mentor mode preference
}

// ============================================================================
// Performance Log Model
// ============================================================================

/**
 * PerformanceLog records performance metrics for each learning interaction
 */
export interface PerformanceLog {
  session_id: string;      // Foreign key to sessions.id
  accuracy: number;        // Correctness score (0-100)
  speed: number;           // Response speed score (0-100)
  attempts: number;        // Number of attempts for task
  timestamp: Date;         // When performance was recorded
}

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * MentorMode defines the interaction style used by the AI mentor
 */
export type MentorMode = 'Professional' | 'Friendly' | 'Supportive' | 'Challenger';

/**
 * Message represents a single message in a learning session conversation
 */
export interface Message {
  id: string;
  sender: 'user' | 'mentor';
  content: string;
  timestamp: Date;
}

/**
 * Task represents a learning task or challenge
 */
export interface Task {
  id: string;
  description: string;
  isStretch: boolean;      // Whether this is an optional stretch task
}

/**
 * SessionContext provides complete context for AI mentor interactions
 */
export interface SessionContext {
  skill: Skill;
  currentNode: RoadmapNode;
  masteryScore: number;
  confidenceLevel: string;
  performanceHistory: PerformanceLog[];
  personalityProfile: PersonalityProfile;
}
