import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import WorkingStudentDashboard from './pages/WorkingStudentDashboard';
import './style.css';

// Protected Route component - must be inside AuthProvider
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

// Role-based route protection - must be inside AuthProvider
function RoleRoute({ allowedRoles, children }: { allowedRoles: string[], children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

// Inner app component that uses the auth context
function AppRoutes() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/*" 
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </RoleRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/*" 
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </RoleRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/working-student/*" 
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['working_student']}>
                  <WorkingStudentDashboard />
                </RoleRoute>
              </ProtectedRoute>
            } 
          />
          
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/dashboard" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
