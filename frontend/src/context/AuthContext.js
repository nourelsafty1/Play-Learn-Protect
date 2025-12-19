// src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verify token is still valid
          const response = await authAPI.getMe();
          setUser(response.data.data);
          localStorage.setItem('user', JSON.stringify(response.data.data));
        } catch (err) {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (err) {
      // Better error handling
      let message = 'Login failed';
      
      if (err.response) {
        // Server responded with error
        message = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        // Request made but no response (backend not running)
        message = 'Cannot connect to server. Please make sure the backend is running on port 5000.';
      } else {
        // Error setting up request
        message = err.message || 'An unexpected error occurred';
      }
      
      console.error('Login error:', err);
      setError(message);
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);

      return { success: true };
    } catch (err) {
      // Better error handling - show specific validation errors
      let message = 'Registration failed';
      let errors = null;
      
      if (err.response?.data) {
        errors = err.response.data.errors;
        // Get first error message or use general message
        if (errors && errors.length > 0) {
          message = errors[0].msg || errors[0].message || message;
        } else {
          message = err.response.data.message || message;
        }
      } else if (err.request) {
        message = 'Cannot connect to server. Please make sure the backend is running.';
      } else {
        message = err.message || message;
      }
      
      console.error('Registration error:', err.response?.data || err);
      setError(message);
      return { success: false, message, errors };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  // Update user data
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};