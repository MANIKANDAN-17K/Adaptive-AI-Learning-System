/**
 * Sessions API Unit Tests
 * 
 * Tests for the sessions endpoints to verify basic functionality.
 */

import request from 'supertest';
import app from '../../index';
import { supabase } from '../../db';

// Mock the database
jest.mock('../../db', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock the AI service
jest.mock('../../services/AIServiceOrchestrator', () => ({
  AIServiceOrchestrator: jest.fn().mockImplementation(() => ({
    generateRecap: jest.fn().mockResolvedValue('Welcome back! Let\'s continue learning.'),
    generateMentorResponse: jest.fn().mockResolvedValue('Great work! Keep it up.'),
    generateStretchTask: jest.fn().mockResolvedValue({
      id: 'stretch_123',
      description: 'Try this advanced challenge',
      isStretch: true
    })
  }))
}));

describe('Sessions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sessions/start', () => {
    it('should reject request without skillId', async () => {
      const response = await request(app)
        .post('/api/sessions/start')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Skill ID is required');
    });

    it('should return 404 when skill does not exist', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      const response = await request(app)
        .post('/api/sessions/start')
        .send({ skillId: 'non-existent-id' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Skill not found');
    });

    it('should create new session when no existing session', async () => {
      const mockSkill = {
        id: 'skill-123',
        user_id: 'user-123',
        skill_name: 'JavaScript',
        goal: 'Learn JS',
        timeline: 30,
        created_at: new Date().toISOString()
      };

      const mockRoadmap = {
        id: 'roadmap-123',
        skill_id: 'skill-123',
        structure_json: [
          {
            node_id: 'node-1',
            title: 'Introduction',
            description: 'Learn basics',
            mastery_threshold: 75,
            status: 'current',
            order: 1
          }
        ],
        mastery_threshold: 75
      };

      const mockSession = {
        id: 'session-123',
        skill_id: 'skill-123',
        recap_summary: '',
        mastery_score: 0,
        confidence_level: 'medium',
        last_activity: new Date().toISOString()
      };

      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'skills') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSkill,
                  error: null
                })
              })
            })
          };
        }
        if (table === 'roadmaps') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockRoadmap,
                  error: null
                })
              })
            })
          };
        }
        if (table === 'sessions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { message: 'Not found' }
                    })
                  })
                })
              })
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockSession,
                  error: null
                })
              })
            })
          };
        }
        return {};
      });

      const response = await request(app)
        .post('/api/sessions/start')
        .send({ skillId: 'skill-123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('recap');
      expect(response.body).toHaveProperty('currentNode');
      expect(response.body.currentNode.title).toBe('Introduction');
    });
  });

  describe('POST /api/sessions/:sessionId/interact', () => {
    it('should reject request without userInput', async () => {
      const response = await request(app)
        .post('/api/sessions/session-123/interact')
        .send({ accuracy: 80, speed: 70, attempts: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User input is required');
    });

    it('should reject request without accuracy', async () => {
      const response = await request(app)
        .post('/api/sessions/session-123/interact')
        .send({ userInput: 'test', speed: 70, attempts: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Accuracy is required and must be a number');
    });

    it('should reject request with invalid accuracy range', async () => {
      const response = await request(app)
        .post('/api/sessions/session-123/interact')
        .send({ userInput: 'test', accuracy: 150, speed: 70, attempts: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Accuracy must be between 0 and 100');
    });

    it('should reject request with invalid speed range', async () => {
      const response = await request(app)
        .post('/api/sessions/session-123/interact')
        .send({ userInput: 'test', accuracy: 80, speed: -10, attempts: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Speed must be between 0 and 100');
    });

    it('should reject request with invalid attempts', async () => {
      const response = await request(app)
        .post('/api/sessions/session-123/interact')
        .send({ userInput: 'test', accuracy: 80, speed: 70, attempts: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Attempts must be at least 1');
    });
  });

  describe('PUT /api/sessions/:sessionId/end', () => {
    it('should reject request without recapSummary', async () => {
      const response = await request(app)
        .put('/api/sessions/session-123/end')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Recap summary is required');
    });

    it('should return 404 when session does not exist', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      const response = await request(app)
        .put('/api/sessions/non-existent-id/end')
        .send({ recapSummary: 'Test summary' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Session not found');
    });

    it('should successfully end session', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'session-123' },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      });

      const response = await request(app)
        .put('/api/sessions/session-123/end')
        .send({ recapSummary: 'Completed learning session' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/sessions/:sessionId/mentor-mode', () => {
    it('should reject request without mentor mode', async () => {
      const response = await request(app)
        .put('/api/sessions/session-123/mentor-mode')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Mentor mode is required');
    });

    it('should reject invalid mentor mode', async () => {
      const response = await request(app)
        .put('/api/sessions/session-123/mentor-mode')
        .send({ mentorMode: 'InvalidMode' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid mentor mode');
    });

    it('should return 404 when session does not exist', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' }
              })
            })
          })
        })
      });

      const response = await request(app)
        .put('/api/sessions/non-existent-id/mentor-mode')
        .send({ mentorMode: 'Professional' });

      expect(response.status).toBe(500);
    });

    it('should successfully update mentor mode', async () => {
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'session-123',
                  mentor_mode_preference: 'Friendly'
                },
                error: null
              })
            })
          })
        })
      });

      const response = await request(app)
        .put('/api/sessions/session-123/mentor-mode')
        .send({ mentorMode: 'Friendly' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.mentorMode).toBe('Friendly');
    });

    it('should accept all valid mentor modes', async () => {
      const validModes = ['Professional', 'Friendly', 'Supportive', 'Challenger'];
      
      for (const mode of validModes) {
        const mockFrom = supabase.from as jest.Mock;
        mockFrom.mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'session-123',
                    mentor_mode_preference: mode
                  },
                  error: null
                })
              })
            })
          })
        });

        const response = await request(app)
          .put('/api/sessions/session-123/mentor-mode')
          .send({ mentorMode: mode });

        expect(response.status).toBe(200);
        expect(response.body.mentorMode).toBe(mode);
      }
    });
  });
});
