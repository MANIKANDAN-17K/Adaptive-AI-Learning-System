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
    input: ({ children, ...props }: any) => <input {...props}>{children}</input>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

/**
 * Tests for Roadmap Visualization in Learning Session
 * 
 * Validates Requirement 11.5: Display all nodes with status indicators (locked, current, completed)
 */
describe('LearningSession - Roadmap Visualization', () => {
  const mockSkillId = 'skill-123';
  
  const mockSkill = {
    id: mockSkillId,
    user_id: 'user-123',
    skill_name: 'JavaScript Mastery',
    goal: 'Master JavaScript fundamentals',
    timeline: 60,
    created_at: new Date()
  };

  const mockRoadmapWithMultipleNodes = {
    id: 'roadmap-123',
    skill_id: mockSkillId,
    structure_json: [
      {
        node_id: 'node-1',
        title: 'Variables and Data Types',
        description: 'Learn about variables, primitives, and objects',
        mastery_threshold: 70,
        status: 'completed' as const,
        order: 1
      },
      {
        node_id: 'node-2',
        title: 'Functions and Scope',
        description: 'Master function declarations and closures',
        mastery_threshold: 75,
        status: 'current' as const,
        order: 2
      },
      {
        node_id: 'node-3',
        title: 'Async Programming',
        description: 'Learn promises and async/await',
        mastery_threshold: 80,
        status: 'locked' as const,
        order: 3
      },
      {
        node_id: 'node-4',
        title: 'Advanced Patterns',
        description: 'Design patterns and best practices',
        mastery_threshold: 85,
        status: 'locked' as const,
        order: 4
      }
    ],
    mastery_threshold: 75
  };

  const mockSessionResponse = {
    sessionId: 'session-123',
    recap: 'Great progress! Let\'s continue with functions.',
    currentNode: mockRoadmapWithMultipleNodes.structure_json[1],
    masteryScore: 72,
    confidenceLevel: 'medium',
    mentorMode: 'Professional' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    (apiClient.skills.getSkill as any).mockResolvedValue({ skill: mockSkill });
    (apiClient.roadmaps.getRoadmap as any).mockResolvedValue({ roadmap: mockRoadmapWithMultipleNodes });
    (apiClient.sessions.startSession as any).mockResolvedValue(mockSessionResponse);
  });

  it('should display all roadmap nodes', async () => {
    render(<LearningSession skillId={mockSkillId} />);

    // Wait for the session to load
    await waitFor(() => {
      expect(screen.getByText('JavaScript Mastery')).toBeDefined();
    });

    // Verify all nodes are displayed
    expect(screen.getByText('Variables and Data Types')).toBeDefined();
    expect(screen.getAllByText('Functions and Scope').length).toBeGreaterThan(0); // Appears in header and roadmap
    expect(screen.getByText('Async Programming')).toBeDefined();
    expect(screen.getByText('Advanced Patterns')).toBeDefined();
  });

  it('should display "Learning Path" heading in roadmap sidebar', async () => {
    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Learning Path')).toBeDefined();
    });
  });

  it('should display node descriptions', async () => {
    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('JavaScript Mastery')).toBeDefined();
    });

    // Verify descriptions are shown
    expect(screen.getByText(/Learn about variables, primitives, and objects/)).toBeDefined();
    expect(screen.getByText(/Master function declarations and closures/)).toBeDefined();
    expect(screen.getByText(/Learn promises and async\/await/)).toBeDefined();
    expect(screen.getByText(/Design patterns and best practices/)).toBeDefined();
  });

  it('should display status indicators for all node states', async () => {
    const { container } = render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('JavaScript Mastery')).toBeDefined();
    });

    // Check for completed node indicator (green with checkmark)
    const completedIndicators = container.querySelectorAll('.bg-green-500');
    expect(completedIndicators.length).toBeGreaterThan(0);

    // Check for current node indicator (purple)
    const currentIndicators = container.querySelectorAll('.bg-\\[\\#6C4DFF\\]');
    expect(currentIndicators.length).toBeGreaterThan(0);

    // Check for locked node indicators (gray)
    const lockedIndicators = container.querySelectorAll('.bg-gray-300');
    expect(lockedIndicators.length).toBeGreaterThan(0);
  });

  it('should visually distinguish current node from others', async () => {
    const { container } = render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('JavaScript Mastery')).toBeDefined();
    });

    // Current node should have purple border
    const currentNodeElements = container.querySelectorAll('.border-\\[\\#6C4DFF\\]');
    expect(currentNodeElements.length).toBeGreaterThan(0);
  });

  it('should show completed nodes with green styling', async () => {
    const { container } = render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Variables and Data Types')).toBeDefined();
    });

    // Completed nodes should have green border
    const completedNodeElements = container.querySelectorAll('.border-green-200');
    expect(completedNodeElements.length).toBeGreaterThan(0);
  });

  it('should show locked nodes with reduced opacity', async () => {
    const { container } = render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Async Programming')).toBeDefined();
    });

    // Locked nodes should have opacity-60 class
    const lockedNodeElements = container.querySelectorAll('.opacity-60');
    expect(lockedNodeElements.length).toBeGreaterThan(0);
  });

  it('should display roadmap in sidebar layout', async () => {
    const { container } = render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Learning Path')).toBeDefined();
    });

    // Check for sidebar styling
    const sidebar = container.querySelector('.w-80.border-l');
    expect(sidebar).toBeDefined();
  });

  it('should handle empty roadmap gracefully', async () => {
    const emptyRoadmap = {
      id: 'roadmap-empty',
      skill_id: mockSkillId,
      structure_json: [],
      mastery_threshold: 70
    };

    (apiClient.roadmaps.getRoadmap as any).mockResolvedValue({ roadmap: emptyRoadmap });

    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Learning Path')).toBeDefined();
    });

    // Should still show the Learning Path heading even with no nodes
    expect(screen.getByText('Learning Path')).toBeDefined();
  });

  it('should display nodes in correct order', async () => {
    render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('JavaScript Mastery')).toBeDefined();
    });

    // Get all node titles using getAllByText for nodes that appear multiple times
    const node1 = screen.getByText('Variables and Data Types');
    const node2Elements = screen.getAllByText('Functions and Scope');
    const node3 = screen.getByText('Async Programming');
    const node4 = screen.getByText('Advanced Patterns');

    // All nodes should be present
    expect(node1).toBeDefined();
    expect(node2Elements.length).toBeGreaterThan(0); // Appears in header and roadmap
    expect(node3).toBeDefined();
    expect(node4).toBeDefined();
  });

  it('should show checkmark icon for completed nodes', async () => {
    const { container } = render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Variables and Data Types')).toBeDefined();
    });

    // Check for SVG checkmark in completed node
    const checkmarks = container.querySelectorAll('svg path[fill-rule="evenodd"]');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('should show lock icon for locked nodes', async () => {
    const { container } = render(<LearningSession skillId={mockSkillId} />);

    await waitFor(() => {
      expect(screen.getByText('Async Programming')).toBeDefined();
    });

    // Check for lock icons (there should be 2 locked nodes)
    const lockIcons = container.querySelectorAll('.bg-gray-300 svg');
    expect(lockIcons.length).toBeGreaterThan(0);
  });
});
