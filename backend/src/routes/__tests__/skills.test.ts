/**
 * Unit tests for Skills API endpoints
 */

import request from 'supertest';
import express from 'express';
import skillsRoutes from '../skills';
import { supabase } from '../../db';

// Mock the database
jest.mock('../../db', () => ({
  supabase: {
    from: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/skills', skillsRoutes);

describe('Skills API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/skills', () => {
    it('should create a skill successfully when user has profile', async () => {
      const mockProfile = {
        user_id: 'user-123',
        tone_type: 'Friendly',
        confidence_level: 'medium',
        motivation_index: 75
      };

      const mockSkill = {
        id: 'skill-123',
        user_id: 'user-123',
        skill_name: 'JavaScript',
        goal: 'Learn async programming',
        timeline: 30,
        created_at: new Date().toISOString()
      };

      // Mock personality profile check
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
      });

      // Mock skill insertion
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockSkill, error: null })
      });

      const response = await request(app)
        .post('/api/skills')
        .send({
          userId: 'user-123',
          skillName: 'JavaScript',
          goal: 'Learn async programming',
          timeline: 30
        });

      expect(response.status).toBe(201);
      expect(response.body.skill).toEqual(mockSkill);
      expect(response.body.needsCharacterAnalysis).toBe(false);
    });

    it('should indicate character analysis needed when user has no profile', async () => {
      const mockSkill = {
        id: 'skill-123',
        user_id: 'user-123',
        skill_name: 'Python',
        goal: 'Learn data science',
        timeline: 60,
        created_at: new Date().toISOString()
      };

      // Mock personality profile check (no profile found)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116' } 
        })
      });

      // Mock skill insertion
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockSkill, error: null })
      });

      const response = await request(app)
        .post('/api/skills')
        .send({
          userId: 'user-123',
          skillName: 'Python',
          goal: 'Learn data science',
          timeline: 60
        });

      expect(response.status).toBe(201);
      expect(response.body.skill).toEqual(mockSkill);
      expect(response.body.needsCharacterAnalysis).toBe(true);
    });

    it('should reject empty skill name', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({
          userId: 'user-123',
          skillName: '',
          goal: 'Learn something',
          timeline: 30
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Skill name cannot be empty');
    });

    it('should reject whitespace-only skill name', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({
          userId: 'user-123',
          skillName: '   ',
          goal: 'Learn something',
          timeline: 30
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Skill name cannot be empty');
    });

    it('should reject zero timeline', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({
          userId: 'user-123',
          skillName: 'JavaScript',
          goal: 'Learn something',
          timeline: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Timeline must be a positive number');
    });

    it('should reject negative timeline', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({
          userId: 'user-123',
          skillName: 'JavaScript',
          goal: 'Learn something',
          timeline: -5
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Timeline must be a positive number');
    });

    it('should reject missing userId', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({
          skillName: 'JavaScript',
          goal: 'Learn something',
          timeline: 30
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID is required');
    });

    it('should reject missing goal', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({
          userId: 'user-123',
          skillName: 'JavaScript',
          timeline: 30
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Goal is required');
    });
  });

  describe('GET /api/skills/:userId', () => {
    it('should return empty array when user has no skills', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      const response = await request(app)
        .get('/api/skills/user-123');

      expect(response.status).toBe(200);
      expect(response.body.skills).toEqual([]);
    });

    it('should reject missing userId', async () => {
      const response = await request(app)
        .get('/api/skills/');

      expect(response.status).toBe(404); // Express returns 404 for missing route params
    });
  });

  describe('GET /api/skills/skill/:skillId', () => {
    it('should return skill with roadmap', async () => {
      const mockSkill = {
        id: 'skill-123',
        user_id: 'user-123',
        skill_name: 'JavaScript',
        goal: 'Learn async',
        timeline: 30,
        created_at: '2024-01-01T00:00:00Z'
      };

      const mockRoadmap = {
        id: 'roadmap-123',
        skill_id: 'skill-123',
        structure_json: [],
        mastery_threshold: 70
      };

      // Mock skill query
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockSkill, error: null })
      });

      // Mock roadmap query
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRoadmap, error: null })
      });

      const response = await request(app)
        .get('/api/skills/skill/skill-123');

      expect(response.status).toBe(200);
      expect(response.body.skill).toEqual(mockSkill);
      expect(response.body.roadmap).toEqual(mockRoadmap);
    });

    it('should return skill without roadmap if roadmap does not exist', async () => {
      const mockSkill = {
        id: 'skill-123',
        user_id: 'user-123',
        skill_name: 'JavaScript',
        goal: 'Learn async',
        timeline: 30,
        created_at: '2024-01-01T00:00:00Z'
      };

      // Mock skill query
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockSkill, error: null })
      });

      // Mock roadmap query (not found)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'Not found' } 
        })
      });

      const response = await request(app)
        .get('/api/skills/skill/skill-123');

      expect(response.status).toBe(200);
      expect(response.body.skill).toEqual(mockSkill);
      expect(response.body.roadmap).toBeNull();
    });

    it('should return 404 when skill not found', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'Not found' } 
        })
      });

      const response = await request(app)
        .get('/api/skills/skill/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Skill not found');
    });
  });
});
