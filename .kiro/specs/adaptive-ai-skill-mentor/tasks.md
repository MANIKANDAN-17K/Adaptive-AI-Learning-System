# Implementation Plan: Adaptive AI Skill Mentor

## Overview

This implementation plan breaks down the Adaptive AI Skill Mentor into incremental coding tasks. The approach follows a bottom-up strategy: establish database schema and backend services first, then build API endpoints, and finally implement the frontend components. Each task builds on previous work, with property-based tests integrated throughout to validate correctness early.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create monorepo structure with `backend/` and `frontend/` directories
  - Initialize backend: `npm init` with TypeScript, Express, Supabase client, dotenv, fast-check, jest
  - Initialize frontend: `npm create vite@latest` with React TypeScript template
  - Add frontend dependencies: TailwindCSS, Framer Motion, fast-check, vitest
  - Configure TypeScript for both projects with strict mode
  - Set up environment variables template (.env.example) for OpenAI API key and Supabase credentials
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 17.1, 17.2_

- [x] 2. Implement database schema and migrations
  - [x] 2.1 Create database migration for users table
    - Define schema: id (UUID, PK), name (VARCHAR), email (VARCHAR UNIQUE), created_at (TIMESTAMP)
    - _Requirements: 18.1_
  
  - [x] 2.2 Create database migration for personality_profiles table
    - Define schema: user_id (UUID, FK), tone_type (VARCHAR), confidence_level (VARCHAR), motivation_index (INTEGER)
    - Add foreign key constraint to users.id with ON DELETE CASCADE
    - _Requirements: 18.2, 18.7_
  
  - [x] 2.3 Create database migration for skills table
    - Define schema: id (UUID, PK), user_id (UUID, FK), skill_name (VARCHAR), goal (TEXT), timeline (INTEGER), created_at (TIMESTAMP)
    - Add foreign key constraint to users.id with ON DELETE CASCADE
    - _Requirements: 18.3, 18.7_
  
  - [x] 2.4 Create database migration for roadmaps table
    - Define schema: id (UUID, PK), skill_id (UUID, FK), structure_json (JSONB), mastery_threshold (FLOAT)
    - Add foreign key constraint to skills.id with ON DELETE CASCADE
    - _Requirements: 18.4, 18.7_
  
  - [x] 2.5 Create database migration for sessions table
    - Define schema: id (UUID, PK), skill_id (UUID, FK), recap_summary (TEXT), mastery_score (FLOAT), confidence_level (VARCHAR), last_activity (TIMESTAMP)
    - Add foreign key constraint to skills.id with ON DELETE CASCADE
    - _Requirements: 18.5, 18.7_
  
  - [x] 2.6 Create database migration for performance_logs table
    - Define schema: session_id (UUID, FK), accuracy (FLOAT), speed (FLOAT), attempts (INTEGER), timestamp (TIMESTAMP)
    - Add foreign key constraint to sessions.id with ON DELETE CASCADE
    - _Requirements: 18.6, 18.7_
  
  - [~]* 2.7 Write property test for referential integrity
    - **Property 33: Referential Integrity Enforcement**
    - **Validates: Requirements 9.6, 18.7**

- [x] 3. Implement core data models and types
  - Create TypeScript interfaces for User, PersonalityProfile, Skill, Roadmap, RoadmapNode, Session, PerformanceLog
  - Create MentorMode type union
  - Create Message, Task, and SessionContext interfaces
  - Export all types from a central types file
  - _Requirements: All data model requirements_

