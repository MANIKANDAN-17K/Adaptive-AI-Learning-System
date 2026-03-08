/**
 * Roadmap API Routes Tests
 * 
 * Tests for roadmap generation and retrieval endpoints.
 */

import request from 'supertest';
import express from 'express';

// Mock the database before importing anything else
jest.mock('../../db', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock the AIServiceOrchestrator with a proper mock implementation
const mockGenerateRoadmap = jest.fn();
jest.mock('../../services/AIServiceOrchestrator', () => {
  return {
    AIServiceOrchestrator: jest.fn().mockImplementation(() => {
      return {
        generateRoadmap: mockGenerateRoadmap
      };
    })
  };
});

import roadmapsRoutes from '../roadmaps';
import { supabase } from '../../db';

// Create a test app without starting the server
const app = express();
app.use(express.json());
app.use('/api/roadmaps', roadmapsRoutes);

describe('Roadmap API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/roadmaps/generate', () => {
    it('should reject request without skillId', async () => {
      const response = await request(app)
        .post('/api/roadmaps/generate')
        .send({
          skillName: 'TypeScript',
          goal: 'Learn TypeScript',
          timeline: 30,
          profile: { user_id: 'user-1', tone_type: 'casual', confidence_level: 'medium', motivation_index: 75 }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Skill ID is required');
    });

    it('should reject request without skillName', async () => {
      const response = await request(app)
        .post('/api/roadmaps/generate')
        .send({
          skillId: 'skill-1',
          goal: 'Learn TypeScript',
          timeline: 30,
          profile: { user_id: 'user-1', tone_type: 'casual', confidence_level: 'medium', motivation_index: 75 }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Skill name is required');
    });

    it('should reject request without goal', async () => {
      const response = await request(app)
        .post('/api/roadmaps/generate')
        .send({
          skillId: 'skill-1',
          skillName: 'TypeScript',
          timeline: 30,
          profile: { user_id: 'user-1', tone_type: 'casual', confidence_level: 'medium', motivation_index: 75 }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Goal is required');
    });

    it('should reject request without timeline', async () => {
      const response = await request(app)
        .post('/api/roadmaps/generate')
        .send({
          skillId: 'skill-1',
          skillName: 'TypeScript',
          goal: 'Learn TypeScript',
          profile: { user_id: 'user-1', tone_type: 'casual', confidence_level: 'medium', motivation_index: 75 }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Timeline is required');
    });

    it('should reject request without profile', async () => {
      const response = await request(app)
        .post('/api/roadmaps/generate')
        .send({
          skillId: 'skill-1',
          skillName: 'TypeScript',
          goal: 'Learn TypeScript',
          timeline: 30
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Personality profile is required');
    });

    it('should return 404 when skill does not exist', async () => {
      // Mock Supabase to return no skill
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      });
      (supabase.from as jest.Mock) = mockFrom;

      const response = await request(app)
        .post('/api/roadmaps/generate')
        .send({
          skillId: 'non-existent-skill',
          skillName: 'TypeScript',
          goal: 'Learn TypeScript',
          timeline: 30,
          profile: { user_id: 'user-1', tone_type: 'casual', confidence_level: 'medium', motivation_index: 75 }
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Skill not found');
    });

    it('should return 409 when roadmap already exists', async () => {
      // Mock Supabase to return existing skill and roadmap
      const mockFrom = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'skill-1' }, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'roadmap-1' }, error: null })
            })
          })
        });
      (supabase.from as jest.Mock) = mockFrom;

      const response = await request(app)
        .post('/api/roadmaps/generate')
        .send({
          skillId: 'skill-1',
          skillName: 'TypeScript',
          goal: 'Learn TypeScript',
          timeline: 30,
          profile: { user_id: 'user-1', tone_type: 'casual', confidence_level: 'medium', motivation_index: 75 }
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Roadmap already exists for this skill');
    });

    it('should successfully generate and store roadmap', async () => {
      const mockRoadmapNodes = [
        {
          node_id: 'node-1',
          title: 'Introduction',
          description: 'Learn the basics',
          mastery_threshold: 75,
          status: 'locked',
          order: 1
        },
        {
          node_id: 'node-2',
          title: 'Advanced Topics',
          description: 'Deep dive',
          mastery_threshold: 80,
          status: 'locked',
          order: 2
        }
      ];

      // Set up the mock to return our test data
      mockGenerateRoadmap.mockResolvedValue(mockRoadmapNodes);

      // Mock Supabase
      const mockFrom = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'skill-1' }, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'roadmap-1',
                  skill_id: 'skill-1',
                  structure_json: [
                    { ...mockRoadmapNodes[0], status: 'current' },
                    { ...mockRoadmapNodes[1], status: 'locked' }
                  ],
                  mastery_threshold: 77.5
                },
                error: null
              })
            })
          })
        });
      (supabase.from as jest.Mock) = mockFrom;

      const response = await request(app)
        .post('/api/roadmaps/generate')
        .send({
          skillId: 'skill-1',
          skillName: 'TypeScript',
          goal: 'Learn TypeScript',
          timeline: 30,
          profile: { user_id: 'user-1', tone_type: 'casual', confidence_level: 'medium', motivation_index: 75 }
        });

      expect(response.status).toBe(201);
      expect(response.body.roadmapId).toBe('roadmap-1');
      expect(response.body.structure).toHaveLength(2);
      expect(response.body.structure[0].status).toBe('current');
      expect(response.body.structure[1].status).toBe('locked');
      expect(mockGenerateRoadmap).toHaveBeenCalledWith(
        'TypeScript',
        'Learn TypeScript',
        30,
        { user_id: 'user-1', tone_type: 'casual', confidence_level: 'medium', motivation_index: 75 }
      );
    });
  });

  describe('GET /api/roadmaps/:skillId', () => {
    it('should reject request without skillId', async () => {
      const response = await request(app)
        .get('/api/roadmaps/');

      expect(response.status).toBe(404);
    });

    it('should return 404 when roadmap does not exist', async () => {
      // Mock Supabase to return no roadmap
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      });
      (supabase.from as jest.Mock) = mockFrom;

      const response = await request(app)
        .get('/api/roadmaps/non-existent-skill');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Roadmap not found');
    });

    it('should successfully retrieve roadmap', async () => {
      const mockRoadmap = {
        id: 'roadmap-1',
        skill_id: 'skill-1',
        structure_json: [
          {
            node_id: 'node-1',
            title: 'Introduction',
            description: 'Learn the basics',
            mastery_threshold: 75,
            status: 'current',
            order: 1
          }
        ],
        mastery_threshold: 75
      };

      // Mock Supabase
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRoadmap, error: null })
          })
        })
      });
      (supabase.from as jest.Mock) = mockFrom;

      const response = await request(app)
        .get('/api/roadmaps/skill-1');

      expect(response.status).toBe(200);
      expect(response.body.roadmap).toEqual(mockRoadmap);
    });
  });
});
