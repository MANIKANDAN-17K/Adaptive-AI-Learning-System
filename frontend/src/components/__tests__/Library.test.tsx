import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Library from '../Library';
import { apiClient } from '../../services';

// Mock the API client
vi.mock('../../services', () => ({
  apiClient: {
    skills: {
      getUserSkills: vi.fn()
    }
  }
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  }
}));

describe('Library Component', () => {
  const mockUserId = 'user-123';
  const mockOnSkillSelect = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    // Mock API to never resolve
    vi.mocked(apiClient.skills.getUserSkills).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <Library
        userId={mockUserId}
        onSkillSelect={mockOnSkillSelect}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('Loading your skills...')).toBeInTheDocument();
  });

  it('should display error state when API fails', async () => {
    const errorMessage = 'Failed to fetch skills';
    vi.mocked(apiClient.skills.getUserSkills).mockRejectedValue(
      new Error(errorMessage)
    );

    render(
      <Library
        userId={mockUserId}
        onSkillSelect={mockOnSkillSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Skills')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should display empty state when no skills exist', async () => {
    vi.mocked(apiClient.skills.getUserSkills).mockResolvedValue({
      skills: []
    });

    render(
      <Library
        userId={mockUserId}
        onSkillSelect={mockOnSkillSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No Skills Yet')).toBeInTheDocument();
      expect(
        screen.getByText('Start your learning journey by creating your first skill')
      ).toBeInTheDocument();
    });
  });

  it('should display skills grid when skills exist', async () => {
    const mockSkills = [
      {
        id: 'skill-1',
        user_id: mockUserId,
        skill_name: 'Python Programming',
        goal: 'Learn Python basics',
        timeline: 30,
        created_at: new Date('2024-01-01'),
        progressPercentage: 45,
        masteryLevel: 35,
        lastSessionDate: new Date().toISOString()
      },
      {
        id: 'skill-2',
        user_id: mockUserId,
        skill_name: 'Guitar',
        goal: 'Learn to play guitar',
        timeline: 60,
        created_at: new Date('2024-01-15'),
        progressPercentage: 20,
        masteryLevel: 15,
        lastSessionDate: new Date(Date.now() - 86400000).toISOString() // Yesterday
      }
    ];

    vi.mocked(apiClient.skills.getUserSkills).mockResolvedValue({
      skills: mockSkills
    });

    render(
      <Library
        userId={mockUserId}
        onSkillSelect={mockOnSkillSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Your Skills Library')).toBeInTheDocument();
      expect(screen.getByText('2 skills in progress')).toBeInTheDocument();
      expect(screen.getByText('Python Programming')).toBeInTheDocument();
      expect(screen.getByText('Guitar')).toBeInTheDocument();
    });
  });

  it('should display correct progress percentage for each skill', async () => {
    const mockSkills = [
      {
        id: 'skill-1',
        user_id: mockUserId,
        skill_name: 'Test Skill',
        goal: 'Test goal',
        timeline: 30,
        created_at: new Date(),
        progressPercentage: 75,
        masteryLevel: 65,
        lastSessionDate: new Date().toISOString()
      }
    ];

    vi.mocked(apiClient.skills.getUserSkills).mockResolvedValue({
      skills: mockSkills
    });

    render(
      <Library
        userId={mockUserId}
        onSkillSelect={mockOnSkillSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('should display correct mastery level labels', async () => {
    const mockSkills = [
      {
        id: 'skill-1',
        user_id: mockUserId,
        skill_name: 'Expert Skill',
        goal: 'Test',
        timeline: 30,
        created_at: new Date(),
        progressPercentage: 90,
        masteryLevel: 85,
        lastSessionDate: new Date().toISOString()
      },
      {
        id: 'skill-2',
        user_id: mockUserId,
        skill_name: 'Beginner Skill',
        goal: 'Test',
        timeline: 30,
        created_at: new Date(),
        progressPercentage: 25,
        masteryLevel: 25,
        lastSessionDate: new Date().toISOString()
      }
    ];

    vi.mocked(apiClient.skills.getUserSkills).mockResolvedValue({
      skills: mockSkills
    });

    render(
      <Library
        userId={mockUserId}
        onSkillSelect={mockOnSkillSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Expert')).toBeInTheDocument();
      expect(screen.getByText('Beginner')).toBeInTheDocument();
    });
  });

  it('should call onSkillSelect when a skill card is clicked', async () => {
    const mockSkills = [
      {
        id: 'skill-1',
        user_id: mockUserId,
        skill_name: 'Python Programming',
        goal: 'Learn Python',
        timeline: 30,
        created_at: new Date(),
        progressPercentage: 45,
        masteryLevel: 35,
        lastSessionDate: new Date().toISOString()
      }
    ];

    vi.mocked(apiClient.skills.getUserSkills).mockResolvedValue({
      skills: mockSkills
    });

    render(
      <Library
        userId={mockUserId}
        onSkillSelect={mockOnSkillSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Python Programming')).toBeInTheDocument();
    });

    const skillCard = screen.getByText('Python Programming').closest('button');
    expect(skillCard).toBeInTheDocument();

    if (skillCard) {
      await userEvent.click(skillCard);
      expect(mockOnSkillSelect).toHaveBeenCalledWith('skill-1');
    }
  });

  it('should call onBack when back button is clicked', async () => {
    vi.mocked(apiClient.skills.getUserSkills).mockResolvedValue({
      skills: []
    });

    render(
      <Library
        userId={mockUserId}
        onSkillSelect={mockOnSkillSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No Skills Yet')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Create Your First Skill');
    await userEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should format dates correctly', async () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    const mockSkills = [
      {
        id: 'skill-1',
        user_id: mockUserId,
        skill_name: 'Today Skill',
        goal: 'Test',
        timeline: 30,
        created_at: new Date(),
        progressPercentage: 50,
        masteryLevel: 40,
        lastSessionDate: today.toISOString()
      },
      {
        id: 'skill-2',
        user_id: mockUserId,
        skill_name: 'Yesterday Skill',
        goal: 'Test',
        timeline: 30,
        created_at: new Date(),
        progressPercentage: 50,
        masteryLevel: 40,
        lastSessionDate: yesterday.toISOString()
      }
    ];

    vi.mocked(apiClient.skills.getUserSkills).mockResolvedValue({
      skills: mockSkills
    });

    render(
      <Library
        userId={mockUserId}
        onSkillSelect={mockOnSkillSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Last practiced Today/)).toBeInTheDocument();
      expect(screen.getByText(/Last practiced Yesterday/)).toBeInTheDocument();
    });
  });

  it('should display skill count correctly', async () => {
    const mockSkills = [
      {
        id: 'skill-1',
        user_id: mockUserId,
        skill_name: 'Skill 1',
        goal: 'Test',
        timeline: 30,
        created_at: new Date(),
        progressPercentage: 50,
        masteryLevel: 40,
        lastSessionDate: new Date().toISOString()
      }
    ];

    vi.mocked(apiClient.skills.getUserSkills).mockResolvedValue({
      skills: mockSkills
    });

    render(
      <Library
        userId={mockUserId}
        onSkillSelect={mockOnSkillSelect}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1 skill in progress')).toBeInTheDocument();
    });
  });
});
