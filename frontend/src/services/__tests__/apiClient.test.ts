/**
 * API Client Tests
 * 
 * Tests for the frontend API client service including:
 * - Token management
 * - Request/response interceptors
 * - Error handling
 * - All API endpoint methods
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  apiClient, 
  tokenManager, 
  APIError,
  authAPI,
  skillsAPI,
  characterAnalysisAPI,
  roadmapsAPI,
  sessionsAPI
} from '../apiClient';

// Mock fetch globally
global.fetch = vi.fn();

describe('Token Manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store and retrieve tokens', () => {
    const token = 'test-token-123';
    tokenManager.setToken(token);
    expect(tokenManager.getToken()).toBe(token);
    expect(tokenManager.hasToken()).toBe(true);
  });

  it('should clear tokens', () => {
    tokenManager.setToken('test-token');
    tokenManager.clearToken();
    expect(tokenManager.getToken()).toBeNull();
    expect(tokenManager.hasToken()).toBe(false);
  });

  it('should return null for non-existent token', () => {
    expect(tokenManager.getToken()).toBeNull();
    expect(tokenManager.hasToken()).toBe(false);
  });
});

describe('API Error', () => {
  it('should create error with message and status code', () => {
    const error = new APIError('Test error', 400);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('APIError');
  });

  it('should include optional details', () => {
    const details = { field: 'email', reason: 'invalid' };
    const error = new APIError('Validation error', 400, details);
    expect(error.details).toEqual(details);
  });
});

describe('Authentication API', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and store token', async () => {
      const mockResponse = {
        userId: 'user-123',
        token: 'jwt-token-abc',
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          created_at: new Date()
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const result = await authAPI.register('Test User', 'test@example.com', 'password123');

      expect(result).toEqual(mockResponse);
      expect(tokenManager.getToken()).toBe('jwt-token-abc');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );
    });

    it('should throw APIError on registration failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'User already exists' })
      });

      await expect(
        authAPI.register('Test', 'test@example.com', 'pass')
      ).rejects.toThrow(APIError);
    });
  });

  describe('login', () => {
    it('should login and store token', async () => {
      const mockResponse = {
        userId: 'user-123',
        token: 'jwt-token-xyz',
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          created_at: new Date()
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const result = await authAPI.login('test@example.com', 'password123');

      expect(result).toEqual(mockResponse);
      expect(tokenManager.getToken()).toBe('jwt-token-xyz');
    });

    it('should throw APIError on invalid credentials', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Invalid email or password' })
      });

      await expect(
        authAPI.login('wrong@example.com', 'wrongpass')
      ).rejects.toThrow(APIError);
    });
  });

  describe('getProfile', () => {
    it('should get user profile with auth token', async () => {
      tokenManager.setToken('valid-token');

      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date()
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ user: mockUser })
      });

      const result = await authAPI.getProfile();

      expect(result.user).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/profile'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          })
        })
      );
    });
  });

  describe('logout', () => {
    it('should clear token', () => {
      tokenManager.setToken('test-token');
      authAPI.logout();
      expect(tokenManager.getToken()).toBeNull();
    });
  });
});

describe('Skills API', () => {
  beforeEach(() => {
    tokenManager.setToken('test-token');
    vi.clearAllMocks();
  });

  describe('createSkill', () => {
    it('should create a new skill', async () => {
      const mockResponse = {
        skill: {
          id: 'skill-123',
          user_id: 'user-123',
          skill_name: 'JavaScript',
          goal: 'Learn advanced JS',
          timeline: 30,
          created_at: new Date()
        },
        needsCharacterAnalysis: false
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const result = await skillsAPI.createSkill('JavaScript', 'Learn advanced JS', 30);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/skills'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            skillName: 'JavaScript',
            goal: 'Learn advanced JS',
            timeline: 30
          })
        })
      );
    });
  });

  describe('getUserSkills', () => {
    it('should get all skills for a user', async () => {
      const mockSkills = [
        {
          id: 'skill-1',
          user_id: 'user-123',
          skill_name: 'JavaScript',
          goal: 'Learn JS',
          timeline: 30,
          created_at: new Date(),
          progressPercentage: 50,
          masteryLevel: 75,
          lastSessionDate: new Date().toISOString()
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ skills: mockSkills })
      });

      const result = await skillsAPI.getUserSkills('user-123');

      expect(result.skills).toEqual(mockSkills);
    });
  });

  describe('getSkill', () => {
    it('should get a specific skill with roadmap', async () => {
      const mockResponse = {
        skill: {
          id: 'skill-123',
          user_id: 'user-123',
          skill_name: 'JavaScript',
          goal: 'Learn JS',
          timeline: 30,
          created_at: new Date()
        },
        roadmap: {
          id: 'roadmap-123',
          skill_id: 'skill-123',
          structure_json: [],
          mastery_threshold: 70
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const result = await skillsAPI.getSkill('skill-123');

      expect(result).toEqual(mockResponse);
    });
  });
});

describe('Character Analysis API', () => {
  beforeEach(() => {
    tokenManager.setToken('test-token');
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should get personality profile', async () => {
      const mockProfile = {
        user_id: 'user-123',
        tone_type: 'Friendly',
        confidence_level: 'high',
        motivation_index: 85
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ profile: mockProfile })
      });

      const result = await characterAnalysisAPI.getProfile('user-123');

      expect(result.profile).toEqual(mockProfile);
    });

    it('should return null for non-existent profile', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ profile: null })
      });

      const result = await characterAnalysisAPI.getProfile('user-123');

      expect(result.profile).toBeNull();
    });
  });

  describe('conductAnalysis', () => {
    it('should conduct character analysis', async () => {
      const responses = [
        { question: 'How do you learn?', response: 'By doing' }
      ];

      const mockProfile = {
        user_id: 'user-123',
        tone_type: 'Professional',
        confidence_level: 'medium',
        motivation_index: 70
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ profile: mockProfile })
      });

      const result = await characterAnalysisAPI.conductAnalysis('user-123', responses);

      expect(result.profile).toEqual(mockProfile);
    });
  });
});

describe('Roadmaps API', () => {
  beforeEach(() => {
    tokenManager.setToken('test-token');
    vi.clearAllMocks();
  });

  describe('generateRoadmap', () => {
    it('should generate a new roadmap', async () => {
      const profile = {
        user_id: 'user-123',
        tone_type: 'Friendly',
        confidence_level: 'high',
        motivation_index: 85
      };

      const mockResponse = {
        roadmapId: 'roadmap-123',
        structure: [
          {
            node_id: 'node-1',
            title: 'Introduction',
            description: 'Learn basics',
            mastery_threshold: 70,
            status: 'current' as const,
            order: 0
          }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const result = await roadmapsAPI.generateRoadmap(
        'skill-123',
        'JavaScript',
        'Learn JS',
        30,
        profile
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getRoadmap', () => {
    it('should get roadmap for a skill', async () => {
      const mockRoadmap = {
        id: 'roadmap-123',
        skill_id: 'skill-123',
        structure_json: [],
        mastery_threshold: 70
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ roadmap: mockRoadmap })
      });

      const result = await roadmapsAPI.getRoadmap('skill-123');

      expect(result.roadmap).toEqual(mockRoadmap);
    });
  });
});

describe('Sessions API', () => {
  beforeEach(() => {
    tokenManager.setToken('test-token');
    vi.clearAllMocks();
  });

  describe('startSession', () => {
    it('should start a new session', async () => {
      const mockResponse = {
        sessionId: 'session-123',
        recap: 'Welcome to your learning journey!',
        currentNode: {
          node_id: 'node-1',
          title: 'Introduction',
          description: 'Learn basics',
          mastery_threshold: 70,
          status: 'current' as const,
          order: 0
        },
        masteryScore: 0,
        confidenceLevel: 'medium'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const result = await sessionsAPI.startSession('skill-123');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('interact', () => {
    it('should send interaction and receive mentor response', async () => {
      const mockResponse = {
        mentorResponse: 'Great work!',
        masteryScore: 75,
        confidenceLevel: 'high',
        nextNode: undefined,
        stretchTask: undefined
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      });

      const result = await sessionsAPI.interact(
        'session-123',
        'My answer',
        80,
        90,
        1
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('endSession', () => {
    it('should end a session', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true })
      });

      const result = await sessionsAPI.endSession('session-123', 'Session summary');

      expect(result.success).toBe(true);
    });
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    tokenManager.setToken('test-token');
    vi.clearAllMocks();
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

    await expect(authAPI.getProfile()).rejects.toThrow(APIError);
    await expect(authAPI.getProfile()).rejects.toThrow('Network error');
  });

  it('should handle non-JSON responses', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'text/html' })
    });

    await expect(authAPI.getProfile()).rejects.toThrow(APIError);
  });

  it('should handle server errors with details', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        error: 'Validation failed',
        details: { field: 'email' }
      })
    });

    try {
      await authAPI.getProfile();
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(APIError);
      expect((error as APIError).statusCode).toBe(400);
      expect((error as APIError).details).toHaveProperty('error', 'Validation failed');
      expect((error as APIError).details).toHaveProperty('details');
    }
  });
});

describe('Unified API Client', () => {
  it('should export all API modules', () => {
    expect(apiClient.auth).toBeDefined();
    expect(apiClient.skills).toBeDefined();
    expect(apiClient.characterAnalysis).toBeDefined();
    expect(apiClient.roadmaps).toBeDefined();
    expect(apiClient.sessions).toBeDefined();
    expect(apiClient.tokenManager).toBeDefined();
  });
});
