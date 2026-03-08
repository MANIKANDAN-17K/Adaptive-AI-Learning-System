import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
 * Tests for Stretch Task Display
 * Requirements: 14.3, 14.4, 14.5
 * 
 * 14.3: Stretch tasks must be clearly marked as optional
 * 14.4: Completing stretch tasks records performance but doesn't block progression
 * 14.5: Skipping stretch tasks continues to next node without penalty
 */
describe('LearningSession - Stretch Task Display', () => {
  const mockSkillId = 'skill-123';
  
  const mockSkill = {
    id: mockSkillId,
    user_id: 'user-123',
    skill_name: 'Advanced JavaScript',
    goal: 'Master advanced concepts',
    timeline: 60,
    created_at: new Date()
  };

  const mockRoadmap = {
    id: 'roadmap-123',
    skill_id: mockSkillId,
    structure_json: [
      {
        node_id: 'node-1',
        title: 'Async Programming',
        description: 'Learn async/await patterns',
        mastery_threshold: 70,
        status: 'current' as const,
        order: 1
      },
      {
        node_id: 'node-2',
        title: 'Advanced Patterns',
        description: 'Design patterns in JS',
        mastery_threshold: 70,
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
    masteryScore: 85,
    confidenceLevel: 'high',
    mentorMode: 'Professional' as const
  };

  const mockStretchTask = {
    id: 'stretch-123',
    description: 'Implement a custom Promise.all() function that handles errors gracefully',
    isStretch: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    (apiClient.skills.getSkill as any).mockResolvedValue({ skill: mockSkill });
    (apiClient.roadmaps.getRoadmap as any).mockResolvedValue({ roadmap: mockRoadmap });
    (apiClient.sessions.startSession as any).mockResolvedValue(mockSessionResponse);
  });

  it('should display stretch task with optional marking when generated', async () => {
    // Mock interaction that returns a stretch task
    (apiClient.sessions.interact as any).mockResolvedValue({
      mentorResponse: 'Excellent work! Here\'s a challenge for you.',
      masteryScore: 85,
      confidenceLevel: 'high',
      mentorMode: 'Professional' as const,
      stretchTask: mockStretchTask
    });

    render(<LearningSession skillId={mockSkillId} />);

    // Wait for session to load
    await waitFor(() => {
      expect(screen.getByText('Advanced JavaScript')).toBeDefined();
    });

    // Submit a response to trigger stretch task generation
    const input = screen.getByPlaceholderText('Type your response...');
    const submitButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'My answer' } });
    fireEvent.click(submitButton);

    // Wait for stretch task to appear
    await waitFor(() => {
      // Check for "Optional Challenge" badge (Requirement 14.3)
      expect(screen.getByText('Optional Challenge')).toBeDefined();
      
      // Check for "Stretch Task" label
      expect(screen.getByText('Stretch Task')).toBeDefined();
      
      // Check for task description
      expect(screen.getByText(/Implement a custom Promise.all/)).toBeDefined();
      
      // Check for explanatory text about optional nature
      expect(screen.getByText(/optional advanced challenge/i)).toBeDefined();
    });
  });

  it('should provide skip action for stretch task', async () => {
    (apiClient.sessions.interact as any).mockResolvedValue({
      mentorResponse: 'Great job!',
      masteryScore: 85,
      confidenceLevel: 'high',
      mentorMode: 'Professional' as const,
      stretchTask: mockStretchTask
    });

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Advanced JavaScript')).toBeDefined();
    });

    // Trigger stretch task
    const input = screen.getByPlaceholderText('Type your response...');
    const submitButton = screen.getByText('Send');
    fireEvent.change(input, { target: { value: 'My answer' } });
    fireEvent.click(submitButton);

    // Wait for stretch task
    await waitFor(() => {
      expect(screen.getByText('Optional Challenge')).toBeDefined();
    });

    // Find and click skip button (Requirement 14.5)
    const skipButton = screen.getByText('Skip Challenge');
    expect(skipButton).toBeDefined();
    
    fireEvent.click(skipButton);

    // Stretch task should be removed
    await waitFor(() => {
      expect(screen.queryByText('Optional Challenge')).toBeNull();
    });
  });

  it('should provide attempt action for stretch task', async () => {
    (apiClient.sessions.interact as any).mockResolvedValue({
      mentorResponse: 'Great job!',
      masteryScore: 85,
      confidenceLevel: 'high',
      mentorMode: 'Professional' as const,
      stretchTask: mockStretchTask
    });

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Advanced JavaScript')).toBeDefined();
    });

    // Trigger stretch task
    const input = screen.getByPlaceholderText('Type your response...');
    const submitButton = screen.getByText('Send');
    fireEvent.change(input, { target: { value: 'My answer' } });
    fireEvent.click(submitButton);

    // Wait for stretch task
    await waitFor(() => {
      expect(screen.getByText('Optional Challenge')).toBeDefined();
    });

    // Find attempt button (Requirement 14.4)
    const attemptButton = screen.getByText('Attempt Challenge');
    expect(attemptButton).toBeDefined();
    
    // Clicking attempt should focus the input (allowing user to respond)
    fireEvent.click(attemptButton);
    
    // Input should still be available for user to type their attempt
    expect(screen.getByPlaceholderText('Type your response...')).toBeDefined();
  });

  it('should clearly indicate stretch task is optional and non-blocking', async () => {
    (apiClient.sessions.interact as any).mockResolvedValue({
      mentorResponse: 'Excellent!',
      masteryScore: 85,
      confidenceLevel: 'high',
      mentorMode: 'Professional' as const,
      stretchTask: mockStretchTask
    });

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Advanced JavaScript')).toBeDefined();
    });

    // Trigger stretch task
    const input = screen.getByPlaceholderText('Type your response...');
    const submitButton = screen.getByText('Send');
    fireEvent.change(input, { target: { value: 'My answer' } });
    fireEvent.click(submitButton);

    // Wait for stretch task
    await waitFor(() => {
      // Check for multiple indicators that it's optional (Requirement 14.3)
      expect(screen.getByText('Optional Challenge')).toBeDefined();
      
      // Check for explanatory text
      const explanatoryText = screen.getByText(/optional advanced challenge/i);
      expect(explanatoryText).toBeDefined();
      
      // Check that it mentions not affecting progress
      expect(screen.getByText(/without affecting your progress/i)).toBeDefined();
    });
  });

  it('should not display stretch task when not generated', async () => {
    // Mock interaction without stretch task
    (apiClient.sessions.interact as any).mockResolvedValue({
      mentorResponse: 'Good work!',
      masteryScore: 65,
      confidenceLevel: 'medium',
      mentorMode: 'Professional' as const
      // No stretchTask
    });

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Advanced JavaScript')).toBeDefined();
    });

    // Submit a response
    const input = screen.getByPlaceholderText('Type your response...');
    const submitButton = screen.getByText('Send');
    fireEvent.change(input, { target: { value: 'My answer' } });
    fireEvent.click(submitButton);

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Good work!')).toBeDefined();
    });

    // Stretch task should not appear
    expect(screen.queryByText('Optional Challenge')).toBeNull();
    expect(screen.queryByText('Stretch Task')).toBeNull();
  });

  it('should allow user to continue learning after skipping stretch task', async () => {
    (apiClient.sessions.interact as any)
      .mockResolvedValueOnce({
        mentorResponse: 'Great!',
        masteryScore: 85,
        confidenceLevel: 'high',
        mentorMode: 'Professional' as const,
        stretchTask: mockStretchTask
      })
      .mockResolvedValueOnce({
        mentorResponse: 'Let\'s continue!',
        masteryScore: 87,
        confidenceLevel: 'high',
        mentorMode: 'Professional' as const
        // No stretch task in second response
      });

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Advanced JavaScript')).toBeDefined();
    });

    // Trigger stretch task
    const input = screen.getByPlaceholderText('Type your response...');
    let submitButton = screen.getByText('Send');
    fireEvent.change(input, { target: { value: 'First answer' } });
    fireEvent.click(submitButton);

    // Wait for stretch task
    await waitFor(() => {
      expect(screen.getByText('Optional Challenge')).toBeDefined();
    });

    // Skip the stretch task (Requirement 14.5)
    const skipButton = screen.getByText('Skip Challenge');
    fireEvent.click(skipButton);

    // Verify stretch task is removed
    await waitFor(() => {
      expect(screen.queryByText('Optional Challenge')).toBeNull();
    });

    // Continue with normal interaction
    fireEvent.change(input, { target: { value: 'Next answer' } });
    submitButton = screen.getByText('Send');
    fireEvent.click(submitButton);

    // Should receive normal response without penalty
    await waitFor(() => {
      expect(screen.getByText('Let\'s continue!')).toBeDefined();
    });
  });
});