- [x] 4. Implement Adaptive Learning Engine
  - [x] 4.1 Create AdaptiveLearningEngine class with calculateMasteryScore method
    - Implement formula: (accuracy × 0.7) + (speed × 0.3)
    - _Requirements: 4.1, 12.3_
  
  - [~]* 4.2 Write property test for mastery score calculation
    - **Property 14: Mastery Score Calculation**
    - **Validates: Requirements 4.1, 12.3**
  
  - [x] 4.3 Implement deriveConfidenceLevel method
    - Analyze language tone, performance trends, and retry frequency
    - Return 'low', 'medium', or 'high'
    - _Requirements: 4.2, 12.4_
  
  - [~]* 4.4 Write property test for confidence level derivation
    - **Property 15: Confidence Level Derivation**
    - **Validates: Requirements 4.2, 12.4**
  
  - [x] 4.5 Implement shouldGenerateStretchTask method
    - Return true when masteryScore > 80 AND confidenceLevel === 'high'
    - _Requirements: 4.4_
  
  - [x] 4.6 Implement adjustDifficulty method
    - Return 'simplified' if masteryScore < 50
    - Return 'advanced' if masteryScore > 80
    - Return 'standard' otherwise
    - _Requirements: 4.3_
  
  - [x] 4.7 Implement selectMentorTone method
    - Apply adaptive adjustments based on confidence while preserving user preference
    - _Requirements: 4.6, 4.7, 5.5_
  
  - [~]* 4.8 Write property test for adaptive tone adjustment
    - **Property 17: Adaptive Tone Adjustment**
    - **Validates: Requirements 4.6, 4.7**
  
  - [~]* 4.9 Write property test for adaptive mode preservation
    - **Property 22: Adaptive Mode Preservation**
    - **Validates: Requirements 5.5**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement AI Service Orchestrator
  - [x] 6.1 Create AIServiceOrchestrator class with OpenAI client initialization
    - Load API key from environment variables
    - Configure base URL and default parameters
    - _Requirements: 10.1, 19.1_
  
  - [x] 6.2 Implement generateRoadmap method
    - Construct prompt with skill name, goal, timeline, and personality profile
    - Call GPT-4.1 API with structured output format
    - Parse response into RoadmapNode array
    - _Requirements: 3.4, 3.6_
  
  - [~]* 6.3 Write property test for roadmap sequential structure
    - **Property 11: Roadmap Sequential Structure**
    - **Validates: Requirements 3.4, 11.1**
  
  - [~]* 6.4 Write property test for profile-based personalization
    - **Property 13: Profile-Based Personalization**
    - **Validates: Requirements 3.6**
  
  - [x] 6.5 Implement conductCharacterAnalysis method
    - Construct prompt with user responses
    - Call GPT-4.1 API to analyze personality
    - Parse response into PersonalityProfile
    - _Requirements: 2.5_
  
  - [~]* 6.6 Write property test for character analysis output
    - **Property 8: Character Analysis Produces Valid Mentor Mode**
    - **Validates: Requirements 2.5**
  
  - [x] 6.7 Implement generateRecap method
    - Construct prompt with skill, session, and performance history
    - Call GPT-4.1 API to generate recap
    - _Requirements: 6.2, 15.1, 15.2_
  
  - [~]* 6.8 Write property test for recap content completeness
    - **Property 49: Recap Content Completeness**
    - **Validates: Requirements 15.2**
  
  - [x] 6.9 Implement generateMentorResponse method
    - Construct prompt with user input, session context, mentor mode, and difficulty
    - Call GPT-4.1 API to generate response
    - _Requirements: 8.5_
  
  - [x] 6.10 Implement generateStretchTask method
    - Construct prompt with current node and mastery score
    - Call GPT-4.1 API to generate advanced challenge
    - _Requirements: 14.1, 14.2_

- [x] 7. Implement authentication API endpoints
  - [x] 7.1 Create POST /api/auth/register endpoint
    - Validate input (name, email, password)
    - Hash password using bcrypt
    - Insert user record into database
    - Generate JWT token
    - _Requirements: 1.1_
  
  - [~]* 7.2 Write property test for user registration
    - **Property 1: User Registration Creates Complete Records**
    - **Validates: Requirements 1.1**
  
  - [x] 7.3 Create POST /api/auth/login endpoint
    - Validate credentials
    - Compare hashed password
    - Generate JWT token
    - _Requirements: 1.2_
  
  - [~]* 7.4 Write property test for authentication round trip
    - **Property 2: Authentication Round Trip**
    - **Validates: Requirements 1.2, 1.3**
  
  - [~]* 7.5 Write property test for invalid credentials
    - **Property 3: Invalid Credentials Produce Safe Errors**
    - **Validates: Requirements 1.4**
  
  - [x] 7.6 Create GET /api/auth/profile endpoint
    - Verify JWT token
    - Retrieve user from database
    - Return user profile
    - _Requirements: 1.3_

