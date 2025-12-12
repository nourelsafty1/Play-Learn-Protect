// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Loading from './components/common/Loading';

// We'll create these pages next
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import ParentDashboard from './pages/ParentDashboard';
// import ChildDashboard from './pages/ChildDashboard';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <Routes>
          {/* Temporary landing page */}
          <Route path="/" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl text-center">
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
                  Play, Learn & Protect
                </h1>
                <p className="text-gray-600 text-lg mb-8">
                  A safe learning platform for children
                </p>
                <div className="text-green-600 font-semibold text-xl">
                  ✅ Backend Connected Successfully!
                </div>
                <div className="text-blue-600 mt-4">
                  Frontend is ready. Building pages next...
                </div>
              </div>
            </div>
          } />
          
          {/* We'll add more routes here */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;