/**
 * AI Service Orchestrator
 * 
 * Manages all interactions with AI services for the Adaptive AI Skill Mentor.
 * Uses AWS Bedrock with Llama 4 Scout model.
 * 
 * Features:
 * - Adaptive memory (conversation history)
 * - Behavior & slang analysis
 * - Dynamic prompt adaptation
 */

import { PersonalityProfile, RoadmapNode, Skill, Session, PerformanceLog, Task, SessionContext, MentorMode } from '../types';
import { BedrockAIService } from './BedrockAIService';

interface AnalysisResponse {
  question: string;
  response: string;
}

export class AIServiceOrchestrator {
  private bedrockService: BedrockAIService;

  constructor() {
    this.bedrockService = new BedrockAIService();
  }



  /**
   * Generates a personalized learning roadmap for a skill
   * 
   * @param skillName - The name of the skill to learn
   * @param goal - The user's learning objective
   * @param timeline - Expected completion time in days
   * @param profile - User's personality profile for personalization
   * @returns Array of roadmap nodes with sequential structure
   */
  async generateRoadmap(
    skillName: string,
    goal: string,
    timeline: number,
    profile: PersonalityProfile
  ): Promise<RoadmapNode[]> {
    return this.bedrockService.generateRoadmap(skillName, goal, timeline, profile);
  }

  /**
   * Conducts character analysis to determine personality profile
   * 
   * @param responses - User's responses to analysis questions
   * @returns PersonalityProfile with tone_type, confidence_level, and motivation_index
   */
  async conductCharacterAnalysis(
    responses: AnalysisResponse[]
  ): Promise<PersonalityProfile> {
    return this.bedrockService.conductCharacterAnalysis(responses);
  }

  /**
   * Generates a recap of the previous learning session
   * 
   * @param skill - The skill being learned
   * @param session - The previous session data
   * @param performanceHistory - Historical performance logs
   * @returns A personalized recap string
   */
  async generateRecap(
    skill: Skill,
    session: Session,
    performanceHistory: PerformanceLog[]
  ): Promise<string> {
    return this.bedrockService.generateRecap(skill, session, performanceHistory);
  }

  /**
   * Generates a mentor response based on user input and session context
   * 
   * @param userInput - The user's message or response
   * @param context - Complete session context
   * @param mentorMode - The selected mentor interaction style
   * @param difficulty - The adaptive difficulty level
   * @param sessionId - The session ID for conversation memory
   * @returns A personalized mentor response
   */
  async generateMentorResponse(
    userInput: string,
    context: SessionContext,
    mentorMode: MentorMode,
    difficulty: 'simplified' | 'standard' | 'advanced',
    sessionId: string
  ): Promise<string> {
    return this.bedrockService.generateMentorResponse(userInput, context, mentorMode, difficulty, sessionId);
  }

  /**
   * Generates an optional stretch task for high-performing learners
   * 
   * @param currentNode - The current learning node
   * @param masteryScore - The user's current mastery score
   * @returns A stretch task object
   */
  async generateStretchTask(
    currentNode: RoadmapNode,
    masteryScore: number
  ): Promise<Task> {
    return this.bedrockService.generateStretchTask(currentNode, masteryScore);
  }
}
