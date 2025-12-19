// src/pages/LearningPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { learningAPI } from '../services/api';
import { getCategoryColor, truncate } from '../utils/helpers';

const LearningPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '',
    ageGroup: '',
    difficulty: ''
  });

  useEffect(() => {
    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await learningAPI.getAll(filters);
      setModules(response.data.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };

  const handleViewModule = (moduleId) => {
    navigate(`/learning/${moduleId}`);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 Learning Modules</h1>
            <p className="text-gray-600 text-lg">
              {user?.role === 'teacher'
                ? 'View and manage learning modules for your students'
                : 'Structured courses to master new skills'
              }
            </p>
          </div>
          {user?.role === 'teacher' && (
            <Button onClick={() => navigate('/learning/create')}>
              ➕ Create New Module
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="">All Subjects</option>
                <option value="Maths">Maths</option>
                <option value="Biology">Biology</option>
                <option value="English">English</option>
                <option value="Arabic">Arabic</option>
                <option value="Coding">Coding</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>

            {/* Age Group */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age Group
              </label>
              <select
                value={filters.ageGroup}
                onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="">All Ages</option>
                <option value="3-5">3-5 years</option>
                <option value="6-8">6-8 years</option>
                <option value="9-12">9-12 years</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Modules Grid */}
        {loading ? (
          <Loading />
        ) : modules.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No modules found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <Card
                key={module._id}
                className="cursor-pointer hover:shadow-2xl transition-all"
                onClick={() => handleViewModule(module._id)}
              >
                {/* Module Thumbnail */}
                <div
                  className={`relative mb-4 rounded-lg overflow-hidden h-48 flex items-center justify-center ${getCategoryColor(
                    module.subject
                  )}`}
                >
                  <div className="text-7xl">
                    {module.subject === 'Maths' && '🔢'}
                    {module.subject === 'Biology' && '🔬'}
                    {module.subject === 'Arabic' && '📚'}
                    {module.subject === 'English' && '📚'}
                    {module.subject === 'Coding' && '💻'}
                    {module.subject === 'Physics' && '⚛️'}
                    {module.subject === 'Chemistry' && '🧪'}
                  </div>

                  <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-white bg-opacity-90 text-gray-800 text-xs font-semibold capitalize">
                    {module.subject}
                  </div>
                </div>

                {/* Module Info */}
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {(user?.language === 'ar' && module.titleArabic) ? module.titleArabic : module.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {truncate((user?.language === 'ar' && module.descriptionArabic) ? module.descriptionArabic : module.description, 100)}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>⭐ {(module.averageRating ?? 0).toFixed(1)}</span>
                  <span>👥 {module.enrollmentCount ?? 0} enrolled</span>
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex gap-2">
                    {module.ageGroups?.map((age, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold"
                      >
                        {age} years
                      </span>
                    ))}
                  </div>

                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold capitalize">
                    {module.difficulty}
                  </span>
                </div>

                {/* Lessons Count */}
                <div className="mb-4 text-sm text-gray-600">
                  📝 {module.lessons?.length ?? 0} lessons
                </div>

                {/* Action Buttons */}
                {user?.role === 'teacher' ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      fullWidth
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewModule(module._id);
                      }}
                    >
                      <span>👁️</span> View
                    </Button>
                    {(typeof module.createdBy === 'object' ? module.createdBy._id === user._id : module.createdBy === user._id) && (
                      <Button
                        size="sm"
                        fullWidth
                        variant="primary" // Different variant to distinguish
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/learning/edit/${module._id}`);
                        }}
                      >
                        <span>✏️</span> Edit
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewModule(module._id);
                    }}
                  >
                    Start Learning →
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPage;