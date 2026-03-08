# Requirements Document

## Introduction

The Adaptive AI Skill Mentor is a web-based learning platform that provides personalized skill development through AI-powered mentorship. The system analyzes user characteristics, generates adaptive learning roadmaps, and dynamically adjusts difficulty, tone, and pacing based on real-time performance metrics. The platform maintains persistent learning sessions and provides multiple mentor interaction modes to match individual learning preferences.

## Glossary

- **System**: The Adaptive AI Skill Mentor web application
- **User**: A person using the platform to develop skills
- **Skill**: A specific competency or knowledge area the User wants to develop
- **Roadmap**: A structured learning path with sequential nodes representing learning milestones
- **Node**: A discrete learning milestone within a Roadmap with an associated mastery threshold
- **Mastery_Score**: A calculated metric representing User proficiency, computed as (accuracy × 0.7) + (speed × 0.3)
- **Confidence_Level**: A derived metric indicating User self-assurance based on language tone, performance trends, and retry frequency
- **Character_Analysis**: An AI-driven assessment of User learning preferences, communication style, and motivation patterns
- **Personality_Profile**: Stored data containing tone_type, confidence_level, and motivation_index from Character_Analysis
- **Mentor_Mode**: The interaction style used by the AI (Professional, Friendly, Supportive, or Challenger)
- **Session**: A continuous learning interaction for a specific Skill
- **Stretch_Task**: An optional advanced challenge generated when mastery exceeds 80% and confidence is high
- **Recap**: An AI-generated summary of the previous Session for a Skill
- **Frontend**: The React-based user interface
- **Backend**: The Node.js/Express.js server
- **Database**: The PostgreSQL database managed through Supabase
- **AI_Service**: The OpenAI GPT-4.1 API integration

## Requirements

### Requirement 1: User Authentication and Profile Management

**User Story:** As a user, I want to create an account and maintain a profile, so that my learning progress and preferences are preserved across sessions.

#### Acceptance Criteria

1. WHEN a new user registers, THE System SHALL create a user record with id, name, email, and created_at timestamp
2. WHEN a user logs in, THE System SHALL authenticate credentials and establish a session
3. WHEN a user accesses their profile, THE System SHALL retrieve and display their stored information
4. IF authentication fails, THEN THE System SHALL return a descriptive error message without exposing security details

### Requirement 2: Character Analysis and Personality Profiling

**User Story:** As a user, I want the system to understand my learning style, so that the mentorship experience is personalized to my needs.

#### Acceptance Criteria

1. WHEN a user creates their first skill, THE System SHALL conduct a Character_Analysis before generating the Roadmap
2. WHEN Character_Analysis completes, THE System SHALL store a Personality_Profile containing tone_type, confidence_level, and motivation_index
3. WHERE a Personality_Profile exists for a user, THE System SHALL provide an option to skip Character_Analysis for subsequent skills
4. WHEN a user chooses to skip Character_Analysis, THE System SHALL use the existing Personality_Profile
5. WHEN Character_Analysis is performed, THE AI_Service SHALL analyze user responses to determine optimal Mentor_Mode and learning preferences

### Requirement 3: Skill Creation and Roadmap Generation

**User Story:** As a user, I want to create a new skill with personalized learning paths, so that I can work toward my specific goals.

#### Acceptance Criteria

1. WHEN a user initiates skill creation, THE System SHALL prompt for skill_name, goal, and timeline
2. WHEN skill information is provided, THE System SHALL validate that skill_name is non-empty and timeline is a positive value
3. WHEN skill creation completes, THE System SHALL store a skill record with id, user_id, skill_name, goal, timeline, and created_at
4. WHEN a Roadmap is generated, THE System SHALL create a structured learning path with sequential Nodes
5. WHEN a Roadmap is created, THE System SHALL store it with id, skill_id, structure_json, and mastery_threshold for each Node
6. WHEN generating a Roadmap, THE AI_Service SHALL personalize content based on the user's Personality_Profile

### Requirement 4: Adaptive Learning Engine

**User Story:** As a user, I want the system to adapt to my performance, so that I receive appropriately challenging content and supportive guidance.