- [x] 8. Implement character analysis API endpoints
  - [x] 8.1 Create GET /api/character-analysis/:userId endpoint
    - Query personality_profiles table by user_id
    - Return profile or null
    - _Requirements: 2.3_
  
  - [x] 8.2 Create POST /api/character-analysis endpoint
    - Validate user_id and responses
    - Call AIServiceOrchestrator.conductCharacterAnalysis
    - Store resulting profile in database
    - _Requirements: 2.2, 2.5_
  
  - [~]* 8.3 Write property test for character analysis storage
    - **Property 5: Character Analysis Stores Complete Profile**
    - **Validates: Requirements 2.2**
  
  - [~]* 8.4 Write property test for profile reuse
    - **Property 7: Profile Reuse Consistency**
    - **Validates: Requirements 2.4**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement skills API endpoints
  - [x] 10.1 Create POST /api/skills endpoint
    - Validate input (skillName, goal, timeline)
    - Check if user has personality profile
    - If no profile exists, return flag indicating character analysis needed
    - Insert skill record into database
    - _Requirements: 2.1, 3.2, 3.3_
  
  - [~]* 10.2 Write property test for skill input validation
    - **Property 9: Skill Input Validation**
    - **Validates: Requirements 3.2**
  
  - [~]* 10.3 Write property test for skill creation persistence
    - **Property 10: Skill Creation Persistence**
    - **Validates: Requirements 3.3**
  
  - [~]* 10.4 Write property test for first skill triggers analysis
    - **Property 4: First Skill Triggers Character Analysis**
    - **Validates: Requirements 2.1**
  
  - [x] 10.5 Create GET /api/skills/:userId endpoint
    - Query skills table by user_id
    - For each skill, calculate progress percentage from sessions
    - Return array of skills with metadata
    - _Requirements: 6.1_
  
  - [x] 10.6 Create GET /api/skills/:skillId endpoint
    - Query skill and roadmap by skill_id
    - Return combined data
    - _Requirements: 6.3_

- [x] 11. Implement roadmap API endpoints
  - [x] 11.1 Create POST /api/roadmaps/generate endpoint
    - Validate input (skillId, skillName, goal, timeline, profile)
    - Call AIServiceOrchestrator.generateRoadmap
    - Store roadmap with structure_json in database
    - Initialize first node as 'current', rest as 'locked'
    - _Requirements: 3.4, 3.5, 11.1, 11.2_
  
  - [~]* 11.2 Write property test for roadmap persistence round trip
    - **Property 12: Roadmap Persistence Round Trip**
    - **Validates: Requirements 3.5, 9.2, 20.1, 20.2**
  
  - [~]* 11.3 Write property test for roadmap immutability
    - **Property 25: Roadmap Immutability**
    - **Validates: Requirements 6.3, 11.6, 20.3**
  
  - [~]* 11.4 Write property test for roadmap structure immutability during adaptation
    - **Property 54: Roadmap Structure Immutability During Adaptation**
    - **Validates: Requirements 20.4**
  
  - [x] 11.5 Create GET /api/roadmaps/:skillId endpoint
    - Query roadmap by skill_id
    - Return roadmap with all node states
    - _Requirements: 20.2_
  
  - [~]* 11.6 Write property test for node state persistence
    - **Property 55: Node State Persistence**
    - **Validates: Requirements 20.5**

