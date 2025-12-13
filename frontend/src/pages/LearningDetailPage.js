// src/pages/LearningDetailPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { learningAPI, childrenAPI } from '../services/api';
import { getCategoryColor } from '../utils/helpers';

const LearningDetailPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [module, setModule] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [moduleRes, childrenRes] = await Promise.all([
        learningAPI.getOne(moduleId),
        childrenAPI.getAll()
      ]);
      
      setModule(moduleRes.data.data);
      setChildren(childrenRes.data.data);
      
      if (childrenRes.data.data.length > 0) {
        setSelectedChild(childrenRes.data.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching module:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedChild) {
      alert('Please select a child');
      return;
    }

    try {
      await learningAPI.enroll(moduleId, selectedChild);
      
      // Open the first lesson directly
      if (module.lessons && module.lessons.length > 0) {
        const firstLesson = module.lessons[0];
        window.open(firstLesson.content, '_blank', 'noopener,noreferrer');
      } else {
        alert('Successfully enrolled! Lessons coming soon.');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      
      // If already enrolled or error, just open first lesson anyway
      if (module.lessons && module.lessons.length > 0) {
        const firstLesson = module.lessons[0];
        window.open(firstLesson.content, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loading />
      </>
    );
  }

  if (!module) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Card>
            <p className="text-gray-600">Module not found</p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => navigate('/learning')}
          className="mb-6"
        >
          ← Back to Learning
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              {/* Module Banner */}
              <div
                className={`relative mb-6 rounded-lg overflow-hidden h-64 flex items-center justify-center ${getCategoryColor(
                  module.subject
                )}`}
              >
                <div className="text-8xl">
                  {module.subject === 'math' && '🔢'}
                  {module.subject === 'science' && '🔬'}
                  {module.subject === 'language' && '📚'}
                  {module.subject === 'coding' && '💻'}
                  {module.subject === 'physics' && '⚛️'}
                  {module.subject === 'chemistry' && '🧪'}
                  {module.subject === 'creative' && '🎨'}
                  {module.subject === 'logic' && '🧩'}
                </div>

                <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white bg-opacity-90 text-gray-800 font-semibold capitalize">
                  {module.subject}
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-4">{module.title}</h1>
              
              {/* Meta Info */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-semibold">{(module.averageRating ?? 0).toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">({module.totalRatings ?? 0} ratings)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span className="font-semibold">{module.enrollmentCount ?? 0}</span>
                  <span className="text-gray-500 text-sm">enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📝</span>
                  <span className="font-semibold">{module.lessons?.length ?? 0}</span>
                  <span className="text-gray-500 text-sm">lessons</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">About This Course</h3>
                <p className="text-gray-600 leading-relaxed">{module.description}</p>
              </div>

              {/* Learning Objectives */}
              {module.learningObjectives && module.learningObjectives.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">What You'll Learn</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {module.learningObjectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lessons List */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Course Content</h3>
                <div className="space-y-3">
                  {module.lessons?.map((lesson, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                          {lesson.lessonNumber}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{lesson.title}</h4>
                          <p className="text-sm text-gray-500">
                            {lesson.contentType} • {lesson.duration} min
                          </p>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {lesson.contentType === 'video' && '🎥'}
                        {lesson.contentType === 'quiz' && '📝'}
                        {lesson.contentType === 'interactive' && '🎮'}
                        {lesson.contentType === 'text' && '📄'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              {module.skills && module.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Skills You'll Gain</h3>
                  <div className="flex flex-wrap gap-2">
                    {module.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Enroll Now</h3>

              {/* Age Groups */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Recommended Ages</p>
                <div className="flex flex-wrap gap-2">
                  {module.ageGroups?.map((age, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {age} years
                    </span>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Difficulty</p>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm capitalize">
                  {module.difficulty}
                </span>
              </div>

              {/* Select Child */}
              {children.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Child
                  </label>
                  <select
                    value={selectedChild}
                    onChange={(e) => setSelectedChild(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    {children.map((child) => (
                      <option key={child._id} value={child._id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Enroll Button */}
              <Button 
                fullWidth 
                size="lg"
                onClick={handleEnroll}
                disabled={!selectedChild}
              >
                <span className="text-2xl">🎓</span>
                <span>Enroll Now</span>
              </Button>

              {/* Certificate Info */}
              {module.certificate?.available && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">🏆 Certificate Available!</p>
                  <p className="text-sm text-gray-600">
                    Complete this course to earn a certificate
                  </p>
                </div>
              )}

              {/* Points Info */}
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-gray-700 mb-1">Earn Points!</p>
                <p className="text-sm text-gray-600">
                  Complete this course to earn <span className="font-bold text-purple-600">{module.completionPoints ?? 0}</span> points
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningDetailPage;