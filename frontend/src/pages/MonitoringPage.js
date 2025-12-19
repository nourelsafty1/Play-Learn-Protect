// src/pages/MonitoringPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { childrenAPI, monitoringAPI } from '../services/api';
import { formatDuration } from '../utils/helpers';
import { useTranslation } from '../utils/translations';

const MonitoringPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { childId: urlChildId } = useParams(); // Get childId from URL if present
  
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  useEffect(() => {
    fetchChildren();
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (urlChildId) {
      setSelectedChild(urlChildId);
    }
  }, [urlChildId]);

  useEffect(() => {
    if (selectedChild) {
      fetchAnalytics();
    }
  }, [selectedChild, period]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await childrenAPI.getAll();
      const childrenData = response.data.data;
      setChildren(childrenData);

      if (childrenData.length > 0) {
        // Use URL childId if present, otherwise use first child
        if (urlChildId && childrenData.find(c => c._id === urlChildId)) {
          setSelectedChild(urlChildId);
        } else {
          setSelectedChild(childrenData[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await monitoringAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [screenTime, learning, safety] = await Promise.all([
        monitoringAPI.getScreenTime(selectedChild, period),
        monitoringAPI.getLearningAnalytics(selectedChild, period),
        monitoringAPI.getSafetyAnalytics(selectedChild, period)
      ]);

      setAnalytics({
        screenTime: screenTime.data.data,
        learning: learning.data.data,
        safety: safety.data.data
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <>
        <Navbar />
        <Loading />
      </>
    );
  }

  const selectedChildData = children.find(c => c._id === selectedChild);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 {t('monitoringDashboard')}</h1>
          <p className="text-gray-600 text-lg">{t('trackActivity')}</p>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Child Selector */}
            <div className="flex-1 w-full md:w-auto">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('selectChild')}
              </label>
              <select
                value={selectedChild || ''}
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

            {/* Period Selector */}
            <div className="flex-1 w-full md:w-auto">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('timePeriod')}
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="7">{t('last7Days')}</option>
                <option value="30">{t('last30Days')}</option>
                <option value="90">{t('last3Months')}</option>
              </select>
            </div>

            {/* View Details Button */}
            <div className="flex-1 w-full md:w-auto flex items-end">
              <Button
                onClick={() => navigate(`/monitoring/${selectedChild}`)}
                disabled={!selectedChild}
                className="w-full"
              >
                {t('viewDetailedReport')} →
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Loading />
        ) : analytics ? (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-center">
                <div className="text-3xl mb-2">⏰</div>
                <div className="text-4xl font-bold mb-2">{analytics.screenTime.totalTime}{t('min')}</div>
                <div className="text-sm opacity-90">{t('totalScreenTime')}</div>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white text-center">
                <div className="text-3xl mb-2">🎮</div>
                <div className="text-4xl font-bold mb-2">{analytics.learning.totalActivities}</div>
                <div className="text-sm opacity-90">{t('activitiesCompleted')}</div>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white text-center">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-4xl font-bold mb-2">{analytics.learning.modules.completed}</div>
                <div className="text-sm opacity-90">{t('modulesCompleted')}</div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-center">
                <div className="text-3xl mb-2">🛡️</div>
                <div className="text-4xl font-bold mb-2">{analytics.safety.safetyScore}</div>
                <div className="text-sm opacity-90">{t('safetyScore')}</div>
              </Card>
            </div>

            {/* Screen Time Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card title={`⏰ ${t('screenTimeBreakdown')}`}>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">{t('games')}</span>
                      <span className="font-semibold">{Math.round(analytics.screenTime.activityBreakdown.games)}{t('min')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(analytics.screenTime.activityBreakdown.games / analytics.screenTime.totalTime) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">{t('learning')}</span>
                      <span className="font-semibold">{Math.round(analytics.screenTime.activityBreakdown.learning)}{t('min')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(analytics.screenTime.activityBreakdown.learning / analytics.screenTime.totalTime) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">{t('creative')}</span>
                      <span className="font-semibold">{Math.round(analytics.screenTime.activityBreakdown.creative)}{t('min')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(analytics.screenTime.activityBreakdown.creative / analytics.screenTime.totalTime) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Learning Progress */}
              <Card title={`📊 ${t('learningProgress')}`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('gamesCompleted')}</span>
                    <span className="text-2xl font-bold text-blue-600">{analytics.learning.games.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('averageGameScore')}</span>
                    <span className="text-2xl font-bold text-green-600">{analytics.learning.games.averageScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('modulesCompleted')}</span>
                    <span className="text-2xl font-bold text-purple-600">{analytics.learning.modules.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('averageModuleScore')}</span>
                    <span className="text-2xl font-bold text-pink-600">{analytics.learning.modules.averageScore}%</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Safety Summary */}
            <Card title={`🛡️ ${t('safetySummary')}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="text-2xl font-bold text-green-600">{analytics.safety.safetyScore}/100</div>
                  <div className="text-sm text-gray-600">{t('safetyScore')}</div>
                </div>

                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-4xl mb-2">🚨</div>
                  <div className="text-2xl font-bold text-yellow-600">{analytics.safety.totalAlerts}</div>
                  <div className="text-sm text-gray-600">{t('totalAlerts')}</div>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-4xl mb-2">⚠️</div>
                  <div className="text-2xl font-bold text-red-600">{analytics.safety.unresolvedAlerts}</div>
                  <div className="text-sm text-gray-600">{t('unresolvedAlerts')}</div>
                </div>
              </div>

              {analytics.safety.unresolvedAlerts > 0 && (
                <div className="mt-6">
                  <Button
                    variant="danger"
                    onClick={() => navigate(`/safety/${selectedChild}`)}
                    fullWidth
                  >
                    <span>⚠️</span>
                    <span>{t('viewSafetyAlerts')}</span>
                  </Button>
                </div>
              )}
            </Card>

            {/* Recent Activities */}
            {dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 && (
              <Card title="📋 Recent Activities">
                <div className="space-y-3">
                  {dashboardData.recentActivities
                    .filter(activity => !selectedChild || activity.childId === selectedChild || activity.childId?._id === selectedChild)
                    .slice(0, 10)
                    .map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {activity.activityType === 'game' ? '🎮' : 
                             activity.activityType === 'learning-module' ? '📚' : 
                             activity.activityType === 'creative' ? '🎨' : '📱'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {activity.activityType === 'game' && activity.game?.title ? activity.game.title :
                               activity.activityType === 'learning-module' && activity.learningModule?.title ? activity.learningModule.title :
                               activity.activityType}
                            </div>
                            <div className="text-sm text-gray-500">
                              {activity.startTime ? new Date(activity.startTime).toLocaleString() : 
                               activity.sessionStartTime ? new Date(activity.sessionStartTime).toLocaleString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {activity.score !== undefined && (
                            <div className="font-semibold text-blue-600">Score: {activity.score}</div>
                          )}
                          {activity.duration && (
                            <div className="text-sm text-gray-500">{Math.round(activity.duration / 60)}m</div>
                          )}
                          {activity.completed && (
                            <div className="text-xs text-green-600">✓ Completed</div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('noDataAvailable')}</h3>
              <p className="text-gray-500">{t('addChildToObserve')}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MonitoringPage;