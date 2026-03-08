import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Dashboard, SkillCreationFlow, Library, LearningSession, Login, Register, ProtectedRoute } from './components';
import { useAuth } from './contexts/AuthContext';

/**
 * Dashboard Route Wrapper
 * 
 * Wraps the Dashboard component with navigation handlers
 * Requirements: 7.2, 7.3, 7.4
 */
function DashboardRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null; // ProtectedRoute will handle redirect
  }

  return (
    <Dashboard
      user={user}
      onCreateSkill={() => navigate('/create-skill')}
      onOpenLibrary={() => navigate('/library')}
    />
  );
}

/**
 * Skill Creation Route Wrapper
 * 
 * Wraps the SkillCreationFlow component with navigation handlers
 * Requirements: 7.3
 */
function SkillCreationRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null; // ProtectedRoute will handle redirect
  }

  const handleComplete = (skillId: string) => {
    // Navigate to learning session after skill creation
    navigate(`/session/${skillId}`);
  };

  const handleCancel = () => {
    // Navigate back to dashboard
    navigate('/');
  };

  return (
    <SkillCreationFlow
      userId={user.id}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}

/**
 * Library Route Wrapper
 * 
 * Wraps the Library component with navigation handlers
 * Requirements: 7.4
 */
function LibraryRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null; // ProtectedRoute will handle redirect
  }

  const handleSkillSelect = (skillId: string) => {
    // Navigate to learning session for selected skill
    navigate(`/session/${skillId}`);
  };

  const handleBack = () => {
    // Navigate back to dashboard
    navigate('/');
  };

  return (
    <Library
      userId={user.id}
      onSkillSelect={handleSkillSelect}
      onBack={handleBack}
    />
  );
}

/**
 * Learning Session Route Wrapper
 * 
 * Wraps the LearningSession component with navigation handlers
 * Requirements: 7.4
 */
function LearningSessionRoute() {
  const navigate = useNavigate();
  const { skillId } = useParams<{ skillId: string }>();

  if (!skillId) {
    // If no skillId in URL, redirect to dashboard
    navigate('/');
    return null;
  }

  const handleBack = () => {
    // Navigate back to library
    navigate('/library');
  };

  return (
    <LearningSession
      skillId={skillId}
      onBack={handleBack}
    />
  );
}

/**
 * Main App Component
 * 
 * Sets up React Router with all application routes
 * Protected routes require authentication
 * Requirements: 1.2, 1.3, 7.2, 7.3, 7.4
 */
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes - require authentication */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardRoute />
        </ProtectedRoute>
      } />
      
      <Route path="/create-skill" element={
        <ProtectedRoute>
          <SkillCreationRoute />
        </ProtectedRoute>
      } />
      
      <Route path="/library" element={
        <ProtectedRoute>
          <LibraryRoute />
        </ProtectedRoute>
      } />
      
      <Route path="/session/:skillId" element={
        <ProtectedRoute>
          <LearningSessionRoute />
        </ProtectedRoute>
      } />
      
      {/* Catch-all route - redirect to dashboard */}
      <Route path="*" element={
        <ProtectedRoute>
          <DashboardRoute />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
