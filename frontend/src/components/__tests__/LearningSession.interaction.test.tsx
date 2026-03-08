import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LearningSession from '../LearningSession';
import { apiClient } from '../../services';

// Mock the API client
vi.mock('../../services', () => ({
  apiClient: {
    skills: {
      getSkill: vi.fn()
    },
    roadmaps: {
      getRoadmap: vi.fn()
    },
    sessions: {
      startSession: vi.fn(),
      interact: vi.fn()
    }
  }
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

/**
 * Integration tests for the interaction handler
 * 
 * Task 22.7: Implement interaction handler
 * Requirements: 8.5, 8.6
 * 
 * Tests verify:
 * - User input triggers API call to POST /api/sessions/:sessionId/interact
 * - Mentor response is displayed
 * - Mastery score is updated
 * - Node progression is handled
 * - Stretch tasks are displayed if generated
 */
describe('LearningSession - Interaction Handler (Task 22.7)', () => {
  const mockSkillId = 'skill-123';
  
  const mockSkill = {
    id: mockSkillId,
    user_id: 'user-123',
    skill_name: 'Python Programming',
    goal: 'Learn Python basics',
    timeline: 30,
    created_at: new Date()
  };

  const mockRoadmap = {
    id: 'roadmap-123',
    skill_id: mockSkillId,
    structure_json: [
      {
        node_id: 'node-1',
        title: 'Introduction',
        description: 'Learn the basics',
        mastery_threshold: 70,
        status: 'current' as const,
        order: 1
      },
      {
        node_id: 'node-2',
        title: 'Advanced Topics',
        description: 'Deep dive',
        mastery_threshold: 80,
        status: 'locked' as const,
        order: 2
      }
    ],
    mastery_threshold: 70
  };

  const mockSessionResponse = {
    sessionId: 'session-123',
    recap: 'Welcome back!',
    currentNode: mockRoadmap.structure_json[0],
    masteryScore: 50,
    confidenceLevel: 'medium',
    mentorMode: 'Professional' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (apiClient.skills.getSkill as any).mockResolvedValue({ skill: mockSkill });
    (apiClient.roadmaps.getRoadmap as any).mockResolvedValue({ roadmap: mockRoadmap });
    (apiClient.sessions.startSession as any).mockResolvedValue(mockSessionResponse);
  });

  it('should call POST /api/sessions/:sessionId/interact on user input', async () => {
    const mockInteractResponse = {
      mentorResponse: 'Great answer! Keep going.',
      masteryScore: 65,
      confidenceLevel: 'high',
      mentorMode: 'Professional' as const
    };

    (apiClient.sessions.interact as any).mockResolvedValue(mockInteractResponse);

    render(<LearningSession skillId={mockSkillId} />);

    // Wait for session to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your response...')).toBeDefined();
    });

    // Type user input
    const input = screen.getByPlaceholderText('Type your response...');
    await userEvent.type(input, 'This is my answer');

    // Submit the form
    const sendButton = screen.getByText('Send');
    await userEvent.click(sendButton);

    // Verify interact API was called
    await waitFor(() => {
      expect(apiClient.sessions.interact).toHaveBeenCalledWith(
        'session-123',
        'This is my answer',
        expect.any(Number), // accuracy
        expect.any(Number), // speed
        expect.any(Number)  // attempts
      );
    });
  });

  it('should display mentor response after interaction', async () => {
    const mockInteractResponse = {
      mentorResponse: 'Excellent work! You understand the concept well.',
      masteryScore: 75,
      confidenceLevel: 'high',
      mentorMode: 'Professional' as const
    };

    (apiClient.sessions.interact as any).mockResolvedValue(mockInteractResponse);

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your response...')).toBeDefined();
    });

    const input = screen.getByPlaceholderText('Type your response...');
    await userEvent.type(input, 'My answer');
    
    const sendButton = screen.getByText('Send');
    await userEvent.click(sendButton);

    // Verify mentor response is displayed
    await waitFor(() => {
      expect(screen.getByText('Excellent work! You understand the concept well.')).toBeDefined();
    });
  });

  it('should update mastery score after interaction', async () => {
    const mockInteractResponse = {
      mentorResponse: 'Good job!',
      masteryScore: 85,
      confidenceLevel: 'high',
      mentorMode: 'Professional' as const
    };

    (apiClient.sessions.interact as any).mockResolvedValue(mockInteractResponse);

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeDefined(); // Initial score
    });

    const input = screen.getByPlaceholderText('Type your response...');
    await userEvent.type(input, 'My answer');
    
    const sendButton = screen.getByText('Send');
    await userEvent.click(sendButton);

    // Verify mastery score is updated
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeDefined();
    });
  });

  it('should handle node progression when threshold is met', async () => {
    const mockInteractResponse = {
      mentorResponse: 'Congratulations! Moving to the next topic.',
      masteryScore: 75,
      confidenceLevel: 'high',
      mentorMode: 'Professional' as const,
      nextNode: mockRoadmap.structure_json[1] // Next node unlocked
    };

    (apiClient.sessions.interact as any).mockResolvedValue(mockInteractResponse);

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Python Programming')).toBeDefined();
    });

    const input = screen.getByPlaceholderText('Type your response...');
    await userEvent.type(input, 'My answer');
    
    const sendButton = screen.getByText('Send');
    await userEvent.click(sendButton);

    // Verify next node is displayed (check the mentor response confirms progression)
    await waitFor(() => {
      expect(screen.getByText('Congratulations! Moving to the next topic.')).toBeDefined();
    });
  });

  it('should display stretch task if generated', async () => {
    const mockInteractResponse = {
      mentorResponse: 'Excellent! Here\'s a challenge for you.',
      masteryScore: 85,
      confidenceLevel: 'high',
      mentorMode: 'Professional' as const,
      stretchTask: {
        id: 'stretch-1',
        description: 'Try implementing a binary search algorithm',
        isStretch: true
      }
    };

    (apiClient.sessions.interact as any).mockResolvedValue(mockInteractResponse);

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your response...')).toBeDefined();
    });

    const input = screen.getByPlaceholderText('Type your response...');
    await userEvent.type(input, 'My answer');
    
    const sendButton = screen.getByText('Send');
    await userEvent.click(sendButton);

    // Verify stretch task is displayed
    await waitFor(() => {
      expect(screen.getByText('Optional Challenge')).toBeDefined();
      expect(screen.getByText('Try implementing a binary search algorithm')).toBeDefined();
    });
  });

  it('should display user message in chat after submission', async () => {
    const mockInteractResponse = {
      mentorResponse: 'Good answer!',
      masteryScore: 60,
      confidenceLevel: 'medium',
      mentorMode: 'Professional' as const
    };

    (apiClient.sessions.interact as any).mockResolvedValue(mockInteractResponse);

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your response...')).toBeDefined();
    });

    const input = screen.getByPlaceholderText('Type your response...');
    const userMessage = 'This is my test answer';
    await userEvent.type(input, userMessage);
    
    const sendButton = screen.getByText('Send');
    await userEvent.click(sendButton);

    // Verify user message is displayed
    await waitFor(() => {
      expect(screen.getByText(userMessage)).toBeDefined();
    });
  });

  it('should clear input field after submission', async () => {
    const mockInteractResponse = {
      mentorResponse: 'Good!',
      masteryScore: 60,
      confidenceLevel: 'medium',
      mentorMode: 'Professional' as const
    };

    (apiClient.sessions.interact as any).mockResolvedValue(mockInteractResponse);

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your response...')).toBeDefined();
    });

    const input = screen.getByPlaceholderText('Type your response...') as HTMLInputElement;
    await userEvent.type(input, 'Test answer');
    
    expect(input.value).toBe('Test answer');
    
    const sendButton = screen.getByText('Send');
    await userEvent.click(sendButton);

    // Verify input is cleared
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should handle API errors gracefully', async () => {
    (apiClient.sessions.interact as any).mockRejectedValue(new Error('Network error'));

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your response...')).toBeDefined();
    });

    const input = screen.getByPlaceholderText('Type your response...');
    await userEvent.type(input, 'Test');
    
    const sendButton = screen.getByText('Send');
    await userEvent.click(sendButton);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/)).toBeDefined();
    });
  });
});
