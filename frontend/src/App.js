import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Components (We will create these next)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ParentDashboard from './pages/ParentDashboard';
import ChildSelect from './pages/ChildSelect';
import ChildDashboard from './pages/ChildDashboard';
import GamePlayer from './pages/GamePlayer';
import Loading from './components/common/Loading';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading fullScreen />;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" />
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Parent Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <ParentDashboard />
              </ProtectedRoute>
            } />

            {/* Child Selection (Netflix Style) */}
            <Route path="/select-child" element={
              <ProtectedRoute>
                <ChildSelect />
              </ProtectedRoute>
            } />

            {/* Child Zone */}
            <Route path="/play/:childId" element={
              <ProtectedRoute>
                <ChildDashboard />
              </ProtectedRoute>
            } />
            
             <Route path="/game/:gameId" element={
              <ProtectedRoute>
                <GamePlayer />
              </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;