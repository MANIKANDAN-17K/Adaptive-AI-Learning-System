# AI Personal Skill Coach - Design Document

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Design](#database-design)
3. [API Design](#api-design)
4. [Frontend Design](#frontend-design)
5. [Adaptive Intelligence Algorithm](#adaptive-intelligence-algorithm)
6. [UI/UX Design](#uiux-design)
7. [Security Design](#security-design)
8. [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────┐
│           CLIENT LAYER                      │
│   React SPA (Vercel)                        │
│   - Dashboard UI                            │
│   - Learning Room UI                        │
│   - Analytics Visualizations                │
└────────────────┬────────────────────────────┘
                 │
                 │ HTTPS/REST API
                 │
┌────────────────▼────────────────────────────┐
│        APPLICATION LAYER                    │
│   Node.js + Express (Railway)               │
│   ┌──────────────────────────────────────┐ │
│   │ Intent Discovery Engine              │ │
│   │ Roadmap Generator                    │ │
│   │ Adaptive Intelligence Engine         │ │
│   │ Content Generator Service            │ │
│   │ Analytics Service                    │ │
│   └──────────────────────────────────────┘ │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
┌───────▼──────┐  ┌────────▼─────────┐
│  PostgreSQL  │  │   Gemini API     │
│  (Railway)   │  │  (Google AI)     │
│              │  │                  │
│  - Users     │  │  - Content Gen   │
│  - Skills    │  │  - Explanations  │
│  - Concepts  │  │  - Exercises     │
│  - Mastery   │  │  - Projects      │
└──────────────┘  └──────────────────┘
```

### Component Interaction Flow
```
User Action → Frontend → API Request → Backend Service
                                           ↓
                                    Database Query
                                           ↓
                                    Business Logic
                                           ↓
                                    Adaptive Engine
                                           ↓
                                    AI Content Gen (if needed)
                                           ↓
                                    Response → Frontend → User
```

---

## Database Design

### Entity-Relationship Diagram
```
┌─────────────┐         ┌──────────────┐
│   Users     │1      N │ User_Skills  │
│─────────────│◄────────┤──────────────│
│ user_id (PK)│         │ user_skill_id│
│ email       │         │ user_id (FK) │
│ password    │         │ skill_id (FK)│
│ full_name   │         │ motivation   │
└─────────────┘         │ timeline     │
                        │ learning_style│
                        └──────┬───────┘
                               │
                               │N
┌─────────────┐         ┌─────▼────────┐
│   Skills    │1      N │  Concepts    │
│─────────────│◄────────┤──────────────│
│ skill_id(PK)│         │ concept_id   │
│ skill_name  │         │ skill_id (FK)│
│ description │         │ concept_name │
│ difficulty  │         │ difficulty   │
└─────────────┘         │ prerequisites│
                        └──────┬───────┘
                               │
                               │N
                        ┌──────▼──────────────┐
                        │ User_Concept_State  │
                        │─────────────────────│
                        │ state_id (PK)       │
                        │ user_id (FK)        │
                        │ concept_id (FK)     │
                        │ mastery_score       │
                        │ velocity            │
                        │ struggle_index      │
                        │ last_practiced      │
                        │ retry_count         │
                        └─────────────────────┘
```

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

#### Skills Table
```sql
CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(50),
    estimated_hours INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Concepts Table (Knowledge Graph)
```sql
CREATE TABLE concepts (
    concept_id SERIAL PRIMARY KEY,
    skill_id INTEGER REFERENCES skills(skill_id) ON DELETE CASCADE,
    concept_name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty DECIMAL(3,2) CHECK (difficulty BETWEEN 0 AND 1),
    estimated_time INTEGER,
    prerequisites JSONB DEFAULT '[]',
    content_outline JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_concepts_skill ON concepts(skill_id);
CREATE INDEX idx_concepts_prereq ON concepts USING GIN (prerequisites);
```

#### User_Skills Table
```sql
CREATE TABLE user_skills (
    user_skill_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(skill_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivation VARCHAR(100),
    timeline VARCHAR(50),
    learning_style VARCHAR(50),
    target_date DATE,
    baseline_score DECIMAL(3,2),
    UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);
```

#### User_Concept_State Table
```sql
CREATE TABLE user_concept_state (
    state_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    concept_id INTEGER REFERENCES concepts(concept_id) ON DELETE CASCADE,
    mastery_score DECIMAL(3,2) DEFAULT 0.0 CHECK (mastery_score BETWEEN 0 AND 1),
    velocity DECIMAL(5,4) DEFAULT 0.0,
    struggle_index DECIMAL(3,2) DEFAULT 0.0,
    last_practiced TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, concept_id)
);

CREATE INDEX idx_state_user_concept ON user_concept_state(user_id, concept_id);
CREATE INDEX idx_state_mastery ON user_concept_state(mastery_score);
```

#### Performance_Logs Table
```sql
CREATE TABLE performance_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    concept_id INTEGER REFERENCES concepts(concept_id) ON DELETE CASCADE,
    exercise_type VARCHAR(50),
    accuracy DECIMAL(3,2),
    time_spent INTEGER,
    attempts INTEGER DEFAULT 1,
    errors JSONB,
    completed BOOLEAN DEFAULT false,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_user_concept ON performance_logs(user_id, concept_id);
CREATE INDEX idx_logs_timestamp ON performance_logs(logged_at);
```

---

## API Design

### Authentication Endpoints

#### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": 123
}
```

#### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 123,
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

### Skill Endpoints

#### GET /api/skills
**Response:**
```json
{
  "skills": [
    {
      "skillId": 1,
      "skillName": "React.js",
      "description": "Modern frontend library",
      "difficulty": "Intermediate",
      "estimatedHours": 40
    }
  ]
}
```

#### POST /api/skills/:id/enroll
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "motivation": "Job Interview",
  "timeline": "2 months",
  "learningStyle": "Project-based"
}
```

**Response:**
```json
{
  "success": true,
  "userSkillId": 456,
  "message": "Enrolled successfully"
}
```

### Assessment Endpoints

#### POST /api/assessment/intent
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "skillId": 1,
  "motivation": "Job Interview",
  "timeline": "Urgent",
  "learningStyle": "Hands-on",
  "targetDate": "2024-04-15"
}
```

**Response:**
```json
{
  "success": true,
  "nextStep": "capability_quiz",
  "quizId": 789
}
```

#### GET /api/assessment/quiz/:skillId
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "quizId": 789,
  "questions": [
    {
      "questionId": 1,
      "text": "What is a closure in JavaScript?",
      "type": "multiple_choice",
      "options": ["A", "B", "C", "D"],
      "points": 10
    }
  ],
  "totalQuestions": 10,
  "timeLimit": 600
}
```

#### POST /api/assessment/submit
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "quizId": 789,
  "answers": [
    {"questionId": 1, "answer": "A", "timeTaken": 45},
    {"questionId": 2, "answer": "C", "timeTaken": 60}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "score": 0.75,
    "correctAnswers": 8,
    "totalQuestions": 10,
    "averageTime": 52,
    "capabilityProfile": {
      "jsKnowledge": 0.75,
      "logicalSpeed": 0.80,
      "conceptualUnderstanding": 0.70
    }
  }
}
```

### Learning Endpoints

#### GET /api/learning/roadmap/:skillId
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "roadmap": {
    "nodes": [
      {
        "conceptId": 1,
        "conceptName": "JavaScript Basics",
        "status": "skipped",
        "reason": "High baseline score"
      },
      {
        "conceptId": 2,
        "conceptName": "React Hooks",
        "status": "current",
        "estimatedTime": 180,
        "prerequisites": []
      }
    ],
    "estimatedCompletion": "2024-04-10",
    "progressPercentage": 15
  }
}
```

#### GET /api/learning/concept/:conceptId
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "concept": {
    "conceptId": 2,
    "conceptName": "React Hooks",
    "content": {
      "lesson": "Hooks are functions that...",
      "examples": ["useState example", "useEffect example"],
      "keyPoints": ["Point 1", "Point 2"]
    },
    "exercises": [
      {
        "exerciseId": 10,
        "type": "coding",
        "description": "Implement a counter using useState"
      }
    ]
  }
}
```

#### POST /api/learning/practice
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "conceptId": 2,
  "exerciseId": 10,
  "answer": "const [count, setCount] = useState(0);",
  "timeTaken": 120
}
```

**Response:**
```json
{
  "correct": true,
  "feedback": "Great job! Your implementation is correct.",
  "masteryUpdate": {
    "previousMastery": 0.45,
    "newMastery": 0.58,
    "velocity": 0.72
  },
  "adaptiveAction": {
    "type": "continue",
    "message": "You're progressing well. Ready for the next exercise?"
  }
}
```

### Content Generation Endpoints

#### POST /api/content/generate
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "conceptId": 2,
  "contentType": "explanation",
  "userContext": {
    "masteryScore": 0.45,
    "struggleAreas": ["dependency array"],
    "learningStyle": "visual"
  }
}
```

**Response:**
```json
{
  "generatedContent": {
    "explanation": "Think of useEffect's dependency array like a watchlist...",
    "examples": ["Example 1", "Example 2"],
    "visualAid": "diagram_url"
  },
  "generationTime": 2.3
}
```

---

## Frontend Design

### Component Hierarchy
```
App
├── AuthProvider
│   ├── Login
│   └── Register
├── Dashboard
│   ├── Navbar
│   ├── SkillGrid
│   │   └── SkillCard
│   └── ProgressOverview
├── SkillSelection
│   └── SkillDetails
├── Assessment
│   ├── IntentDiscovery
│   │   ├── MotivationForm
│   │   └── StyleSelector
│   └── CapabilityQuiz
│       ├── QuestionCard
│       └── Timer
├── LearningRoom
│   ├── RoadmapPanel
│   │   └── ConceptNode
│   ├── ContentArea
│   │   ├── LessonView
│   │   └── ExampleCode
│   ├── PracticeZone
│   │   ├── ExerciseCard
│   │   └── CodeEditor
│   └── AnalyticsPanel
│       ├── MasteryHeatmap
│       ├── VelocityGraph
│       └── ProgressBar
└── Profile
    ├── UserInfo
    └── Settings
```

### State Management
```javascript
// AuthContext
{
  user: { userId, email, fullName, token },
  isAuthenticated: boolean,
  login: (credentials) => Promise,
  logout: () => void,
  register: (userData) => Promise
}

// LearningContext
{
  currentSkill: { skillId, skillName, ... },
  roadmap: { nodes[], estimatedCompletion },
  currentConcept: { conceptId, content, ... },
  masteryStates: Map<conceptId, masteryData>,
  analytics: { overall progress, velocity, ... },
  updateMastery: (conceptId, newScore) => void
}
```

### Routing Structure
```javascript
/                          → Landing Page
/login                     → Login Page
/register                  → Register Page
/dashboard                 → Global Dashboard
/skills                    → Skill Selection
/assessment/:skillId       → Intent + Capability Assessment
/learning/:skillId         → Learning Room
/learning/:skillId/:conceptId → Specific Concept
/analytics/:skillId        → Detailed Analytics
/profile                   → User Profile
```

---

## Adaptive Intelligence Algorithm

### Mastery Score Calculation
```javascript
function calculateMastery(oldMastery, performance, conceptDifficulty) {
  const learningRate = 0.3 * conceptDifficulty;
  const newMastery = oldMastery + learningRate * (performance - oldMastery);
  return Math.max(0, Math.min(1, newMastery)); // Clamp between 0 and 1
}

// Example:
// oldMastery = 0.5
// performance = 0.8 (80% correct)
// conceptDifficulty = 1.0
// learningRate = 0.3
// newMastery = 0.5 + 0.3 * (0.8 - 0.5) = 0.59
```

### Learning Velocity Calculation
```javascript
function calculateVelocity(accuracy, timeTaken, expectedTime, difficultyWeight) {
  const timeRatio = expectedTime / timeTaken;
  const velocity = (accuracy * difficultyWeight * timeRatio);
  return velocity;
}

// Example:
// accuracy = 0.85
// timeTaken = 120 seconds
// expectedTime = 180 seconds
// difficultyWeight = 1.2
// timeRatio = 180/120 = 1.5
// velocity = 0.85 * 1.2 * 1.5 = 1.53 (high velocity!)
```

### Struggle Index Calculation
```javascript
function calculateStruggleIndex(retryCount, errorFrequency, timeRatio) {
  const w1 = 0.4; // weight for retries
  const w2 = 0.3; // weight for errors
  const w3 = 0.3; // weight for time
  
  const retryScore = Math.min(retryCount / 3, 1.0); // Normalize to max 1.0
  const errorScore = errorFrequency; // Already 0-1
  const timeScore = Math.min(timeRatio / 2, 1.0); // Normalize
  
  const struggleIndex = w1 * retryScore + w2 * errorScore + w3 * timeScore;
  return struggleIndex;
}

// Example:
// retryCount = 3, errorFrequency = 0.6, timeRatio = 2.5
// retryScore = 3/3 = 1.0
// errorScore = 0.6
// timeScore = 2.5/2 = 1.0 (clamped)
// struggleIndex = 0.4*1.0 + 0.3*0.6 + 0.3*1.0 = 0.88 (high struggle)
```

### Adaptive Decision Logic
```javascript
function makeAdaptiveDecision(masteryScore, velocity, struggleIndex, retentionScore) {
  // High struggle - simplify immediately
  if (struggleIndex > 0.6 || masteryScore < 0.4) {
    return {
      action: 'simplify',
      recommendations: [
        'break_into_microlessons',
        'add_visual_examples',
        'reduce_complexity',
        'provide_step_by_step_guide'
      ]
    };
  }
  
  // Mastery achieved - advance
  if (masteryScore > 0.75 && velocity > 0.8) {
    return {
      action: 'advance',
      recommendations: [
        'unlock_next_concept',
        'add_advanced_challenges',
        'introduce_project',
        'skip_optional_practice'
      ]
    };
  }
  
  // Retention issue - revise
  if (retentionScore < 0.5) {
    return {
      action: 'revise',
      recommendations: [
        'schedule_revision_session',
        'quiz_on_forgotten_concepts',
        'spaced_repetition'
      ]
    };
  }
  
  // Normal progress - continue
  return {
    action: 'continue',
    recommendations: [
      'maintain_current_pace',
      'add_moderate_practice'
    ]
  };
}
```

### Roadmap Restructuring Algorithm
```javascript
function restructureRoadmap(userState, knowledgeGraph, adaptiveDecision) {
  const newRoadmap = [...currentRoadmap];
  
  if (adaptiveDecision.action === 'simplify') {
    // Insert reinforcement nodes
    const currentIndex = findCurrentConceptIndex();
    newRoadmap.splice(currentIndex + 1, 0, {
      type: 'reinforcement',
      conceptId: currentConcept.id,
      exercises: generateReinforcementExercises(userState.struggleAreas)
    });
    
    // Add revision loop
    newRoadmap.splice(currentIndex + 3, 0, {
      type: 'revision',
      conceptId: currentConcept.id
    });
  }
  
  if (adaptiveDecision.action === 'advance') {
    // Remove optional intermediate concepts
    const optionalConcepts = findOptionalConcepts(currentConcept);
    newRoadmap = newRoadmap.filter(node => !optionalConcepts.includes(node.conceptId));
    
    // Unlock advanced concepts early
    unlockConcept(findNextAdvancedConcept());
  }
  
  // Recalculate timeline
  newRoadmap.estimatedCompletion = calculateNewTimeline(newRoadmap, userState.velocity);
  
  return newRoadmap;
}
```

---

## UI/UX Design

### Design System

**Color Palette:**
- Primary: `#028090` (Teal)
- Secondary: `#00A896` (Seafoam)
- Accent: `#02C39A` (Mint)
- Dark: `#014451` (Deep Teal)
- Light: `#F0F9FF` (Ice Blue)
- Success: `#10B981` (Green)
- Warning: `#F59E0B` (Orange)
- Error: `#EF4444` (Red)
- Text: `#1E293B` (Dark Slate)
- Text Muted: `#64748B` (Slate)

**Typography:**
- Headings: Inter, Arial Black (bold, 32-48pt)
- Subheadings: Inter, Arial (semibold, 20-24pt)
- Body: Inter, Calibri (regular, 14-16pt)
- Code: Fira Code, Consolas (monospace, 14pt)

**Spacing Scale:**
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

### Key UI Components

#### Skill Card
```
┌─────────────────────────────────┐
│  [Icon]  React.js               │
│                                 │
│  Master modern frontend         │
│  development                    │
│                                 │
│  ▓▓▓▓▓░░░░░ 45% Complete       │
│                                 │
│  [Continue Learning] [View]     │
└─────────────────────────────────┘
```

#### Mastery Heatmap
```
Concepts              Mastery
─────────────────────────────
JSX                  ████████░░ 80%
Components           ██████████ 100%
Props                ████████░░ 85%
State                ████░░░░░░ 40% ⚠️
Hooks                ██░░░░░░░░ 20% ⚠️
```

#### Roadmap Visualization
```
    [✓ JS Basics]
          ↓
    [✓ ES6 Features]
          ↓
    [→ React Basics] ← You are here
          ↓
    [🔒 Hooks]
          ↓
    [🔒 Context API]
```

### User Flow Diagrams

**Onboarding Flow:**
```
Landing → Register → Login → Dashboard → Select Skill →
Intent Questions → Capability Quiz → Roadmap Generated →
Enter Learning Room → Start Learning
```

**Learning Session Flow:**
```
View Lesson → Practice Exercise → Submit Answer →
System Analyzes → Adaptive Response →
(Simplify Content OR Continue OR Advance) →
Update Analytics → Next Content
```

---

## Security Design

### Authentication Flow
```
1. User submits credentials
2. Server validates credentials
3. Server generates JWT token with payload:
   {
     userId: 123,
     email: "user@example.com",
     iat: 1234567890,
     exp: 1234657890
   }
4. Token sent to client
5. Client stores token (localStorage)
6. Client includes token in Authorization header for protected routes
7. Server verifies token on each request
```

### Password Security
```javascript
// Registration
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
// Store hashedPassword in database

// Login
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Input Validation
```javascript
// Example validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  body('fullName').trim().escape().isLength({ min: 2, max: 100 })
];
```

### SQL Injection Prevention
```javascript
// Use parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);

// NEVER do this:
// const query = `SELECT * FROM users WHERE email = '${email}'`;
```

### CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Deployment Architecture

### Production Environment
```
┌─────────────────────────────────────────────┐
│  Vercel (Frontend)                          │
│  - React SPA                                │
│  - CDN distribution                         │
│  - Automatic HTTPS                          │
│  - Environment variables                    │
│  URL: skillcoach-ai.vercel.app             │
└────────────────┬────────────────────────────┘
                 │
                 │ HTTPS API Calls
                 │
┌────────────────▼────────────────────────────┐
│  Railway (Backend)                          │
│  - Node.js Express server                   │
│  - Auto-scaling                             │
│  - Health checks                            │
│  - Environment variables                    │
│  URL: api.skillcoach-ai.railway.app        │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
┌───────▼──────┐  ┌────────▼─────────┐
│ Railway DB   │  │ Gemini API       │
│ PostgreSQL   │  │ (External)       │
│              │  │                  │
│ - Managed    │  │ - Rate limited   │
│ - Backups    │  │ - Monitored      │
└──────────────┘  └──────────────────┘
```

### Environment Variables

**.env (Backend):**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your_super_secret_key_here
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://skillcoach-ai.vercel.app
```

**.env (Frontend):**
```
REACT_APP_API_URL=https://api.skillcoach-ai.railway.app
```

### Deployment Steps

**Frontend (Vercel):**
1. Connect GitHub repository
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `build`
3. Add environment variables
4. Deploy automatically on push to main

**Backend (Railway):**
1. Connect GitHub repository
2. Add PostgreSQL plugin
3. Configure environment variables
4. Set start command: `node src/server.js`
5. Deploy automatically on push to main

### Monitoring & Logging
```javascript
// Morgan for HTTP logging
app.use(morgan('combined'));

// Custom error logger
app.use((err, req, res, next) => {
  console.error({
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({ error: 'Internal server error' });
});
```

---

## Performance Optimization

### Database Optimization

**Indexing Strategy:**
```sql
-- Frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_concepts_skill ON concepts(skill_id);
CREATE INDEX idx_state_user_concept ON user_concept_state(user_id, concept_id);
CREATE INDEX idx_logs_timestamp ON performance_logs(logged_at);

-- GIN index for JSONB fields
CREATE INDEX idx_concepts_prereq ON concepts USING GIN (prerequisites);
```

**Connection Pooling:**
```javascript
const pool = new Pool({
  max: 20, // maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Frontend Optimization

**Code Splitting:**
```javascript
const LearningRoom = lazy(() => import('./pages/LearningRoom'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Use with Suspense
<Suspense fallback={<Loader />}>
  <LearningRoom />
</Suspense>
```

**Memoization:**
```javascript
const MasteryHeatmap = memo(({ data }) => {
  // Expensive visualization
  return <Chart data={data} />;
});
```

### API Response Caching
```javascript
// Cache roadmap for 5 minutes
const roadmapCache = new Map();

app.get('/api/learning/roadmap/:skillId', async (req, res) => {
  const cacheKey = `${req.user.userId}_${req.params.skillId}`;
  
  if (roadmapCache.has(cacheKey)) {
    const { data, timestamp } = roadmapCache.get(cacheKey);
    if (Date.now() - timestamp < 300000) { // 5 minutes
      return res.json(data);
    }
  }
  
  const roadmap = await generateRoadmap(req.user.userId, req.params.skillId);
  roadmapCache.set(cacheKey, { data: roadmap, timestamp: Date.now() });
  
  res.json(roadmap);
});
```

---

## Testing Strategy

### Unit Tests
```javascript
// Example: Test mastery calculation
describe('calculateMastery', () => {
  test('should increase mastery on good performance', () => {
    const result = calculateMastery(0.5, 0.8, 1.0);
    expect(result).toBeGreaterThan(0.5);
    expect(result).toBeLessThanOrEqual(1.0);
  });
  
  test('should not exceed 1.0', () => {
    const result = calculateMastery(0.9, 1.0, 1.0);
    expect(result).toBeLessThanOrEqual(1.0);
  });
});
```

### Integration Tests
```javascript
// Example: Test login endpoint
describe('POST /api/auth/login', () => {
  test('should return token on valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'ValidPass123!' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

---

## Future Enhancements

### Technical Debt & Improvements

1. **Advanced ML Models**
   - Implement LSTM for sequence prediction
   - Reinforcement learning for optimal pacing
   - Collaborative filtering for content recommendations

2. **Real-time Features**
   - WebSocket integration for live updates
   - Real-time collaboration features
   - Live mentor chat support

3. **Mobile Applications**
   - React Native mobile app
   - Offline learning capability
   - Push notifications for reminders

4. **Advanced Analytics**
   - Predictive failure modeling
   - Learning style clustering
   - A/B testing framework for content

5. **Scalability**
   - Microservices architecture
   - Redis caching layer
   - Message queue for async processing
   - CDN for static content

---

**Document Version:** 1.0  
**Last Updated:** [15/02/2026]  
**Architecture Lead:** [Jaya Suriya S]  
**Project Team:** [MC_maples]