/**
 * Character Analysis API Routes Tests
 * 
 * Unit tests for character analysis endpoints
 */

import request from 'supertest';
import express from 'express';

// Mock the database
jest.mock('../../db', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock the AI service before importing the routes
const mockConductAnalysis = jest.fn();
jest.mock('../../services/AIServiceOrchestrator', () => {
  return {
    AIServiceOrchestrator: jest.fn().mockImplementation(() => {
      return {
        conductCharacterAnalysis: mockConductAnalysis
      };
    })
  };
});

import characterAnalysisRoutes from '../characterAnalysis';
import { supabase } from '../../db';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/character-analysis', characterAnalysisRoutes);

describe('Character Analysis API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/character-analysis/:userId', () => {
    it('should return null when no profile exists', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } 
            })
          })
        })
      });

      (supabase.from as jest.Mock) = mockFrom;

      const response = await request(app)
        .get('/api/character-analysis/user-123');

      expect(response.status).toBe(200);
      expect(response.body.profile).toBeNull();
    });

    it('should return profile when it exists', async () => {
      const mockProfile = {
        user_id: 'user-123',
        tone_type: 'casual',
        confidence_level: 'medium',
        motivation_index: 75
      };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: mockProfile, 
              error: null 
            })
          })
        })
      });

      (supabase.from as jest.Mock) = mockFrom;

      const response = await request(app)
        .get('/api/character-analysis/user-123');

      expect(response.status).toBe(200);
      expect(response.body.profile).toEqual(mockProfile);
    });

    it('should handle database errors', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'OTHER_ERROR', message: 'Database error' } 
            })
          })
        })
      });

      (supabase.from as jest.Mock) = mockFrom;

      const response = await request(app)
        .get('/api/character-analysis/user-123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to retrieve personality profile');
    });
  });

  describe('POST /api/character-analysis', () => {
    it('should reject request without userId', async () => {
      const response = await request(app)
        .post('/api/character-analysis')
        .send({ responses: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User ID is required');
    });

    it('should reject request without responses', async () => {
      const response = await request(app)
        .post('/api/character-analysis')
        .send({ userId: 'user-123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Responses array is required and must not be empty');
    });

    it('should reject request with empty responses array', async () => {
      const response = await request(app)
        .post('/api/character-analysis')
        .send({ userId: 'user-123', responses: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Responses array is required and must not be empty');
    });

    it('should reject request with invalid response format', async () => {
      const response = await request(app)
        .post('/api/character-analysis')
        .send({ 
          userId: 'user-123', 
          responses: [{ question: 'Test?' }] // missing response field
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Each response must have question and response fields');
    });

    it('should successfully create and store personality profile', async () => {
      const mockResponses = [
        { question: 'How do you prefer to learn?', response: 'I like hands-on practice' },
        { question: 'What motivates you?', response: 'Achieving goals' }
      ];

      const mockProfile = {
        tone_type: 'casual',
        confidence_level: 'medium',
        motivation_index: 75
      };

      const mockStoredProfile = {
        user_id: 'user-123',
        tone_type: 'casual',
        confidence_level: 'medium',
        motivation_index: 75
      };

      // Set up the mock to return the profile
      mockConductAnalysis.mockResolvedValue(mockProfile);

      // Mock database
      const mockFrom = jest.fn().mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: mockStoredProfile, 
              error: null 
            })
          })
        })
      });

      (supabase.from as jest.Mock) = mockFrom;

      const response = await request(app)
        .post('/api/character-analysis')
        .send({ userId: 'user-123', responses: mockResponses });

      expect(response.status).toBe(201);
      expect(response.body.profile).toEqual(mockStoredProfile);
    });

    it('should handle AI service errors', async () => {
      const mockResponses = [
        { question: 'How do you prefer to learn?', response: 'I like hands-on practice' }
      ];

      // Mock AI service to throw error
      mockConductAnalysis.mockRejectedValue(new Error('AI service unavailable'));

      const response = await request(app)
        .post('/api/character-analysis')
        .send({ userId: 'user-123', responses: mockResponses });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to conduct character analysis');
    });

    it('should handle database errors', async () => {
      const mockResponses = [
        { question: 'How do you prefer to learn?', response: 'I like hands-on practice' }
      ];

      const mockProfile = {
        tone_type: 'casual',
        confidence_level: 'medium',
        motivation_index: 75
      };

      // Mock AI service
      mockConductAnalysis.mockResolvedValue(mockProfile);

      // Mock database to throw error
      const mockFrom = jest.fn().mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Database error' } 
            })
          })
        })
      });

      (supabase.from as jest.Mock) = mockFrom;

      const response = await request(app)
        .post('/api/character-analysis')
        .send({ userId: 'user-123', responses: mockResponses });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to conduct character analysis');
    });
  });
});
