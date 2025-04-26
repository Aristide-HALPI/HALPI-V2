import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.tsx';

// Layout components
import MainLayout from './components/layouts/MainLayout.tsx';
import PublicLayout from './components/layouts/PublicLayout.tsx';

// Pages
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/auth/LoginPage.tsx';
import SignupPage from './pages/auth/SignupPage.tsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import CoursesPage from './pages/CoursesPage.tsx';
import CourseDetailsPage from './pages/courses/CourseDetailsPage';
import EditCoursePage from './pages/courses/EditCoursePage';
import ParcoursPage from './pages/parcours/ParcoursPage.tsx';
import CourseProgressPage from './pages/parcours/CourseProgressPage.tsx';
import AgendaPage from './pages/AgendaPage.tsx';
import AccompagnementPage from './pages/AccompagnementPage.tsx';
import SupportPage from './pages/SupportPage.tsx';
import ActivityPage from './pages/activities/ActivityPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const location = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected routes */}
      <Route 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/edit/:courseId" element={<EditCoursePage />} />
        <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
        <Route path="/parcours" element={<ParcoursPage />} />
        <Route path="/parcours/:courseId" element={<CourseProgressPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/accompagnement" element={<AccompagnementPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/activities/:activityId" element={<ActivityPage />} />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
