// src/pages/AddChildPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { childrenAPI } from '../services/api';
import { getAgeGroup } from '../utils/helpers';
import { useTranslation } from '../utils/translations';

const AddChildPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    dateOfBirth: '',
    gender: 'other',
    gradeLevel: '',
    school: '',
    dailyScreenTimeLimit: 120
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
    if (!formData.name || !formData.username || !formData.dateOfBirth) {
      setError(t('fillRequiredFields'));
      setLoading(false);
      return;
    }

    // Calculate age group
    const ageGroup = getAgeGroup(formData.dateOfBirth);

    if (!ageGroup) {
      setError(t('ageRestriction'));
      setLoading(false);
      return;
    }

    try {
      await childrenAPI.create({
        ...formData,
        ageGroup
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('failedToAddChild'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👶</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('addChildAccount')}</h1>
            <p className="text-gray-600">{t('createChildAccountSubtitle')}</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Child's Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('childFullName')} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="Omar Ahmed"
                  disabled={loading}
                />
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('username')} *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="omar123"
                  disabled={loading}
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('dateOfBirth')} *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  disabled={loading}
                />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('gender')}
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  disabled={loading}
                >
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('preferNotToSay')}</option>
                </select>
              </div>

              {/* Grade Level */}
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('gradeLevel')}
                </label>
                <input
                  type="text"
                  id="gradeLevel"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="Grade 4"
                  disabled={loading}
                />
              </div>

              {/* School */}
              <div>
                <label htmlFor="school" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('schoolName')}
                </label>
                <input
                  type="text"
                  id="school"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="Cairo International School"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Screen Time Limit */}
            <div>
              <label htmlFor="dailyScreenTimeLimit" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('dailyScreenTimeLimit')}
              </label>
              <input
                type="number"
                id="dailyScreenTimeLimit"
                name="dailyScreenTimeLimit"
                value={formData.dailyScreenTimeLimit}
                onChange={handleChange}
                min="30"
                max="480"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-2">
                {t('recommendedScreenTime')}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('adding')}
                  </>
                ) : (
                  <>
                    <span>➕</span>
                    <span>{t('addChild')}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AddChildPage;