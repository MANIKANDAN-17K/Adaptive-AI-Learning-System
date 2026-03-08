# Frontend API Client Service

This directory contains the API client service for the Adaptive AI Skill Mentor frontend application.

## Overview

The API client provides a type-safe, centralized interface for all backend API interactions with built-in:
- **Authentication token management** - Automatic token storage and injection
- **Request/response interceptors** - Consistent error handling and response parsing
- **Type safety** - Full TypeScript support with proper types for all requests/responses
- **Error handling** - Structured error handling with custom APIError class

## Files

- `apiClient.ts` - Main API client implementation
- `__tests__/apiClient.test.ts` - Comprehensive test suite
- `README.md` - This documentation file

## Usage

### Import the API Client

```typescript
import apiClient from '@/services/apiClient';
// Or import specific modules
import { authAPI, skillsAPI, sessionsAPI } from '@/services/apiClient';
```

### Authentication

```typescript
// Register a new user
try {
  const { userId, token, user } = await apiClient.auth.register(
    'John Doe',
    'john@example.com',
    'password123'
  );
  // Token is automatically stored
  console.log('Registered user:', user);
} catch (error) {
  if (error instanceof APIError) {
    console.error('Registration failed:', error.message);
  }
}

// Login
const { userId, token, user } = await apiClient.auth.login(
  'john@example.com',
  'password123'
);

// Get current user profile
const { user } = await apiClient.auth.getProfile();

// Logout
apiClient.auth.logout(); // Clears stored token
```

### Skills Management

```typescript
// Create a new skill
const { skill, needsCharacterAnalysis } = await apiClient.skills.createSkill(
  'JavaScript',
  'Master advanced JavaScript concepts',
  30 // timeline in days
);

// Get all skills for a user
const { skills } = await apiClient.skills.getUserSkills('user-id');
// Each skill includes: progressPercentage, masteryLevel, lastSessionDate

// Get a specific skill with its roadmap
const { skill, roadmap } = await apiClient.skills.getSkill('skill-id');
```

### Character Analysis

```typescript
// Check if user has a personality profile
const { profile } = await apiClient.characterAnalysis.getProfile('user-id');

if (!profile) {
  // Conduct character analysis
  const responses = [
    { question: 'How do you prefer to learn?', response: 'By doing hands-on projects' },
    { question: 'What motivates you?', response: 'Solving real-world problems' }
  ];
  
  const { profile } = await apiClient.characterAnalysis.conductAnalysis(
    'user-id',
    responses
  );
}
```

### Roadmap Generation

```typescript
// Generate a roadmap for a skill
const { roadmapId, structure } = await apiClient.roadmaps.generateRoadmap(
  'skill-id',
  'JavaScript',
  'Master advanced JS',
  30,
  personalityProfile
);

// Get existing roadmap
const { roadmap } = await apiClient.roadmaps.getRoadmap('skill-id');
```

### Learning Sessions

```typescript
// Start or resume a session
const { 
  sessionId, 
  recap, 
  currentNode, 
  masteryScore, 
  confidenceLevel 
} = await apiClient.sessions.startSession('skill-id');

// Interact with the AI mentor
const {
  mentorResponse,
  masteryScore,
  confidenceLevel,
  nextNode,
  stretchTask
} = await apiClient.sessions.interact(
  'session-id',
  'My answer to the question',
  85, // accuracy (0-100)
  90, // speed (0-100)
  1   // attempts
);

// End a session
const { success } = await apiClient.sessions.endSession(
  'session-id',
  'Summary of what was learned'
);
```

## Token Management

The API client includes a token manager for handling authentication tokens:

```typescript
import { tokenManager } from '@/services/apiClient';

// Check if user is authenticated
if (tokenManager.hasToken()) {
  // User is logged in
}

// Get current token
const token = tokenManager.getToken();

// Manually set token (usually not needed)
tokenManager.setToken('jwt-token');

// Clear token (logout)
tokenManager.clearToken();
```

## Error Handling

All API methods throw `APIError` instances on failure:

```typescript
import { APIError } from '@/services/apiClient';

try {
  await apiClient.auth.login(email, password);
} catch (error) {
  if (error instanceof APIError) {
    console.error('Status:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    
    // Handle specific error codes
    if (error.statusCode === 401) {
      // Invalid credentials
    } else if (error.statusCode === 409) {
      // Conflict (e.g., user already exists)
    } else if (error.statusCode === 0) {
      // Network error
    }
  }
}
```

### Common Error Codes

- `0` - Network error (no connection)
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid credentials or expired token)
- `404` - Resource not found
- `409` - Conflict (e.g., duplicate resource)
- `500` - Internal server error
- `503` - Service unavailable (e.g., AI service down)

## Configuration

The API base URL can be configured via environment variable:

```env
# .env or .env.local
VITE_API_BASE_URL=http://localhost:3000/api
```

Default: `http://localhost:3000/api`

## Testing

The API client includes comprehensive tests covering:
- Token management
- All API endpoints
- Error handling
- Request/response interceptors

Run tests:
```bash
npm test -- src/services/__tests__/apiClient.test.ts
```

## Architecture

### Request Flow

1. **Client calls API method** → e.g., `apiClient.auth.login(email, password)`
2. **Request interceptor** → Adds authentication token and headers
3. **Fetch request** → Sends HTTP request to backend
4. **Response interceptor** → Parses response and handles errors
5. **Return data** → Type-safe response returned to caller

### Token Storage

Tokens are stored in `localStorage` with key `auth_token`. This provides:
- Persistence across page refreshes
- Automatic token injection in requests
- Easy logout by clearing token

### Type Safety

All API methods use TypeScript interfaces from `types.ts` to ensure:
- Correct request parameters
- Properly typed responses
- Compile-time error checking
- IDE autocomplete support

## Best Practices

1. **Always handle errors** - Wrap API calls in try-catch blocks
2. **Check authentication** - Use `tokenManager.hasToken()` before protected operations
3. **Use TypeScript** - Leverage type safety for all API interactions
4. **Centralize API calls** - Don't use fetch directly; use the API client
5. **Handle loading states** - Show loading indicators during API calls
6. **Validate input** - Validate user input before sending to API

## Example: Complete Login Flow

```typescript
import { useState } from 'react';
import apiClient, { APIError } from '@/services/apiClient';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user } = await apiClient.auth.login(email, password);
      console.log('Logged in as:', user.name);
      // Navigate to dashboard
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        disabled={loading}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        disabled={loading}
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## Requirements Validation

This API client implementation satisfies the following requirements:

- **Requirement 1.1-1.4**: User authentication and profile management
- **Requirement 2.1-2.5**: Character analysis and personality profiling
- **Requirement 3.1-3.6**: Skill creation and roadmap generation
- **Requirement 4.1-4.8**: Adaptive learning engine integration
- **Requirement 6.1-6.5**: Skill library and session continuity
- **Requirement 10.1-10.6**: AI service integration (proxied through backend)
- **Requirement 19.1-19.5**: API security (token-based authentication)

All API integration requirements are met through this centralized, type-safe client service.
