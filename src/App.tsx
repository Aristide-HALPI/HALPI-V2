import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Profile } from './pages/Profile';
import { Courses } from './pages/Courses';
import { Paths } from './pages/Paths';
import { Calendar } from './pages/Calendar';
import { Accompaniments } from './pages/Accompaniments';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PathDetail } from './pages/PathDetail';
import { Activity } from './pages/Activity';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <div className="flex min-h-screen bg-gray-50">
                  <Sidebar />
                  <main className="ml-56 flex-1 p-8">
                    <Routes>
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/courses" element={<Courses />} />
                      <Route path="/paths" element={<Paths />} />
                      <Route path="/paths/:pathId" element={<PathDetail />} />
                      <Route path="/paths/:pathId/activity/:stepId" element={<Activity />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/accompaniments" element={<Accompaniments />} />
                      <Route path="*" element={<Navigate to="/profile" />} />
                    </Routes>
                  </main>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}