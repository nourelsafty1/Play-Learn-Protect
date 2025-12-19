// src/components/common/Navbar.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import { useTranslation } from '../../utils/translations';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-3xl"></span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('playLearnProtect')}
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              {t('dashboard')}
            </Link>
            <Link
              to="/games"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              {t('games')}
            </Link>
            <Link
              to="/learning"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              {t('learning')}
            </Link>
            {(user?.role === 'parent' || user?.role === 'teacher') && (
              <Link
                to="/monitoring"
                className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                {t('monitoring')}
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 focus:outline-none"
            >
              <div className={`w-10 h-10 rounded-full ${getAvatarColor(user?.name)} flex items-center justify-center text-white font-bold`}>
                {getInitials(user?.name)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{t(user?.role)}</p>
              </div>
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  👤 {t('profile')}
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  ⚙️ {t('settings')}
                </Link>
                <hr className="my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                >
                  🚪 {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;