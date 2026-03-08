/**
 * Frontend API Client Service
 * 
 * Provides methods for all backend API endpoints with:
 * - Authentication token management
 * - Request/response interceptors for error handling
 * - Type-safe API calls
 */

import { 
  User, 
  Skill, 
  PersonalityProfile, 
  Roadmap, 
  RoadmapNode, 
  Session,
  Task,
  MentorMode 
} from '../types';

// API base URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Token storage key
const TOKEN_KEY = 'auth_token';

/**
 * API Error class for structured error handling
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Token Management
 */
export const tokenManager = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  hasToken(): boolean {
    return !!this.getToken();
  }
};

/**
 * Request interceptor - adds authentication token and handles request formatting
 */
function buildRequestOptions(
  method: string,
  body?: any,
  requiresAuth: boolean = true
): RequestInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  // Add authentication token if required
  if (requiresAuth) {
    const token = tokenManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const options: RequestInit = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
}

/**
 * Response interceptor - handles errors and parses responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      throw new APIError(
        'Server error',
        response.status
      );
    }
    return {} as T;
  }

  const data = await response.json();

  // Handle error responses
  if (!response.ok) {
    const errorMessage = data.error || data.message || 'An error occurred';
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear invalid token
      tokenManager.clearToken();
      
      // Dispatch custom event for global auth error handling
      window.dispatchEvent(new CustomEvent('auth:unauthorized', {
        detail: { message: errorMessage }
      }));
    }
    
    throw new APIError(
      errorMessage,
      response.status,
      data
    );
  }

  return data as T;
}

/**
 * Generic API request function
 */
async function apiRequest<T>(
  endpoint: string,
  method: string,
  body?: any,
  requiresAuth: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = buildRequestOptions(method, body, requiresAuth);

  try {
    const response = await fetch(url, options);
    return await handleResponse<T>(response);
  } catch (error) {
    // Re-throw APIError as-is
    if (error instanceof APIError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new APIError(
        'Network error - please check your connection',
        0
      );
    }

    // Handle unknown errors
    throw new APIError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      500
    );
  }
}

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Register a new user account
   */
  async register(name: string, email: string, password: string): Promise<{
    userId: string;
    token: string;
    user: User;
  }> {
    const response = await apiRequest<{
      userId: string;
      token: string;
      user: User;
    }>(
      '/auth/register',
      'POST',
      { name, email, password },
      false // No auth required for registration
    );

    // Store token
    tokenManager.setToken(response.token);

    return response;
  },

  /**
   * Login with existing credentials
   */
  async login(email: string, password: string): Promise<{
    userId: string;
    token: string;
    user: User;
  }> {
    const response = await apiRequest<{
      userId: string;
      token: string;
      user: User;
    }>(
      '/auth/login',
      'POST',
      { email, password },
      false // No auth required for login
    );

    // Store token
    tokenManager.setToken(response.token);

    return response;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<{ user: User }> {
    return await apiRequest<{ user: User }>(
      '/auth/profile',
      'GET'
    );
  },

  /**
   * Logout - clears token
   */
  logout(): void {
    tokenManager.clearToken();
  }
};

/**
 * Skills API
 */
export const skillsAPI = {
  /**
   * Create a new skill
   */
  async createSkill(
    skillName: string,
    goal: string,
    timeline: number
  ): Promise<{
    skill: Skill;
    needsCharacterAnalysis: boolean;
  }> {
    return await apiRequest<{
      skill: Skill;
      needsCharacterAnalysis: boolean;
    }>(
      '/skills',
      'POST',
      { skillName, goal, timeline }
    );
  },

  /**
   * Get all skills for a user
   */
  async getUserSkills(userId: string): Promise<{
    skills: Array<Skill & {
      progressPercentage: number;
      masteryLevel: number;
      lastSessionDate: string;
    }>;
  }> {
    return await apiRequest<{
      skills: Array<Skill & {
        progressPercentage: number;
        masteryLevel: number;
        lastSessionDate: string;
      }>;
    }>(
      `/skills/${userId}`,
      'GET'
    );
  },

  /**
   * Get a specific skill with its roadmap
   */
  async getSkill(skillId: string): Promise<{
    skill: Skill;
    roadmap: Roadmap | null;
  }> {
    return await apiRequest<{
      skill: Skill;
      roadmap: Roadmap | null;
    }>(
      `/skills/skill/${skillId}`,
      'GET'
    );
  }
};