- [x] 12. Implement sessions API endpoints
  - [x] 12.1 Create POST /api/sessions/start endpoint
    - Validate skillId
    - Retrieve skill and roadmap from database
    - Retrieve or create session record
    - If resuming, call AIServiceOrchestrator.generateRecap
    - Return sessionId, recap, and currentNode
    - _Requirements: 6.2, 6.4, 11.2, 15.1_
  
  - [~]* 12.2 Write property test for session state round trip
    - **Property 26: Session State Round Trip**
    - **Validates: Requirements 6.4, 9.3**
  
  - [~]* 12.3 Write property test for recap generation
    - **Property 24: Recap Generation on Selection**
    - **Validates: Requirements 6.2, 15.1**
  
  - [~]* 12.4 Write property test for learning session starts at first node
    - **Property 39: Learning Session Starts at First Node**
    - **Validates: Requirements 11.2**
  
  - [~]* 12.5 Write property test for recap summary round trip
    - **Property 50: Recap Summary Round Trip**
    - **Validates: Requirements 15.4**
  
  - [x] 12.6 Create POST /api/sessions/:sessionId/interact endpoint
    - Validate userInput, accuracy, speed, attempts
    - Calculate mastery score using AdaptiveLearningEngine
    - Derive confidence level using AdaptiveLearningEngine
    - Store performance log in database
    - Check if node threshold is met, unlock next node if applicable
    - Check if stretch task should be generated
    - Call AIServiceOrchestrator.generateMentorResponse with adaptive context
    - Return mentor response, mastery score, confidence level, next node (if unlocked), stretch task (if generated)
    - _Requirements: 4.1, 4.2, 4.5, 4.8, 8.5, 11.3, 12.1, 12.2_
  
  - [~]* 12.7 Write property test for node progression
    - **Property 16: Node Progression on Threshold**
    - **Validates: Requirements 4.5, 11.3, 11.4**
  
  - [~]* 12.8 Write property test for performance log completeness
    - **Property 18: Performance Log Completeness**
    - **Validates: Requirements 4.8, 12.1, 12.2**
  
  - [~]* 12.9 Write property test for performance log accumulation
    - **Property 31: Performance Log Accumulation**
    - **Validates: Requirements 9.4**
  
  - [~]* 12.10 Write property test for user input triggers response
    - **Property 28: User Input Triggers AI Response**
    - **Validates: Requirements 8.5**
  
  - [x] 12.11 Create PUT /api/sessions/:sessionId/end endpoint
    - Validate recapSummary
    - Update session record with recap_summary and last_activity
    - _Requirements: 6.5, 15.4_
  
  - [~]* 12.12 Write property test for session update completeness
    - **Property 27: Session Update Completeness**
    - **Validates: Requirements 6.5**

- [x] 13. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement security and validation middleware
  - [x] 14.1 Create JWT authentication middleware
    - Verify token on protected routes
    - Attach user info to request object
    - _Requirements: 1.2, 10.4, 19.4_
  
  - [~]* 14.2 Write property test for authenticated requests
    - **Property 36: Authenticated AI Requests Only**
    - **Validates: Requirements 10.4, 19.4**
  
  - [x] 14.3 Create input validation middleware
    - Validate request bodies before processing
    - Return 400 errors for invalid input
    - _Requirements: 17.4_
  
  - [~]* 14.4 Write property test for input validation before processing
    - **Property 52: Input Validation Before Processing**
    - **Validates: Requirements 17.4**
  
  - [x] 14.5 Create API key protection middleware
    - Ensure responses never contain environment variables
    - _Requirements: 10.2, 19.2_
  
  - [~]* 14.6 Write property test for API key exclusion
    - **Property 34: API Key Exclusion from Responses**
    - **Validates: Requirements 10.2, 19.2**
  
  - [x] 14.7 Create unauthorized access logging
    - Log all rejected authentication attempts
    - _Requirements: 10.5, 19.5_
  
  - [~]* 14.8 Write property test for unauthorized access handling
    - **Property 37: Unauthorized Access Rejection and Logging**
    - **Validates: Requirements 10.5, 19.5**
  
  - [~]* 14.9 Write property test for AI request proxy pattern
    - **Property 35: AI Request Proxy Pattern**
    - **Validates: Requirements 10.3, 19.3**
  
  - [~]* 14.10 Write property test for AI context inclusion
    - **Property 38: AI Context Inclusion**
    - **Validates: Requirements 10.6**

- [x] 15. Implement error handling across backend
  - [x] 15.1 Add try-catch blocks to all database operations
    - Wrap Supabase queries in error handlers
    - Return appropriate HTTP status codes
    - _Requirements: 13.1_
  
  - [~]* 15.2 Write property test for database failure handling
    - **Property 42: Database Failure Error Handling**
    - **Validates: Requirements 13.1**
  
  - [x] 15.3 Add error handling for AI service calls
    - Catch API errors and timeouts
    - Return user-friendly messages
    - _Requirements: 10.5, 13.2_
  
  - [~]* 15.4 Write property test for AI service unavailability
    - **Property 43: AI Service Unavailability Handling**
    - **Validates: Requirements 13.2**
  
  - [x] 15.5 Implement validation error responses
    - Return specific error messages for invalid input
    - _Requirements: 13.3_
  
  - [~]* 15.6 Write property test for invalid input errors
    - **Property 44: Invalid Input Error Messages**
    - **Validates: Requirements 13.3**
  
  - [x] 15.7 Implement session interruption recovery
    - Auto-save session state periodically
    - Detect and recover from interruptions
    - _Requirements: 13.4_
  
  - [~]* 15.8 Write property test for session interruption preservation
    - **Property 45: Session Interruption State Preservation**
    - **Validates: Requirements 13.4**
  
  - [x] 15.9 Add error logging with user-friendly messages
    - Log full errors to server
    - Return sanitized messages to frontend
    - _Requirements: 13.5_
  
  - [~]* 15.10 Write property test for error logging
    - **Property 46: Error Logging and User Messages**
    - **Validates: Requirements 13.5**
  
  - [x] 15.11 Add response formatting middleware
    - Ensure all responses include appropriate status codes
    - Ensure all responses are valid JSON
    - _Requirements: 17.5_
  
  - [~]* 15.12 Write property test for HTTP response format
    - **Property 53: HTTP Response Format**
    - **Validates: Requirements 17.5**

