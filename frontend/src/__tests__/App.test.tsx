import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Helper to render App with MemoryRouter at a specific route
function renderWithRouter(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  );
}

describe('App Component - Routing', () => {
  it('renders Dashboard on root path', () => {
    renderWithRouter('/');
    
    // Check for Dashboard elements
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText('Create New Skill')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('navigates to skill creation when Create New Skill is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter('/');
    
    const createButton = screen.getByText('Create New Skill');
    await user.click(createButton);
    
    // Should navigate to skill creation page
    expect(screen.getByText(/This feature will be implemented in task 18/i)).toBeInTheDocument();
  });

  it('navigates to library when Library is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter('/');
    
    const libraryButton = screen.getByText('Library');
    await user.click(libraryButton);
    
    // Should navigate to library page
    expect(screen.getByText(/This feature will be implemented in task 21/i)).toBeInTheDocument();
  });

  it('navigates back to dashboard from skill creation', async () => {
    const user = userEvent.setup();
    renderWithRouter('/');
    
    // Navigate to skill creation
    const createButton = screen.getByText('Create New Skill');
    await user.click(createButton);
    
    // Click back button
    const backButton = screen.getByText('Back to Dashboard');
    await user.click(backButton);
    
    // Should be back on dashboard
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  it('navigates back to dashboard from library', async () => {
    const user = userEvent.setup();
    renderWithRouter('/');
    
    // Navigate to library
    const libraryButton = screen.getByText('Library');
    await user.click(libraryButton);
    
    // Click back button
    const backButton = screen.getByText('Back to Dashboard');
    await user.click(backButton);
    
    // Should be back on dashboard
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });
});
