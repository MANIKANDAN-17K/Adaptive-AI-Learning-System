# Frontend Routing Setup

## Overview

The Adaptive AI Skill Mentor frontend uses React Router v6 for client-side routing. All components are connected through a centralized routing configuration in `App.tsx`.

## Route Structure

```
/                           → Dashboard (main entry point)
/create-skill              → Skill Creation Flow
/library                   → Skills Library
/session/:skillId          → Learning Session (dynamic route)
/*                         → Catch-all (redirects to Dashboard)
```

## Navigation Flows

### 1. Dashboard → Create Skill → Learning Session

**User Journey:**
1. User lands on Dashboard (`/`)
2. Clicks "Create New Skill" button
3. Navigates to Skill Creation Flow (`/create-skill`)
4. Completes skill creation and character analysis
5. Automatically navigates to Learning Session (`/session/:skillId`)

**Implementation:**
```typescript
// Dashboard
<Dashboard 
  onCreateSkill={() => navigate('/create-skill')}
/>

// Skill Creation Flow
<SkillCreationFlow 
  onComplete={(skillId) => navigate(`/session/${skillId}`)}
/>
```

### 2. Dashboard → Library → Learning Session

**User Journey:**
1. User lands on Dashboard (`/`)
2. Clicks "Library" button
3. Navigates to Library (`/library`)
4. Selects a skill from the grid
5. Navigates to Learning Session (`/session/:skillId`)

**Implementation:**
```typescript
// Dashboard
<Dashboard 
  onOpenLibrary={() => navigate('/library')}
/>

// Library
<Library 
  onSkillSelect={(skillId) => navigate(`/session/${skillId}`)}
/>
```

### 3. Learning Session → Library → Dashboard

**User Journey:**
1. User is in Learning Session (`/session/:skillId`)
2. Clicks "Back" button
3. Navigates to Library (`/library`)
4. Clicks "Back to Dashboard" button
5. Returns to Dashboard (`/`)

**Implementation:**
```typescript
// Learning Session
<LearningSession 
  onBack={() => navigate('/library')}
/>

// Library
<Library 
  onBack={() => navigate('/')}
/>
```

## Route Components

### DashboardRoute

**Path:** `/`

**Purpose:** Main entry point of the application

**Props Passed:**
- `user`: Mock user object (will be replaced with auth in task 26.2)
- `onCreateSkill`: Navigates to `/create-skill`
- `onOpenLibrary`: Navigates to `/library`

**Requirements:** 7.1, 7.2

### SkillCreationRoute

**Path:** `/create-skill`

**Purpose:** Handles the complete skill creation flow including character analysis

**Props Passed:**
- `userId`: Mock user ID (will be replaced with auth in task 26.2)
- `onComplete`: Navigates to `/session/:skillId` after successful creation
- `onCancel`: Navigates back to `/` (Dashboard)

**Requirements:** 7.3

### LibraryRoute

**Path:** `/library`

**Purpose:** Displays all user skills with progress metrics

**Props Passed:**
- `userId`: Mock user ID (will be replaced with auth in task 26.2)
- `onSkillSelect`: Navigates to `/session/:skillId` when skill is selected
- `onBack`: Navigates back to `/` (Dashboard)

**Requirements:** 7.4

### LearningSessionRoute

**Path:** `/session/:skillId`

**Purpose:** Active learning interface with AI mentor

**Props Passed:**
- `skillId`: Extracted from URL params
- `onBack`: Navigates back to `/library`

**URL Parameters:**
- `:skillId` - UUID of the skill being learned

**Requirements:** 7.4

## BrowserRouter Setup

The application is wrapped with `BrowserRouter` in `main.jsx`:

```jsx
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

This enables:
- Clean URLs without hash fragments
- Browser history API integration
- Back/forward button support
- Programmatic navigation via `useNavigate()`

## Navigation Patterns

### Programmatic Navigation

All route components use the `useNavigate()` hook for programmatic navigation:

```typescript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/target-route');
  };
  
  return <button onClick={handleClick}>Go</button>;
}
```

### URL Parameters

The Learning Session route uses dynamic URL parameters:

```typescript
import { useParams } from 'react-router-dom';

function LearningSessionRoute() {
  const { skillId } = useParams<{ skillId: string }>();
  
  return <LearningSession skillId={skillId} />;
}
```

### Catch-All Route

Unknown routes are redirected to the Dashboard:

```typescript
<Route path="*" element={<DashboardRoute />} />
```

## Testing

Routing is tested using `MemoryRouter` from React Router:

```typescript
import { MemoryRouter } from 'react-router-dom';

render(
  <MemoryRouter initialEntries={['/library']}>
    <App />
  </MemoryRouter>
);
```

See `frontend/src/__tests__/routing.test.tsx` for complete test suite.

## Future Enhancements (Task 26.2)

The current implementation uses mock user data. Task 26.2 will add:

1. **Protected Routes:** Require authentication for all routes except login/register
2. **Auth Context:** Replace mock user with actual authenticated user
3. **Token Management:** Handle JWT tokens and refresh logic
4. **Redirect Logic:** Redirect unauthenticated users to login page

## Requirements Validation

✅ **Requirement 7.2:** Dashboard provides navigation to "Create New Skill"
✅ **Requirement 7.3:** Dashboard provides navigation to "Library"
✅ **Requirement 7.4:** Navigation flows work end-to-end:
  - Dashboard → Create Skill → Learning Session
  - Dashboard → Library → Learning Session
  - Learning Session → Library → Dashboard

## Component Dependencies

```
App.tsx
├── Dashboard (from ./components)
├── SkillCreationFlow (from ./components)
│   └── CharacterAnalysis (nested)
├── Library (from ./components)
└── LearningSession (from ./components)
```

All components are exported from `frontend/src/components/index.ts` for clean imports.

## Animations

All route transitions include Framer Motion animations:
- Page entry: fade in + slide up
- Page exit: fade out + scale down
- Smooth transitions between routes

## Error Handling

- Invalid `skillId` in URL: Redirects to Dashboard
- Missing route parameters: Redirects to Dashboard
- Component errors: Caught by error boundaries (to be implemented)

## Performance Considerations

- **Code Splitting:** Routes can be lazy-loaded in future optimization
- **Prefetching:** Consider prefetching Library data on Dashboard mount
- **State Persistence:** Navigation state is preserved in browser history

## Accessibility

- All navigation buttons have proper ARIA labels
- Keyboard navigation is fully supported
- Focus management on route changes
- Screen reader announcements for route changes

## Browser Support

The routing setup supports:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Issue: Routes not working in production

**Solution:** Ensure server is configured to serve `index.html` for all routes:

```nginx
# Nginx example
location / {
  try_files $uri $uri/ /index.html;
}
```

### Issue: Navigation not updating URL

**Solution:** Verify `BrowserRouter` is wrapping the entire app in `main.jsx`

### Issue: Component not receiving route params

**Solution:** Check that `useParams()` is called inside a component rendered by `<Route>`

## Related Files

- `frontend/src/App.tsx` - Main routing configuration
- `frontend/src/main.jsx` - BrowserRouter setup
- `frontend/src/components/index.ts` - Component exports
- `frontend/src/__tests__/routing.test.tsx` - Routing tests
- `frontend/package.json` - React Router dependency
