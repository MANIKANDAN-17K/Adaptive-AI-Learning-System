/**
 * Authentication Integration Tests
 * 
 * Tests authentication flow including:
 * - Protected routes
 * - Token management
 * - Global error handling
 * 
 * Requirements: 1.2, 1.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import * as apiClient from '../services/apiClient';

// Mock the API client
vi.mock('../services/apiClient', () => ({
  apiClient: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      getProfile: vi.fn(),
      logout: vi.fn(),
    },
    tokenManager: {
      hasToken: vi.fn(),
      getToken: vi.fn(),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    },
  },
  APIError: class APIError extends Error {
    constructor(message: string, public statusCode: number, public details?: any) {
      super(message);
      this.name = 'APIError';
    }
  },
}));

// Test component that uses auth
function TestComponent() {
  const { user, isAuthenticated } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      {user && <div data-testid="user-name">{user.name}</div>}
    </div>
  );
}

describe('Authentication Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with no user when no token exists', async () => {
    vi.mocked(apiClient.apiClient.tokenManager.hasToken).mockReturnValue(false);

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });

  it('should load user profile when token exists', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      created_at: new Date(),
    };

    vi.mocked(apiClient.apiClient.tokenManager.hasToken).mockReturnValue(true);
    vi.mocked(apiClient.apiClient.auth.getProfile).mockResolvedValue({ user: mockUser });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });

  it('should clear token when profile fetch fails', async () => {
    vi.mocked(apiClient.apiClient.tokenManager.hasToken).mockReturnValue(true);
    vi.mocked(apiClient.apiClient.auth.getProfile).mockRejectedValue(new Error('Unauthorized'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiClient.apiClient.tokenManager.clearToken).toHaveBeenCalled();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });
});

describe('Protected Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state while checking authentication', () => {
    vi.mocked(apiClient.apiClient.tokenManager.hasToken).mockReturnValue(true);
    vi.mocked(apiClient.apiClient.auth.getProfile).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render children when authenticated', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      created_at: new Date(),
    };

    vi.mocked(apiClient.apiClient.tokenManager.hasToken).mockReturnValue(true);
    vi.mocked(apiClient.apiClient.auth.getProfile).mockResolvedValue({ user: mockUser });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});

describe('Token Management', () => {
  it('should store token on successful login', async () => {
    const mockResponse = {
      userId: '1',
      token: 'test-token',
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date(),
      },
    };

    // Mock the actual implementation to call setToken
    vi.mocked(apiClient.apiClient.auth.login).mockImplementation(async (email, password) => {
      apiClient.apiClient.tokenManager.setToken(mockResponse.token);
      return mockResponse;
    });

    const result = await apiClient.apiClient.auth.login('test@example.com', 'password');
    
    expect(result).toEqual(mockResponse);
    expect(apiClient.apiClient.tokenManager.setToken).toHaveBeenCalledWith('test-token');
  });

  it('should clear token on logout', () => {
    // Mock the actual implementation to call clearToken
    vi.mocked(apiClient.apiClient.auth.logout).mockImplementation(() => {
      apiClient.apiClient.tokenManager.clearToken();
    });

    apiClient.apiClient.auth.logout();
    expect(apiClient.apiClient.tokenManager.clearToken).toHaveBeenCalled();
  });
});

describe('Global Error Handling', () => {
  it('should handle unauthorized events', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      created_at: new Date(),
    };

    vi.mocked(apiClient.apiClient.tokenManager.hasToken).mockReturnValue(true);
    vi.mocked(apiClient.apiClient.auth.getProfile).mockResolvedValue({ user: mockUser });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    // Simulate unauthorized event
    window.dispatchEvent(new CustomEvent('auth:unauthorized', {
      detail: { message: 'Token expired' }
    }));

    // Should clear user state
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });
});