/**
 * Character Analysis API
 */
export const characterAnalysisAPI = {
  /**
   * Get personality profile for a user
   */
  async getProfile(userId: string): Promise<{
    profile: PersonalityProfile | null;
  }> {
    return await apiRequest<{
      profile: PersonalityProfile | null;
    }>(
      `/character-analysis/${userId}`,
      'GET'
    );
  },

  /**
   * Conduct character analysis
   */
  async conductAnalysis(
    userId: string,
    responses: Array<{ question: string; response: string }>
  ): Promise<{
    profile: PersonalityProfile;
  }> {
    return await apiRequest<{
      profile: PersonalityProfile;
    }>(
      '/character-analysis',
      'POST',
      { userId, responses }
    );
  }
};

/**
 * Roadmaps API
 */
export const roadmapsAPI = {
  /**
   * Generate a new roadmap for a skill
   */
  async generateRoadmap(
    skillId: string,
    skillName: string,
    goal: string,
    timeline: number,
    profile: PersonalityProfile
  ): Promise<{
    roadmapId: string;
    structure: RoadmapNode[];
  }> {
    return await apiRequest<{
      roadmapId: string;
      structure: RoadmapNode[];
    }>(
      '/roadmaps/generate',
      'POST',
      { skillId, skillName, goal, timeline, profile }
    );
  },

  /**
   * Get roadmap for a skill
   */
  async getRoadmap(skillId: string): Promise<{
    roadmap: Roadmap;
  }> {
    return await apiRequest<{
      roadmap: Roadmap;
    }>(
      `/roadmaps/${skillId}`,
      'GET'
    );
  }
};

/**
 * Sessions API
 */
export const sessionsAPI = {
  /**
   * Start or resume a learning session
   */
  async startSession(skillId: string): Promise<{
    sessionId: string;
    recap: string;
    currentNode: RoadmapNode;
    masteryScore: number;
    confidenceLevel: string;
    mentorMode: MentorMode;
  }> {
    return await apiRequest<{
      sessionId: string;
      recap: string;
      currentNode: RoadmapNode;
      masteryScore: number;
      confidenceLevel: string;
      mentorMode: MentorMode;
    }>(
      '/sessions/start',
      'POST',
      { skillId }
    );
  },

  /**
   * Interact with the AI mentor during a session
   */
  async interact(
    sessionId: string,
    userInput: string,
    accuracy: number,
    speed: number,
    attempts: number
  ): Promise<{
    mentorResponse: string;
    masteryScore: number;
    confidenceLevel: string;
    mentorMode: MentorMode;
    nextNode?: RoadmapNode;
    stretchTask?: Task;
  }> {
    return await apiRequest<{
      mentorResponse: string;
      masteryScore: number;
      confidenceLevel: string;
      mentorMode: MentorMode;
      nextNode?: RoadmapNode;
      stretchTask?: Task;
    }>(
      `/sessions/${sessionId}/interact`,
      'POST',
      { userInput, accuracy, speed, attempts }
    );
  },

  /**
   * End a learning session
   */
  async endSession(
    sessionId: string,
    recapSummary: string
  ): Promise<{
    success: boolean;
  }> {
    return await apiRequest<{
      success: boolean;
    }>(
      `/sessions/${sessionId}/end`,
      'PUT',
      { recapSummary }
    );
  },

  /**
   * Update mentor mode preference for a session
   */
  async updateMentorMode(
    sessionId: string,
    mentorMode: MentorMode
  ): Promise<{
    success: boolean;
    mentorMode: MentorMode;
  }> {
    return await apiRequest<{
      success: boolean;
      mentorMode: MentorMode;
    }>(
      `/sessions/${sessionId}/mentor-mode`,
      'PUT',
      { mentorMode }
    );
  }
};

/**
 * Export a unified API client object
 */
export const apiClient = {
  auth: authAPI,
  skills: skillsAPI,
  characterAnalysis: characterAnalysisAPI,
  roadmaps: roadmapsAPI,
  sessions: sessionsAPI,
  tokenManager
};

export default apiClient;
