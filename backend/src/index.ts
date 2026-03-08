import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import characterAnalysisRoutes from './routes/characterAnalysis';
import skillsRoutes from './routes/skills';
import roadmapsRoutes from './routes/roadmaps';
import sessionsRoutes from './routes/sessions';
import { sanitizeResponse, securityHeaders, requestLogger, errorHandler, notFoundHandler } from './middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Apply security middleware globally
app.use(securityHeaders);
app.use(sanitizeResponse);
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Adaptive AI Skill Mentor API' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Character analysis routes
app.use('/api/character-analysis', characterAnalysisRoutes);

// Skills routes
app.use('/api/skills', skillsRoutes);

// Roadmap routes
app.use('/api/roadmaps', roadmapsRoutes);

// Sessions routes
app.use('/api/sessions', sessionsRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
