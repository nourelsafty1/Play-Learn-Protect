// src/pages/LearningDetailPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../utils/translations';
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
  const { t } = useTranslation();

  const [module, setModule] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [completingLesson, setCompletingLesson] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);

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

        // Fetch remaining screen time for first child
        const child = childrenRes.data.data[0];
        if (child && child.dailyScreenTimeLimit !== undefined && child.screenTimeToday !== undefined) {
          setRemainingTime(Math.max(0, child.dailyScreenTimeLimit - (child.screenTimeToday || 0)));
        } else if (child) {
          // fallback: fetch from monitoringAPI
          const screenTimeRes = await monitoringAPI.getScreenTime(child._id, 1);
          const used = screenTimeRes.data.data?.totalTime || 0;
          setRemainingTime(Math.max(0, (child.dailyScreenTimeLimit || 120) - used));
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

      // Check if it's a screen time limit error
      if (error.response?.status === 403 && (error.response?.data?.limitReached || error.response?.data?.message?.includes('screen time'))) {
        const { timeUsed, limit, remaining } = error.response.data;
        const remainingTime = remaining !== undefined ? remaining : (limit - timeUsed);
        const message = remainingTime > 0
          ? `Screen time limit reached!\n\nYou've used ${timeUsed} out of ${limit} minutes today.\n\nYou have ${remainingTime} minutes remaining.\n\nPlease take a break and try again later.`
          : `Screen time limit reached!\n\nYou've used ${timeUsed} out of ${limit} minutes today.\n\nPlease take a break and try again tomorrow.`;
        alert(message);
      } else {
        alert('Failed to enroll in module. Please try again.');
      }
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

  const handleMarkComplete = async (lessonNumber, index) => {
    if (!selectedChild) {
      alert('Please select a child');
      return;
    }

    try {
      setCompletingLesson(index);
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
    return progress.lessonsCompleted.some(l => l.lessonNumber == lessonNumber);
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
            <p className="text-gray-600">{t('moduleNotFound')}</p>
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
        {/* Show remaining screen time */}
        {remainingTime !== null && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg text-center">
            <span className="text-lg font-semibold text-blue-700">
              {remainingTime > 0
                ? `${t('screenTimeRemaining')}: ${remainingTime} ${t('min')}`
                : t('screenTimeLimitReached')}
            </span>
          </div>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/learning')}
          className="mb-6"
        >
          ← {t('backToLearning')}
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
                  {t(module.subject?.toLowerCase() || 'subject')}
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
                      {t('progress')}: {completedCount} / {totalLessons} {t('lessons')}
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
                  <span className="text-gray-500 text-sm">{t('enrolled')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📝</span>
                  <span className="font-semibold">{module.lessons?.length ?? 0}</span>
                  <span className="text-gray-500 text-sm">{t('lessons')}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {t('aboutThisCourse')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {(user?.language === 'ar' && module.descriptionArabic) ? module.descriptionArabic : module.description}
                </p>
              </div>

              {/* Learning Objectives */}
              {((user?.language === 'ar' && module.learningObjectivesArabic?.length > 0) || (module.learningObjectives?.length > 0)) && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {t('whatYouWillLearn')}
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
                <h3 className="text-lg font-bold text-gray-800 mb-4">{t('courseContent')}</h3>
                <div className="space-y-3">
                  {module.lessons?.map((lesson, index) => {
                    const isCompleted = isLessonCompleted(lesson.lessonNumber);
                    const isCompleting = completingLesson === index;

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
                              {isCompleted ? '' : lesson.lessonNumber}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">
                                {(user?.language === 'ar' && lesson.titleArabic) ? lesson.titleArabic : lesson.title}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {t(lesson.contentType?.toLowerCase() || 'text')} • {lesson.duration} {t('min')}
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
                              {lesson.contentType === 'video' ? t('watch') : t('start')}
                            </Button>

                            {user?.role === 'parent' && !isCompleted && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkComplete(lesson.lessonNumber, index)}
                                disabled={isCompleting}
                              >
                                {isCompleting ? t('marking') : t('complete')}
                              </Button>
                            )}

                            {user?.role === 'parent' && isCompleted && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                {t('completed')} ✓
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
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{t('skillsGained')}</h3>
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
                {user?.role === 'teacher' ? 'Module Info' : t('enrollNow')}
              </h3>

              {/* Age Groups */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">{t('recommendedAges')}</p>
                <div className="flex flex-wrap gap-2">
                  {module.ageGroups?.map((age, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {age} {t('years')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">{t('difficulty')}</p>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm capitalize">
                  {t(module.difficulty?.toLowerCase() || 'difficulty')}
                </span>
              </div>

              {/* Select Child - Only for parents */}
              {user?.role === 'parent' && children.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('selectChild')}
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
                  <span>{progress ? t('enrolled') : t('enroll')}</span>
                </Button>
              )}



              {/* Certificate Info */}
              {module.certificate?.available && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">🏆 {t('certificateAvailable')}</p>
                  <p className="text-sm text-gray-600">
                    {t('completeCourseToEarnCert')}
                  </p>
                </div>
              )}

              {/* Points Info */}
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-gray-700 mb-1">{t('earnPoints')}</p>
                <p className="text-sm text-gray-600">
                  {t('completeCourseToEarn')} <span className="font-bold text-purple-600">{module.completionPoints ?? 0}</span> {t('points')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  +{module.pointsPerLesson ?? 0} {t('pointsPerLesson')}
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