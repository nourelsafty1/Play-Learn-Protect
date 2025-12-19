// src/pages/LoginPage.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { useTranslation } from '../utils/translations';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, lang, changeLanguage } = useTranslation();

  const isArabic = lang === 'ar';

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.email || !formData.password) {
      setError(t('fillRequiredFields'));
      setLoading(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Redirect based on role
        navigate('/dashboard');
      } else {
        setError(result.message || t('loginFailed'));
      }
    } catch (err) {
      setError(t('errorOccurredPleaseTryAgain'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div key={lang} className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            {t('playLearnProtect')}
          </h1>
          <p className="text-white text-lg mt-2">{t('welcomeBack')}</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 relative">
          {/* Internal Language Switcher */}
          <div className="flex justify-end mb-6">
            <button
              type="button"
              onClick={() => changeLanguage(isArabic ? 'en' : 'ar')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 border border-gray-200 shadow-sm"
              title={isArabic ? 'Switch to English' : 'التبديل للعربية'}
            >
              <span className="text-lg leading-none">{isArabic ? '🇺🇸' : '🇪🇬'}</span>
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {t('loginToAccount')}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 animate-shake">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('emailAddress')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('password')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              disabled={loading}
              className="mt-6"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('loggingIn')}
                </>
              ) : (
                <>
                  <span>{t('login')}</span>
                  <span>→</span>
                </>
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('dontHaveAccount')}{' '}
              <Link
                to="/register"
                className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                {t('registerHere')}
              </Link>
            </p>
          </div>

          {/* Demo Accounts Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 Tip: Create a parent account to get started!
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white mt-6 text-sm">
          © 2025 Play, Learn & Protect. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;