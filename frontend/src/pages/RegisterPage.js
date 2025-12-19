// src/pages/RegisterPage.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { useTranslation } from '../utils/translations';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, lang, changeLanguage } = useTranslation();

  const isArabic = lang === 'ar';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'parent',
    phone: '',
    language: lang
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError(t('fillRequiredFields'));
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError(t('passwordLengthError'));
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        language: lang
      });

      if (result.success) {
        navigate('/dashboard');
      } else {
        // Show detailed error message
        const errorMsg = result.message || result.errors?.[0]?.msg || t('registrationFailed');
        setError(errorMsg);
      }
    } catch (err) {
      // Show specific validation errors from backend
      const errorMsg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.message
        || t('errorOccurredPleaseTryAgain');
      setError(errorMsg);
      console.error('Registration error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div key={lang} className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-2xl">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🎓</div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            {t('joinPlayLearnProtect')}
          </h1>
          <p className="text-white text-lg mt-2">{t('createAccountToday')}</p>
        </div>

        {/* Register Form Card */}
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
            {t('createAccount')}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Ahmed Mohamed"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('emailAddress')} *
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

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('phoneNumber')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="01234567890"
                  disabled={loading}
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('iamA')} *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  disabled={loading}
                >
                  <option value="parent">{t('parent')}</option>
                  <option value="teacher">{t('teacher')}</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('password')} *
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

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('confirmPassword')} *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              disabled={loading}
              className="mt-6"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('creatingAccount')}
                </>
              ) : (
                <>
                  <span>{t('createAccount')}</span>
                  <span>🚀</span>
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('alreadyHaveAccount')}{' '}
              <Link
                to="/login"
                className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                {t('loginHere')}
              </Link>
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

export default RegisterPage;