- [x] 16. Implement frontend API client service
  - Create API client with methods for all backend endpoints
  - Add authentication token management
  - Add request/response interceptors for error handling
  - _Requirements: All API integration requirements_

- [x] 17. Implement Dashboard component
  - [x] 17.1 Create Dashboard component with violet glowing power button
    - Use Framer Motion for glow animation
    - Apply TailwindCSS styling with #6C4DFF accent
    - _Requirements: 7.1, 7.5_
  
  - [x] 17.2 Add navigation buttons for "Create New Skill" and "Library"
    - Implement routing to respective views
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 18. Implement Skill Creation Flow component
  - [x] 18.1 Create skill creation form
    - Add input fields for skill name, goal, timeline
    - Implement form validation
    - _Requirements: 3.1, 3.2_
  
  - [x] 18.2 Add character analysis integration
    - Check if user has existing profile via GET /api/character-analysis/:userId
    - Show skip option if profile exists
    - Trigger character analysis if needed or if user doesn't skip
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [~]* 18.3 Write property test for existing profile skip option
    - **Property 6: Existing Profile Enables Skip Option**
    - **Validates: Requirements 2.3**
  
  - [x] 18.4 Implement roadmap generation trigger
    - Call POST /api/roadmaps/generate after skill creation
    - Display loading state during generation
    - Navigate to learning session on completion
    - _Requirements: 3.4, 3.5_
  
  - [~]* 18.5 Write property test for skill persistence immediacy
    - **Property 30: Skill Persistence Immediacy**
    - **Validates: Requirements 9.1**

- [x] 19. Implement Character Analysis component
  - [x] 19.1 Create interactive analysis interface
    - Display AI-generated questions
    - Capture user responses
    - Show progress indicator
    - _Requirements: 2.5_
  
  - [x] 19.2 Add skip functionality
    - Show skip button when profile exists
    - Load existing profile on skip
    - _Requirements: 2.3, 2.4_
  
  - [x] 19.3 Submit analysis results
    - Call POST /api/character-analysis
    - Store returned profile
    - _Requirements: 2.2_
  
  - [~]* 19.4 Write property test for personality profile persistence
    - **Property 32: Personality Profile Persistence**
    - **Validates: Requirements 9.5**

- [x] 20. Checkpoint - Ensure frontend builds and renders
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Implement Library View component
  - [x] 21.1 Create skill card grid layout
    - Fetch skills from GET /api/skills/:userId
    - Display cards with skill name, progress %, mastery level, last session date
    - Apply TailwindCSS styling
    - _Requirements: 6.1_
  
  - [~]* 21.2 Write property test for library display completeness
    - **Property 23: Library Display Completeness**
    - **Validates: Requirements 6.1**
  
  - [x] 21.3 Implement skill selection handler
    - Call POST /api/sessions/start on skill selection
    - Display generated recap
    - Navigate to learning session
    - _Requirements: 6.2, 6.3_