#### Acceptance Criteria

1. WHEN a Session is active, THE System SHALL calculate Mastery_Score as (accuracy × 0.7) + (speed × 0.3)
2. WHEN a Session is active, THE System SHALL derive Confidence_Level from language tone analysis, performance trends, and retry frequency
3. WHEN Mastery_Score is below 50%, THE System SHALL simplify content and reduce pacing
4. WHEN Mastery_Score exceeds 80% AND Confidence_Level is high, THE System SHALL generate a Stretch_Task
5. WHEN Mastery_Score meets or exceeds a Node's mastery_threshold, THE System SHALL unlock the next Node in the Roadmap
6. WHEN Confidence_Level is low, THE System SHALL adjust Mentor_Mode to use supportive tone
7. WHEN Confidence_Level is high, THE System SHALL adjust Mentor_Mode to use motivating tone
8. WHEN performance metrics are collected, THE System SHALL store them in performance_logs with session_id, accuracy, speed, attempts, and timestamp

### Requirement 5: Mentor Mode Management

**User Story:** As a user, I want to interact with different mentor personalities, so that I can choose the interaction style that motivates me most.

#### Acceptance Criteria

1. THE System SHALL support four Mentor_Modes: Professional, Friendly, Supportive, and Challenger
2. WHEN a user selects a Mentor_Mode, THE System SHALL apply that mode to all AI_Service interactions
3. WHEN Mentor_Mode changes, THE System SHALL update the AI_Service prompt configuration to reflect the selected tone
4. WHEN displaying the learning interface, THE System SHALL show the current Mentor_Mode as a visible badge
5. WHERE adaptive adjustments are triggered, THE System SHALL temporarily modify Mentor_Mode based on Confidence_Level while preserving user preference

### Requirement 6: Skill Library and Session Continuity

**User Story:** As a user, I want to view all my skills and resume learning where I left off, so that I can maintain consistent progress.

#### Acceptance Criteria

1. WHEN a user accesses the Library, THE System SHALL display all skills with progress percentage, mastery level, and last session date
2. WHEN a user selects a skill from the Library, THE AI_Service SHALL generate a Recap of the previous Session
3. WHEN a Session resumes, THE System SHALL load the stored Roadmap without regenerating it
4. WHEN a Session resumes, THE System SHALL restore the last mastery_score and confidence_level from the previous Session
5. WHEN a Session is active, THE System SHALL update session data with recap_summary, mastery_score, confidence_level, and last_activity timestamp

### Requirement 7: Dashboard and Navigation

**User Story:** As a user, I want a clean, intuitive interface to access my learning tools, so that I can focus on skill development without distraction.

#### Acceptance Criteria

