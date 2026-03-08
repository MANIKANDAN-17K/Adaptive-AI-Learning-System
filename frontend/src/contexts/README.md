# Authentication Context

This directory contains the authentication context and related functionality for the Adaptive AI Skill Mentor application.

## Overview

The authentication system provides:
- User login and registration
- Protected routes that require authentication
- Automatic token management
- Global error handling for authentication failures
- Token refresh on page reload

## Components

### AuthContext

The `AuthContext` provides authentication state and methods throughout the application.

**Features:**
- Automatic token loading on app initialization
- User profile caching
- Global authentication error handling
- Token cleanup on logout

**Usage:**
```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Use authentication state and methods
}
```

### ProtectedRoute

A wrapper component that protects routes requiring authentication.

**Features:**
- Redirects to login if not authenticated
- Shows loading state while checking authentication
- Automatically handles token validation

**Usage:**
```typescript
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## Authentication Flow

### Registration
1. User submits registration form
2. API creates user account and returns token
3. Token is stored in localStorage
4. User is redirected to dashboard

### Login
1. User submits login credentials
2. API validates credentials and returns token
3. Token is stored in localStorage
4. User profile is loaded
5. User is redirected to dashboard

### Token Management
- Tokens are stored in localStorage
- Tokens are automatically included in API requests
- Invalid/expired tokens trigger automatic logout
- Token is validated on app initialization

### Logout
1. User clicks logout
2. Token is cleared from localStorage
3. User state is cleared
4. User is redirected to login page

## Global Error Handling

The authentication system handles errors globally:

**401 Unauthorized:**
- Automatically clears invalid token
- Dispatches `auth:unauthorized` event
- AuthContext listens for event and logs user out
- User is redirected to login page

**Network Errors:**
- Displays user-friendly error messages
- Preserves form state for retry

**Validation Errors:**
- Shows specific error messages
- Highlights invalid fields

## Security Features

1. **Token Storage:** Tokens are stored in localStorage (consider httpOnly cookies for production)
2. **Automatic Cleanup:** Invalid tokens are automatically cleared
3. **Protected Routes:** All authenticated routes require valid token
4. **Error Sanitization:** API errors don't expose sensitive information
5. **HTTPS Only:** API client enforces HTTPS in production

## Requirements Satisfied

- **Requirement 1.2:** User login with session establishment
- **Requirement 1.3:** User profile retrieval and display
- **Requirement 1.4:** Safe error messages without security details

## Testing

Authentication functionality is tested in `frontend/src/__tests__/authentication.test.tsx`:

- Context initialization
- Token management
- Protected route behavior
- Global error handling
- Login/logout flows

Run tests with:
```bash
npm test -- authentication.test.tsx
```