- [x] 22. Implement Learning Session Interface component
  - [x] 22.1 Create session layout with skill name and mastery score display
    - Show skill name at top
    - Display current mastery score with real-time updates
    - _Requirements: 8.1, 8.6_
  
  - [~]* 22.2 Write property test for real-time mastery updates
    - **Property 29: Real-Time Mastery Score Updates**
    - **Validates: Requirements 8.6**
  
  - [x] 22.3 Create AI mentor response panel
    - Display mentor messages with timestamps
    - Apply styling based on mentor mode
    - _Requirements: 8.2_
  
  - [x] 22.4 Create user input area
    - Add text input for user responses
    - Implement submit handler
    - _Requirements: 8.3_
  
  - [x] 22.5 Add mentor mode badge display
    - Show current mentor mode as visible badge
    - Update badge when mode changes
    - _Requirements: 8.4, 5.4_
  
  - [~]* 22.6 Write property test for mentor mode badge display
    - **Property 21: Mentor Mode Badge Display**
    - **Validates: Requirements 5.4, 8.4**
  
  - [x] 22.7 Implement interaction handler
    - Call POST /api/sessions/:sessionId/interact on user input
    - Display mentor response
    - Update mastery score
    - Handle node progression
    - Display stretch tasks if generated
    - _Requirements: 8.5, 8.6_
  
  - [x] 22.8 Add stretch task display
    - Mark stretch tasks as optional
    - Allow skip or complete actions
    - _Requirements: 14.3, 14.4, 14.5_
  
  - [~]* 22.9 Write property test for stretch task marking
    - **Property 47: Stretch Task Optional Marking**
    - **Validates: Requirements 14.3**
  
  - [~]* 22.10 Write property test for stretch task non-blocking
    - **Property 48: Stretch Task Non-Blocking Progression**
    - **Validates: Requirements 14.4, 14.5**
  
  - [x] 22.11 Add roadmap visualization
    - Display all nodes with status indicators (locked, current, completed)
    - _Requirements: 11.5_
  
  - [~]* 22.12 Write property test for roadmap visual indicators
    - **Property 40: Roadmap Visual Status Indicators**
    - **Validates: Requirements 11.5**

- [x] 23. Implement mentor mode selection
  - [x] 23.1 Add mentor mode selector UI
    - Create dropdown or button group for mode selection
    - Display four options: Professional, Friendly, Supportive, Challenger
    - _Requirements: 5.1_
  
  - [x] 23.2 Implement mode change handler
    - Update session state with selected mode
    - Persist preference to backend
    - _Requirements: 5.2, 5.3_
  
  - [~]* 23.3 Write property test for mentor mode persistence
    - **Property 19: Mentor Mode Selection Persistence**
    - **Validates: Requirements 5.2**
  
  - [~]* 23.4 Write property test for prompt configuration update
    - **Property 20: Mentor Mode Prompt Configuration**
    - **Validates: Requirements 5.3**

- [x] 24. Implement additional property tests for adaptive features
  - [~]* 24.1 Write property test for performance trend analysis
    - **Property 41: Performance Trend Analysis Uses History**
    - **Validates: Requirements 12.5**
  
  - [~]* 24.2 Write property test for recap personalization
    - **Property 51: Recap Personalization**
    - **Validates: Requirements 15.5**

- [x] 25. Add animations and polish to frontend
  - Apply Framer Motion animations to component transitions
  - Add smooth micro-animations for interactions
  - Ensure animations are subtle and non-distracting
  - _Requirements: 7.6_

- [x] 26. Final integration and wiring
  - [x] 26.1 Connect all frontend components with routing
    - Set up React Router with routes for Dashboard, Skill Creation, Library, Learning Session
    - Ensure navigation flows work end-to-end
    - _Requirements: 7.2, 7.3, 7.4_
  
  - [x] 26.2 Wire authentication throughout the application
    - Implement protected routes
    - Add token refresh logic
    - Handle authentication errors globally
    - _Requirements: 1.2, 1.3_
  
  - [~]* 26.3 Write integration tests for complete user flows
    - Test: Registration → Dashboard → Create Skill → Character Analysis → Learning Session
    - Test: Login → Library → Select Skill → View Recap → Resume Session
    - Verify adaptive adjustments work during active sessions
    - _Requirements: All workflow requirements_

- [x] 27. Final checkpoint - Comprehensive testing
  - Run all unit tests and property tests
  - Verify all 55 correctness properties pass
  - Test error handling scenarios
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations using fast-check
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: database → backend services → API endpoints → frontend components
- All AI service calls are proxied through the backend to protect API credentials
- Roadmaps are generated once and never regenerated, ensuring learning path consistency
- All property tests should include comment tags: `// Feature: adaptive-ai-skill-mentor, Property {number}: {property_text}`