1. WHEN a user accesses the Dashboard, THE System SHALL display a violet glowing power button as the primary visual element
2. WHEN the Dashboard loads, THE System SHALL present two navigation options: "Create New Skill" and "Library"
3. WHEN a user clicks "Create New Skill", THE System SHALL navigate to the skill creation flow
4. WHEN a user clicks "Library", THE System SHALL navigate to the skill library view
5. THE Frontend SHALL use a minimalist design with white background, violet accents (#6C4DFF), clean typography, and rounded components
6. WHERE animations are applied, THE Frontend SHALL use smooth micro-animations that enhance user experience without causing distraction

### Requirement 8: Learning Session Interface

**User Story:** As a user, I want a focused learning interface during sessions, so that I can interact effectively with the AI mentor.

#### Acceptance Criteria

1. WHEN a learning Session is active, THE Frontend SHALL display the skill name and current Mastery_Score
2. WHEN a learning Session is active, THE Frontend SHALL provide an AI mentor response panel
3. WHEN a learning Session is active, THE Frontend SHALL provide a user input area for responses
4. WHEN a learning Session is active, THE Frontend SHALL display the current Mentor_Mode badge
5. WHEN the user submits input, THE System SHALL send it to the AI_Service and display the response in real-time
6. WHEN performance metrics change, THE Frontend SHALL update the displayed Mastery_Score without requiring page refresh

### Requirement 9: Data Persistence and Storage

**User Story:** As a user, I want my progress and roadmaps saved permanently, so that I never lose my learning journey.

#### Acceptance Criteria

1. WHEN a Skill is created, THE System SHALL persist it to the Database immediately
2. WHEN a Roadmap is generated, THE System SHALL store the complete structure_json in the Database
3. WHEN a Session updates, THE System SHALL persist mastery_score, confidence_level, and recap_summary to the Database
4. WHEN performance metrics are collected, THE System SHALL append them to performance_logs in the Database
5. WHEN a Personality_Profile is created or updated, THE System SHALL persist it to the Database linked to the user_id
6. THE Database SHALL maintain referential integrity between users, skills, roadmaps, sessions, and performance_logs

### Requirement 10: AI Service Integration

**User Story:** As a system, I want to securely integrate with OpenAI APIs, so that I can provide intelligent mentorship without exposing credentials.

#### Acceptance Criteria

1. THE Backend SHALL store OpenAI API keys in environment variables
2. THE Backend SHALL never expose API keys to the Frontend
3. WHEN the AI_Service is invoked, THE Backend SHALL make requests to OpenAI GPT-4.1 API
4. WHERE lightweight tasks are identified, THE Backend SHALL optionally use GPT-4.1-mini to reduce costs
5. WHEN AI_Service requests fail, THE System SHALL return graceful error messages to the user
6. WHEN making AI_Service requests, THE Backend SHALL include Personality_Profile data and current performance metrics in the prompt context

### Requirement 11: Roadmap Structure and Navigation

**User Story:** As a user, I want to progress through a structured learning path, so that I can systematically develop my skill.

#### Acceptance Criteria

1. WHEN a Roadmap is generated, THE System SHALL create sequential Nodes with unique identifiers and mastery thresholds
2. WHEN a user begins learning, THE System SHALL start at the first Node in the Roadmap
3. WHEN a Node's mastery_threshold is met, THE System SHALL unlock the next Node
4. WHEN a Node is unlocked, THE System SHALL update the Roadmap state in the Database
5. WHEN displaying the Roadmap, THE Frontend SHALL visually indicate locked, current, and completed Nodes
6. THE System SHALL preserve the original Roadmap structure throughout the learning journey without regeneration

### Requirement 12: Performance Tracking and Analytics

**User Story:** As a user, I want the system to track my performance, so that adaptive adjustments are based on accurate data.

#### Acceptance Criteria

1. WHEN a user completes a learning interaction, THE System SHALL record accuracy, speed, and attempts
2. WHEN performance data is recorded, THE System SHALL associate it with the current session_id and timestamp
3. WHEN calculating Mastery_Score, THE System SHALL use the formula: (accuracy × 0.7) + (speed × 0.3)
4. WHEN deriving Confidence_Level, THE System SHALL analyze language tone patterns, performance trends over time, and retry frequency
5. WHEN performance trends are analyzed, THE System SHALL compare current metrics against historical performance_logs

### Requirement 13: Error Handling and System Resilience

**User Story:** As a user, I want the system to handle errors gracefully, so that technical issues don't disrupt my learning experience.

#### Acceptance Criteria

1. IF the Database connection fails, THEN THE System SHALL return an error message and prevent data corruption
2. IF the AI_Service is unavailable, THEN THE System SHALL notify the user and suggest retrying later
3. IF invalid data is submitted, THEN THE System SHALL validate input and return specific error messages
4. IF a Session is interrupted, THEN THE System SHALL preserve the last known state in the Database
5. WHEN errors occur, THE System SHALL log error details for debugging while showing user-friendly messages to the Frontend

### Requirement 14: Stretch Task Generation

**User Story:** As a high-performing user, I want optional advanced challenges, so that I can push beyond the standard curriculum.

#### Acceptance Criteria

1. WHEN Mastery_Score exceeds 80% AND Confidence_Level is high, THE System SHALL generate a Stretch_Task
2. WHEN a Stretch_Task is generated, THE AI_Service SHALL create content that extends beyond the current Node's scope
3. WHEN a Stretch_Task is presented, THE Frontend SHALL clearly mark it as optional
4. WHEN a user completes a Stretch_Task, THE System SHALL record the performance but not block progression
5. WHEN a user skips a Stretch_Task, THE System SHALL continue to the next Node without penalty

### Requirement 15: Session Recap Generation

**User Story:** As a returning user, I want to see a summary of my previous session, so that I can quickly remember where I left off.

#### Acceptance Criteria

1. WHEN a user selects a Skill from the Library, THE AI_Service SHALL generate a Recap based on the stored recap_summary and performance history
2. WHEN generating a Recap, THE AI_Service SHALL include the last topic covered, current mastery level, and next recommended action
3. WHEN a Recap is generated, THE System SHALL display it before resuming the learning Session
4. WHEN a Session ends, THE System SHALL store a recap_summary in the Database for future Recap generation
5. THE Recap SHALL be personalized using the user's Personality_Profile and current Mentor_Mode

### Requirement 16: Frontend Technology Stack

**User Story:** As a developer, I want to use modern frontend technologies, so that the application is maintainable and performant.

#### Acceptance Criteria

1. THE Frontend SHALL be implemented using React with TypeScript
2. THE Frontend SHALL use Vite as the build tool and development server
3. THE Frontend SHALL use TailwindCSS for styling with violet accent color #6C4DFF
4. THE Frontend SHALL use Framer Motion for animations
5. WHEN rendering components, THE Frontend SHALL follow minimalist design principles with white backgrounds and clean typography

### Requirement 17: Backend Technology Stack

**User Story:** As a developer, I want to use reliable backend technologies, so that the system is scalable and secure.

#### Acceptance Criteria

1. THE Backend SHALL be implemented using Node.js with Express.js
2. THE Backend SHALL connect to a PostgreSQL Database through Supabase
3. THE Backend SHALL implement RESTful API endpoints for all Frontend operations
4. WHEN handling requests, THE Backend SHALL validate input data before processing
5. WHEN responding to requests, THE Backend SHALL return appropriate HTTP status codes and JSON responses

### Requirement 18: Database Schema Implementation

**User Story:** As a system, I want a well-structured database schema, so that data relationships are maintained and queries are efficient.

#### Acceptance Criteria

1. THE Database SHALL contain a users table with columns: id, name, email, created_at
2. THE Database SHALL contain a personality_profiles table with columns: user_id, tone_type, confidence_level, motivation_index
3. THE Database SHALL contain a skills table with columns: id, user_id, skill_name, goal, timeline, created_at
4. THE Database SHALL contain a roadmaps table with columns: id, skill_id, structure_json, mastery_threshold
5. THE Database SHALL contain a sessions table with columns: id, skill_id, recap_summary, mastery_score, confidence_level, last_activity
6. THE Database SHALL contain a performance_logs table with columns: session_id, accuracy, speed, attempts, timestamp
7. THE Database SHALL enforce foreign key constraints to maintain referential integrity between related tables

### Requirement 19: API Security

**User Story:** As a system administrator, I want API credentials secured, so that unauthorized access is prevented.

#### Acceptance Criteria

1. THE Backend SHALL store OpenAI API keys in environment variables
2. THE Backend SHALL never include API keys in responses to the Frontend
3. WHEN the Frontend requests AI operations, THE Backend SHALL proxy requests to the AI_Service without exposing credentials
4. THE Backend SHALL validate that all AI_Service requests originate from authenticated users
5. IF unauthorized API access is attempted, THEN THE Backend SHALL reject the request and log the attempt

### Requirement 20: Roadmap Persistence and Continuity

**User Story:** As a user, I want my roadmaps to remain consistent, so that my learning path doesn't change unexpectedly.

#### Acceptance Criteria

1. WHEN a Roadmap is generated for a Skill, THE System SHALL store it permanently in the Database
2. WHEN a user resumes a Skill, THE System SHALL load the existing Roadmap from the Database
3. THE System SHALL NOT regenerate Roadmaps for existing Skills
4. WHEN adaptive adjustments occur, THE System SHALL modify difficulty and tone without altering the Roadmap structure
5. WHEN a Roadmap is retrieved, THE System SHALL restore all Node states including locked, current, and completed status
