/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application
 * Requirements: 1.2, 1.3
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiClient, APIError } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * 
 * Manages authentication state and provides auth methods to children
 * Requirements: 1.2, 1.3
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load user profile on mount if token exists
   */
  useEffect(() => {
    const loadUser = async () => {
      if (apiClient.tokenManager.hasToken()) {
        try {
          const { user } = await apiClient.auth.getProfile();
          setUser(user);
        } catch (error) {
          // Token is invalid or expired, clear it
          apiClient.tokenManager.clearToken();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  /**
   * Handle global authentication errors
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      // Clear user state on unauthorized error
      setUser(null);
      apiClient.tokenManager.clearToken();
    };

    // Listen for unauthorized events from API client
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { user } = await apiClient.auth.login(email, password);
      setUser(user);
    } catch (error) {
      // Re-throw to allow component to handle error display
      throw error;
    }
  };

  /**
   * Register a new user account
   */
  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      const { user } = await apiClient.auth.register(name, email, password);
      setUser(user);
    } catch (error) {
      // Re-throw to allow component to handle error display
      throw error;
    }
  };

  /**
   * Logout and clear authentication state
   */
  const logout = (): void => {
    apiClient.auth.logout();
    setUser(null);
  };

  /**
   * Refresh user profile from server
   */
  const refreshProfile = async (): Promise<void> => {
    try {
      const { user } = await apiClient.auth.getProfile();
      setUser(user);
    } catch (error) {
      // If refresh fails, logout
      logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
