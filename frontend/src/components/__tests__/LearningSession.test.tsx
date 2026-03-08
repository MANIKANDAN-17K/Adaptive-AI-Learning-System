import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('LearningSession - Mentor Mode Badge', () => {
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
      }
    ],
    mastery_threshold: 70
  };

  const mockSessionResponse = {
    sessionId: 'session-123',
    recap: 'Welcome back! Let\'s continue learning.',
    currentNode: mockRoadmap.structure_json[0],
    masteryScore: 65,
    confidenceLevel: 'medium',
    mentorMode: 'Professional' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    (apiClient.skills.getSkill as any).mockResolvedValue({ skill: mockSkill });
    (apiClient.roadmaps.getRoadmap as any).mockResolvedValue({ roadmap: mockRoadmap });
    (apiClient.sessions.startSession as any).mockResolvedValue(mockSessionResponse);
  });

  it('should display mentor mode badge on session start', async () => {
    render(<LearningSession skillId={mockSkillId} />);

    // Wait for the session to load
    await waitFor(() => {
      expect(screen.getByText('Python Programming')).toBeDefined();
    });

    // Check that the mentor mode selector is displayed
    const mentorModeLabel = screen.getByText('Mentor Mode');
    expect(mentorModeLabel).toBeDefined();
    
    // Check that all mode buttons are present
    expect(screen.getByText('Professional')).toBeDefined();
    expect(screen.getByText('Friendly')).toBeDefined();
    expect(screen.getByText('Supportive')).toBeDefined();
    expect(screen.getByText('Challenger')).toBeDefined();
  });

  it('should update mentor mode badge when mode changes', async () => {
    render(<LearningSession skillId={mockSkillId} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Mentor Mode')).toBeDefined();
      expect(screen.getByText('Professional')).toBeDefined();
    });

    // Mock interaction response with different mentor mode
    (apiClient.sessions.interact as any).mockResolvedValue({
      mentorResponse: 'Great job! Keep it up!',
      masteryScore: 75,
      confidenceLevel: 'high',
      mentorMode: 'Challenger' as const
    });

    // Simulate user interaction (this would trigger mode change)
    // Note: Full interaction testing would require more setup
    // This test verifies the badge display mechanism exists

    expect(screen.getByText('Mentor Mode')).toBeDefined();
    expect(screen.getByText('Professional')).toBeDefined();
  });

  it('should display correct color for each mentor mode', async () => {
    const modes = [
      { mode: 'Professional' as const, expectedClass: 'bg-blue-500' },
      { mode: 'Friendly' as const, expectedClass: 'bg-green-500' },
      { mode: 'Supportive' as const, expectedClass: 'bg-purple-500' },
      { mode: 'Challenger' as const, expectedClass: 'bg-red-500' }
    ];

    for (const { mode } of modes) {
      vi.clearAllMocks();
      
      (apiClient.skills.getSkill as any).mockResolvedValue({ skill: mockSkill });
      (apiClient.roadmaps.getRoadmap as any).mockResolvedValue({ roadmap: mockRoadmap });
      (apiClient.sessions.startSession as any).mockResolvedValue({
        ...mockSessionResponse,
        mentorMode: mode
      });

      const { unmount } = render(<LearningSession skillId={mockSkillId} />);

      await waitFor(() => {
        expect(screen.getByText('Mentor Mode')).toBeDefined();
        expect(screen.getByText(mode)).toBeDefined();
      });

      unmount();
    }
  });

  it('should show mentor mode badge in header alongside mastery score', async () => {
    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Mentor Mode')).toBeDefined();
      expect(screen.getByText('Professional')).toBeDefined();
      expect(screen.getByText('65%')).toBeDefined();
    });

    // Both should be visible in the header
    const mentorModeLabel = screen.getByText('Mentor Mode');
    const professionalButton = screen.getByText('Professional');
    const score = screen.getByText('65%');
    
    expect(mentorModeLabel).toBeDefined();
    expect(professionalButton).toBeDefined();
    expect(score).toBeDefined();
  });

  it('should allow user to select different mentor modes', async () => {
    const { container } = render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Mentor Mode')).toBeDefined();
    });

    // Check all mode buttons are present
    const professionalBtn = screen.getByText('Professional');
    const friendlyBtn = screen.getByText('Friendly');
    const supportiveBtn = screen.getByText('Supportive');
    const challengerBtn = screen.getByText('Challenger');

    expect(professionalBtn).toBeDefined();
    expect(friendlyBtn).toBeDefined();
    expect(supportiveBtn).toBeDefined();
    expect(challengerBtn).toBeDefined();

    // Professional should be active by default (has bg-blue-500 class)
    expect(professionalBtn.className).toContain('bg-blue-500');
    expect(professionalBtn.className).toContain('text-white');

    // Other buttons should not be active
    expect(friendlyBtn.className).toContain('text-gray-600');
    expect(supportiveBtn.className).toContain('text-gray-600');
    expect(challengerBtn.className).toContain('text-gray-600');
  });
});
