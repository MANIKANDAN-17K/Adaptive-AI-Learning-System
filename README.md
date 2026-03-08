# 🧠 AI Personal Skill Coach - Adaptive Learning Gym

> A capability-aware AI coaching system that creates personalized learning experiences and continuously evolves your roadmap based on mastery, speed, struggle patterns, and goals.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18.x-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-14.x-blue.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Adaptive Learning Algorithm](#adaptive-learning-algorithm)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)

---

## 🎯 Overview

**AI Personal Skill Coach** is not just another online learning platform—it's an intelligent coaching system that adapts to each learner individually. Unlike traditional platforms that deliver the same course to everyone, our system:

- **Assesses your capability first** through diagnostic tests before building your roadmap
- **Adapts in real-time** based on your performance, adjusting difficulty when you struggle or excel
- **Detects struggle patterns** automatically and simplifies content without you asking
- **Evolves your roadmap dynamically** by restructuring your learning path as you progress
- **Generates personalized content** with AI tailored to your exact mastery level

### The Problem

Traditional learning platforms have three critical flaws:

1. **One-size-fits-all content** - Everyone gets the same course regardless of prior knowledge
2. **Zero adaptation** - No adjustment based on how you actually learn
3. **No coaching intelligence** - Just content delivery without understanding the learner

### Our Solution

We built a capability-aware adaptive AI coaching system that:

- Models each learner's capability, velocity, and struggle patterns
- Provides a personal learning room for each skill with evolving content
- Continuously adapts difficulty and pacing in real-time
- Acts like a real human mentor who understands your needs

---

## ✨ Key Features

### 🎯 Intelligent Capability Assessment
- Pre-learning diagnostic tests to establish baseline knowledge
- Motivation and learning style questionnaires
- Dynamic difficulty calibration based on initial performance

### 🗺️ Personalized Learning Roadmaps
- Custom paths generated for each individual based on capability profile
- Topics skipped, emphasized, or reordered based on your knowledge
- Visual graph showing current position and upcoming concepts

### 🚪 Personal Learning Rooms
- Dedicated workspace for each skill you're learning
- Structured lessons, practice exercises, and real-world projects
- Real-time analytics dashboard tracking your progress

### ⚡ Real-Time Adaptive Engine
- Monitors mastery score, learning velocity, and struggle patterns
- Automatically adjusts content difficulty based on performance
- Detects when you're struggling and simplifies explanations
- Accelerates pace when you're excelling

### 🔄 Dynamic Roadmap Evolution
- Roadmap restructures itself based on your actual progress
- Inserts reinforcement exercises when needed
- Unlocks advanced topics early for fast learners
- Schedules automatic revision sessions

### 🤖 AI-Powered Content Generation
- Uses Google Gemini API to create personalized explanations
- Generates custom practice exercises targeting your weak areas
- Produces relevant project ideas based on your goals
- Adapts content tone and complexity to your level

### 📊 Comprehensive Analytics
- Mastery heatmap showing strengths and weaknesses
- Learning velocity graphs tracking your speed over time
- Progress predictions and estimated completion dates
- Detailed performance metrics per concept

---

## 🎬 Demo

**Live Application:** [https://ai-skill-coach.vercel.app](https://ai-skill-coach.vercel.app) *(Replace with your actual URL)*

**Demo Video:** [Watch Demo](https://www.youtube.com/watch?v=your-video-id) *(Replace with your actual video)*

### Demo Credentials
```
Email: demo@skillcoach.ai
Password: Demo123!
```

### Quick Demo Flow

1. **Register/Login** → Access your global dashboard
2. **Select React Skill** → Begin the learning journey
3. **Complete Assessment** → Answer motivation questions and take capability quiz
4. **View Personalized Roadmap** → See your custom learning path
5. **Enter Learning Room** → Start with your first concept
6. **Practice & Submit** → Complete exercises and see adaptive response
7. **View Analytics** → Track your mastery and progress

---

## 🛠️ Tech Stack

### Frontend
- **React.js** - Component-based UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Hook Form** - Form management

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Database
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client

### AI/ML
- **Google Gemini API** - Content generation and personalization

### DevOps
- **Git & GitHub** - Version control
- **Vercel** - Frontend hosting
- **Railway** - Backend and database hosting

---

## 🏗️ Architecture
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

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads)
- **Code Editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-skill-coach.git
cd ai-skill-coach
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../backend
npm install
```

### Environment Variables

#### Backend Environment Variables

Create a `.env` file in the `backend` directory:
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_skill_coach

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**How to get Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key and paste it in your `.env` file

#### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Database Setup

1. **Create PostgreSQL Database**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ai_skill_coach;

# Connect to the database
\c ai_skill_coach
```

2. **Run Database Schema**
```bash
# From the backend directory
cd backend
psql -U postgres -d ai_skill_coach -f database/schema.sql
```

3. **Seed Sample Data (Optional)**
```bash
psql -U postgres -d ai_skill_coach -f database/seed.sql
```

### Running the Application

#### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# App runs on http://localhost:3000
```

#### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the build folder
```

### Verify Installation

1. Open browser to `http://localhost:3000`
2. Register a new account
3. Select a skill and complete assessment
4. Verify adaptive features are working

---

## 📁 Project Structure
```
ai-skill-coach/
├── frontend/                    # React application
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Dashboard/
│   │   │   ├── Assessment/
│   │   │   ├── LearningRoom/
│   │   │   └── Common/
│   │   ├── pages/              # Page-level components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Assessment.jsx
│   │   │   └── LearningRoom.jsx
│   │   ├── services/           # API integration
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── learningService.js
│   │   ├── context/            # State management
│   │   │   ├── AuthContext.jsx
│   │   │   └── LearningContext.jsx
│   │   ├── utils/              # Helper functions
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
│
├── backend/                     # Node.js server
│   ├── src/
│   │   ├── config/             # Configuration
│   │   │   ├── database.js
│   │   │   └── gemini.js
│   │   ├── controllers/        # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── skillController.js
│   │   │   ├── assessmentController.js
│   │   │   └── learningController.js
│   │   ├── routes/             # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── skillRoutes.js
│   │   │   └── learningRoutes.js
│   │   ├── services/           # Business logic
│   │   │   ├── intentDiscoveryService.js
│   │   │   ├── roadmapGeneratorService.js
│   │   │   ├── adaptiveEngineService.js
│   │   │   └── contentGeneratorService.js
│   │   ├── middleware/         # Middleware functions
│   │   │   ├── authMiddleware.js
│   │   │   └── validationMiddleware.js
│   │   ├── utils/              # Helper functions
│   │   │   ├── masteryCalculator.js
│   │   │   ├── velocityCalculator.js
│   │   │   └── struggleDetector.js
│   │   └── server.js
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── package.json
│   └── .env
│
├── docs/                        # Documentation
│   ├── requirements.md
│   ├── design.md
│   └── API.md
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-backend-url.railway.app/api
```

### Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Authentication
```
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # Login user
GET    /api/auth/profile       # Get user profile
```

#### Skills
```
GET    /api/skills             # List available skills
GET    /api/skills/:id         # Get skill details
POST   /api/skills/:id/enroll  # Enroll in skill
```

#### Assessment
```
POST   /api/assessment/intent      # Submit intent discovery
GET    /api/assessment/quiz/:id    # Get capability quiz
POST   /api/assessment/submit      # Submit quiz answers
GET    /api/assessment/profile     # Get capability profile
```

#### Learning
```
GET    /api/learning/roadmap/:skillId        # Get personalized roadmap
GET    /api/learning/concept/:conceptId      # Get concept content
POST   /api/learning/practice                # Submit practice answer
GET    /api/learning/analytics/:skillId      # Get analytics data
```

#### Content Generation
```
POST   /api/content/generate       # Generate AI content
POST   /api/content/simplify       # Simplify content
POST   /api/content/exercise       # Generate exercise
```

**Full API documentation:** See [docs/API.md](docs/API.md)

---

## 🧮 Adaptive Learning Algorithm

### Mastery Score Calculation
```javascript
function calculateMastery(oldMastery, performance, conceptDifficulty) {
  const learningRate = 0.3 * conceptDifficulty;
  const newMastery = oldMastery + learningRate * (performance - oldMastery);
  return Math.max(0, Math.min(1, newMastery));
}
```

**Example:**
- Old Mastery: 0.5 (50%)
- Performance: 0.8 (80% correct)
- Concept Difficulty: 1.0
- **New Mastery: 0.59 (59%)**

### Learning Velocity
```javascript
velocity = (accuracy × difficulty_weight) / time_spent
```

**High velocity (>0.8)** → Increase difficulty, unlock next topic  
**Low velocity (<0.4)** → Simplify content, add practice

### Struggle Detection
```javascript
struggle_index = 0.4×(retries/expected) + 0.3×(errors/attempts) + 0.3×(time/avg_time)
```

**Struggle Index >0.6** → Automatic intervention:
- Break topic into micro-lessons
- Add visual explanations
- Provide more examples
- Slow down pacing

### Adaptive Decision Logic
```
IF mastery < 0.4 OR struggle_index > 0.6:
    → Simplify content, add reinforcement
    
ELSE IF mastery > 0.75 AND velocity > 0.8:
    → Advance to next topic, increase difficulty
    
ELSE IF retention_score < 0.5:
    → Schedule revision session
    
ELSE:
    → Continue current pace
```

---

## 🌐 Deployment

### Deploy to Vercel (Frontend)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd frontend
vercel --prod
```

3. **Add Environment Variables** in Vercel Dashboard
- `REACT_APP_API_URL` = Your backend URL

### Deploy to Railway (Backend)

1. **Create Railway Account** at [railway.app](https://railway.app)

2. **Connect GitHub Repository**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository

3. **Add PostgreSQL Database**
- Click "New"
- Select "Database" → "PostgreSQL"
- Copy the `DATABASE_URL`

4. **Set Environment Variables**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=<from Railway PostgreSQL>
JWT_SECRET=<your secret>
GEMINI_API_KEY=<your key>
FRONTEND_URL=<your Vercel URL>
```

5. **Deploy**
- Push to main branch
- Railway auto-deploys

### Run Database Migrations
```bash
# Connect to Railway PostgreSQL
railway connect postgres

# Run schema
\i database/schema.sql
```

---

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
```bash
   git checkout -b feature/AmazingFeature
```
3. **Commit your changes**
```bash
   git commit -m 'Add some AmazingFeature'
```
4. **Push to the branch**
```bash
   git push origin feature/AmazingFeature
```
5. **Open a Pull Request**

### Coding Standards

- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation


---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini API** for AI-powered content generation
- **PostgreSQL** for robust data storage
- **React Community** for excellent documentation
- **Hackathon Organizers** for the opportunity

---

## 📞 Contact

**Project Link:** [https://github.com/yourusername/ai-skill-coach](https://github.com/yourusername/ai-skill-coach)

**Live Demo:** [https://ai-skill-coach.vercel.app](https://ai-skill-coach.vercel.app)

**Email:** contact@skillcoach.ai

---

## 🔮 Future Roadmap

- [ ] Multi-language support
- [ ] Mobile native applications (React Native)
- [ ] Advanced ML models (LSTM, Reinforcement Learning)
- [ ] Live mentor sessions
- [ ] Gamification features
- [ ] Social learning community
- [ ] Integration with popular LMS platforms
- [ ] Certificate generation with blockchain verification

---

## 📊 Project Status

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Coverage](https://img.shields.io/badge/coverage-85%25-green.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

**Current Version:** 1.0.0 (MVP)  
**Last Updated:** March 2024  
**Status:** Active Development

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

Made with ❤️ by MC_mapuls

[Report Bug](https://github.com/yourusername/ai-skill-coach/issues) · [Request Feature](https://github.com/yourusername/ai-skill-coach/issues)

</div>
