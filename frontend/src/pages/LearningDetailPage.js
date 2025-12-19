// src/pages/LearningDetailPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { learningAPI, childrenAPI, progressAPI } from '../services/api';
import { getCategoryColor } from '../utils/helpers';

const LearningDetailPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [module, setModule] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [completingLesson, setCompletingLesson] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  useEffect(() => {
    if (selectedChild && moduleId) {
      fetchProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild, moduleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const moduleRes = await learningAPI.getOne(moduleId);
      setModule(moduleRes.data.data);

      // Only fetch children if user is parent (not teacher)
      if (user?.role === 'parent') {
        const childrenRes = await childrenAPI.getAll();
        setChildren(childrenRes.data.data);

        if (childrenRes.data.data.length > 0) {
          setSelectedChild(childrenRes.data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching module:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    if (!selectedChild) return;

    try {
      const response = await progressAPI.getChildProgress(selectedChild);
      const moduleProgress = response.data.data.find(
        p => p.learningModule?._id === moduleId
      );
      setProgress(moduleProgress);
    } catch (error) {
      console.error('Error fetching progress:', error);
      setProgress(null);
    }
  };

  const handleEnroll = async () => {
    if (!selectedChild) {
      alert('Please select a child');
      return;
    }

    try {
      await learningAPI.enroll(moduleId, selectedChild);

      const updatedModule = await learningAPI.getOne(moduleId);
      setModule(updatedModule.data.data);

      await fetchProgress();
    } catch (error) {
      console.error('Error enrolling:', error);
    }

  };

  const handleLessonClick = (lesson) => {
    if (user?.role === 'teacher') {
      // Teachers can view lessons without selecting a child
      window.open(lesson.content, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!selectedChild) {
      alert('Please select a child first');
      return;
    }

    window.open(lesson.content, '_blank', 'noopener,noreferrer');
  };

  const handleMarkComplete = async (lessonNumber) => {
    if (!selectedChild) {
      alert('Please select a child');
      return;
    }

    try {
      setCompletingLesson(lessonNumber);
      await progressAPI.completeLesson(moduleId, selectedChild, lessonNumber);
      await fetchProgress(); // Refetch to update UI
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      alert('Failed to mark lesson as complete. Please try again.');
    } finally {
      setCompletingLesson(null);
    }
  };

  const isLessonCompleted = (lessonNumber) => {
    if (!progress || !progress.lessonsCompleted) return false;
    return progress.lessonsCompleted.some(l => l.lessonNumber === lessonNumber);
  };

  const getCompletedLessonsCount = () => {
    return progress?.lessonsCompleted?.length || 0;
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

  const completedCount = getCompletedLessonsCount();
  const totalLessons = module.lessons?.length || 0;
  const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

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
                  {module.subject === 'Maths' && '🔢'}
                  {module.subject === 'Biology' && '🔬'}
                  {module.subject === 'Arabic' && '📚'}
                  {module.subject === 'English' && '📚'}
                  {module.subject === 'Coding' && '💻'}
                  {module.subject === 'Physics' && '⚛️'}
                  {module.subject === 'Chemistry' && '🧪'}
                </div>

                <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white bg-opacity-90 text-gray-800 font-semibold capitalize">
                  {module.subject}
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {(user?.language === 'ar' && module.titleArabic) ? module.titleArabic : module.title}
              </h1>

              {/* Progress Bar - Only for parents */}
              {user?.role === 'parent' && progress && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Progress: {completedCount} / {totalLessons} lessons
                    </span>
                    <span className="text-sm font-semibold text-purple-600">
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div className="flex items-center gap-6 mb-6">
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
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {user?.language === 'ar' ? 'حول هذه الدورة' : 'About This Course'}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {(user?.language === 'ar' && module.descriptionArabic) ? module.descriptionArabic : module.description}
                </p>
              </div>

              {/* Learning Objectives */}
              {((user?.language === 'ar' && module.learningObjectivesArabic?.length > 0) || (module.learningObjectives?.length > 0)) && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {user?.language === 'ar' ? 'ماذا ستتعلم' : "What You'll Learn"}
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {(user?.language === 'ar' && module.learningObjectivesArabic?.length > 0)
                      ? module.learningObjectivesArabic.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))
                      : module.learningObjectives?.map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))
                    }
                  </ul>
                </div>
              )}

              {/* Lessons List */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Course Content</h3>
                <div className="space-y-3">
                  {module.lessons?.map((lesson, index) => {
                    const isCompleted = isLessonCompleted(lesson.lessonNumber);
                    const isCompleting = completingLesson === lesson.lessonNumber;

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 transition-all ${isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isCompleted
                              ? 'bg-green-500 text-white'
                              : 'bg-purple-500 text-white'
                              }`}>
                              {isCompleted ? '✓' : lesson.lessonNumber}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">
                                {(user?.language === 'ar' && lesson.titleArabic) ? lesson.titleArabic : lesson.title}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {lesson.contentType} • {lesson.duration} min
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-gray-400 text-2xl">
                              {lesson.contentType === 'video' && '🎥'}
                              {lesson.contentType === 'quiz' && '📝'}
                              {lesson.contentType === 'interactive' && '🎮'}
                              {lesson.contentType === 'text' && '📄'}
                            </div>

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleLessonClick(lesson)}
                              className="mr-2"
                            >
                              {lesson.contentType === 'video' ? 'Watch' : 'Start'}
                            </Button>

                            {user?.role === 'parent' && !isCompleted && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkComplete(lesson.lessonNumber)}
                                disabled={isCompleting}
                              >
                                {isCompleting ? 'Marking...' : 'Complete'}
                              </Button>
                            )}

                            {user?.role === 'parent' && isCompleted && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                Completed ✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {user?.role === 'teacher' ? 'Module Info' : 'Enroll Now'}
              </h3>

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

              {/* Select Child - Only for parents */}
              {user?.role === 'parent' && children.length > 0 && (
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

              {/* Action Button */}
              {/* Action Button */}
              {user?.role === 'parent' && (
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleEnroll}
                  disabled={!selectedChild || progress}
                  className={progress ? "bg-green-600 hover:bg-green-700 cursor-default" : ""}
                >
                  <span className="text-2xl">{progress ? '' : ''}</span>
                  <span>{progress ? 'Enrolled' : 'Enroll'}</span>
                </Button>
              )}



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
                <p className="text-xs text-gray-500 mt-1">
                  +{module.pointsPerLesson ?? 0} points per lesson
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