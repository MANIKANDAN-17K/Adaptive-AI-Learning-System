import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { User } from '../../types';

describe('Dashboard Component', () => {
  const mockUser: User = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    created_at: new Date(),
  };

  it('renders welcome message with user name', () => {
    const onCreateSkill = vi.fn();
    const onOpenLibrary = vi.fn();

    render(
      <Dashboard
        user={mockUser}
        onCreateSkill={onCreateSkill}
        onOpenLibrary={onOpenLibrary}
      />
    );

    expect(screen.getByText(/Welcome back, Test User/i)).toBeInTheDocument();
  });

  it('renders Create New Skill button', () => {
    const onCreateSkill = vi.fn();
    const onOpenLibrary = vi.fn();

    render(
      <Dashboard
        user={mockUser}
        onCreateSkill={onCreateSkill}
        onOpenLibrary={onOpenLibrary}
      />
    );

    expect(screen.getByText('Create New Skill')).toBeInTheDocument();
  });

  it('renders Library button', () => {
    const onCreateSkill = vi.fn();
    const onOpenLibrary = vi.fn();

    render(
      <Dashboard
        user={mockUser}
        onCreateSkill={onCreateSkill}
        onOpenLibrary={onOpenLibrary}
      />
    );

    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('calls onCreateSkill when Create New Skill button is clicked', async () => {
    const user = userEvent.setup();
    const onCreateSkill = vi.fn();
    const onOpenLibrary = vi.fn();

    render(
      <Dashboard
        user={mockUser}
        onCreateSkill={onCreateSkill}
        onOpenLibrary={onOpenLibrary}
      />
    );

    const createButton = screen.getByText('Create New Skill');
    await user.click(createButton);

    expect(onCreateSkill).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenLibrary when Library button is clicked', async () => {
    const user = userEvent.setup();
    const onCreateSkill = vi.fn();
    const onOpenLibrary = vi.fn();

    render(
      <Dashboard
        user={mockUser}
        onCreateSkill={onCreateSkill}
        onOpenLibrary={onOpenLibrary}
      />
    );

    const libraryButton = screen.getByText('Library');
    await user.click(libraryButton);

    expect(onOpenLibrary).toHaveBeenCalledTimes(1);
  });

  it('displays the power button icon', () => {
    const onCreateSkill = vi.fn();
    const onOpenLibrary = vi.fn();

    render(
      <Dashboard
        user={mockUser}
        onCreateSkill={onCreateSkill}
        onOpenLibrary={onOpenLibrary}
      />
    );

    // Check for SVG element (power icon)
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
