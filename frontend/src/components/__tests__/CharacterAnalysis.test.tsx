import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CharacterAnalysis from '../CharacterAnalysis';
import { apiClient } from '../../services';

// Mock the API client
vi.mock('../../services', () => ({
  apiClient: {
    characterAnalysis: {
      getProfile: vi.fn(),
      conductAnalysis: vi.fn()
    }
  }
}));

describe('CharacterAnalysis', () => {
  const mockUserId = 'user-123';
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the character analysis interface', async () => {
    vi.mocked(apiClient.characterAnalysis.getProfile).mockResolvedValue({
      profile: null
    });

    render(
      <CharacterAnalysis
        userId={mockUserId}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Character Analysis')).toBeInTheDocument();
    });
  });

  it('shows skip option when existing profile exists', async () => {
    const mockProfile = {
      user_id: mockUserId,
      tone_type: 'Friendly',
      confidence_level: 'high',
      motivation_index: 80
    };

    vi.mocked(apiClient.characterAnalysis.getProfile).mockResolvedValue({
      profile: mockProfile
    });

    render(
      <CharacterAnalysis
        userId={mockUserId}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/You already have a learning profile/)).toBeInTheDocument();
      expect(screen.getByText(/Skip and use existing profile/)).toBeInTheDocument();
    });
  });

  it('calls onSkip when skip button is clicked', async () => {
    const mockProfile = {
      user_id: mockUserId,
      tone_type: 'Friendly',
      confidence_level: 'high',
      motivation_index: 80
    };

    vi.mocked(apiClient.characterAnalysis.getProfile).mockResolvedValue({
      profile: mockProfile
    });

    render(
      <CharacterAnalysis
        userId={mockUserId}
        onComplete={mockOnComplete}
        onSkip={mockOnSkip}
      />
    );

    await waitFor(() => {
      const skipButton = screen.getByText(/Skip and use existing profile/);
      fireEvent.click(skipButton);
    });

    expect(mockOnSkip).toHaveBeenCalled();
  });

  it('displays progress through questions', async () => {
    vi.mocked(apiClient.characterAnalysis.getProfile).mockResolvedValue({
      profile: null
    });

    render(
      <CharacterAnalysis
        userId={mockUserId}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });
  });

  it('allows navigation between questions', async () => {
    vi.mocked(apiClient.characterAnalysis.getProfile).mockResolvedValue({
      profile: null
    });

    render(
      <CharacterAnalysis
        userId={mockUserId}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });

    // Answer first question
    const textarea = screen.getByPlaceholderText('Share your thoughts...');
    fireEvent.change(textarea, { target: { value: 'I prefer hands-on learning' } });

    // Click next
    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    });

    // Click previous
    const previousButton = screen.getByRole('button', { name: /Previous/i });
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    });
  });

  it('disables next button when question is not answered', async () => {
    vi.mocked(apiClient.characterAnalysis.getProfile).mockResolvedValue({
      profile: null
    });

    render(
      <CharacterAnalysis
        userId={mockUserId}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /Next/i });
      expect(nextButton).toBeDisabled();
    });
  });

  it('enables next button when question is answered', async () => {
    vi.mocked(apiClient.characterAnalysis.getProfile).mockResolvedValue({
      profile: null
    });

    render(
      <CharacterAnalysis
        userId={mockUserId}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Share your thoughts...');
      fireEvent.change(textarea, { target: { value: 'I prefer hands-on learning' } });
    });

    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('shows error when trying to submit with unanswered questions', async () => {
    vi.mocked(apiClient.characterAnalysis.getProfile).mockResolvedValue({
      profile: null
    });

    render(
      <CharacterAnalysis
        userId={mockUserId}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
    });

    // Answer first 4 questions and navigate through them
    for (let i = 0; i < 4; i++) {
      // Wait for the current question to be visible
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
      });

      const textarea = screen.getByPlaceholderText('Share your thoughts...');
      fireEvent.change(textarea, { target: { value: `Answer ${i + 1}` } });
      
      // Wait for Next button to be enabled after answering
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).toBeEnabled();
      });
      
      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);
      
      // Give time for animation to complete
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // Wait for the Complete Analysis button to appear on the last question
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Complete Analysis/i })).toBeInTheDocument();
    });

    // The last question is unanswered, so submit button should be disabled
    const submitButton = screen.getByRole('button', { name: /Complete Analysis/i });
    expect(submitButton).toBeDisabled();
  });
});
