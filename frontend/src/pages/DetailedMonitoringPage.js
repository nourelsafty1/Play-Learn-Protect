// src/pages/DetailedMonitoringPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { monitoringAPI, childrenAPI } from '../services/api';

const DetailedMonitoringPage = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  
  const [child, setChild] = useState(null);
  const [screenTimeData, setScreenTimeData] = useState(null);
  const [learningData, setLearningData] = useState(null);
  const [safetyData, setSafetyData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('7');

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch child info
      const childrenRes = await childrenAPI.getAll();
      const childData = childrenRes.data.data.find(c => c._id === childId);
      if (!childData) {
        setChild(null);
        setError('Child not found or you do not have access.');
        setLoading(false);
        return;
      }
      setChild(childData);

      // Fetch all analytics
      const [screenTime, learning, safety, sessionsRes] = await Promise.all([
        monitoringAPI.getScreenTime(childId, period),
        monitoringAPI.getLearningAnalytics(childId, period),
        monitoringAPI.getSafetyAnalytics(childId, period),
        monitoringAPI.getSessions(childId, { limit: 50 })
      ]);

      setScreenTimeData(screenTime.data.data);
      setLearningData(learning.data.data);
      setSafetyData(safety.data.data);
      setSessions(sessionsRes.data.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching detailed data:', error);
      setError(error.response?.data?.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [childId, period]);

  useEffect(() => {
    if (childId) {
      fetchAllData();
    }
  }, [childId, period, fetchAllData]);

  if (loading) {
    return (
      <>
        <Navbar />
        <Loading />
      </>
    );
  }

  if (error || !child) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">{error || 'Child not found'}</h3>
              <Button onClick={() => navigate('/monitoring')}>Back to Monitoring</Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button onClick={() => navigate('/monitoring')} variant="outline" className="mb-4">
              ← Back to Monitoring
            </Button>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              📊 Detailed Report: {child.name}
            </h1>
            <p className="text-gray-600 text-lg">Comprehensive activity and progress analysis</p>
          </div>
          
          {/* Period Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Time Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
            </select>
          </div>
        </div>

        {/* Screen Time Analysis */}
        {screenTimeData ? (
          <Card title="⏰ Screen Time Analysis" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{screenTimeData.totalTime}m</div>
                <div className="text-sm text-gray-600">Total Screen Time</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{screenTimeData.totalSessions}</div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{Math.round(screenTimeData.averageSessionTime)}m</div>
                <div className="text-sm text-gray-600">Avg Session Time</div>
              </div>
            </div>

            {/* Daily Breakdown Chart */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Daily Screen Time Breakdown</h3>
              <div className="space-y-3">
                {screenTimeData.dailyBreakdown && screenTimeData.dailyBreakdown.length > 0 ? (
                  screenTimeData.dailyBreakdown.map((day, index) => {
                    const maxMinutes = Math.max(...screenTimeData.dailyBreakdown.map(d => d.minutes));
                    const percentage = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            {day.minutes > 0 && (
                              <span className="text-xs text-white font-semibold">{Math.round(day.minutes)}m</span>
                            )}
                          </div>
                        </div>
                        <div className="w-16 text-right text-sm font-semibold">{Math.round(day.minutes)}m</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">No data available for this period</div>
                )}
              </div>
            </div>

            {/* Activity Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Activity Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl mb-2">🎮</div>
                  <div className="text-xl font-bold text-blue-600">{Math.round(screenTimeData.activityBreakdown.games)}m</div>
                  <div className="text-xs text-gray-600">Games</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="text-xl font-bold text-green-600">{Math.round(screenTimeData.activityBreakdown.learning)}m</div>
                  <div className="text-xs text-gray-600">Learning</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="text-xl font-bold text-purple-600">{Math.round(screenTimeData.activityBreakdown.creative)}m</div>
                  <div className="text-xs text-gray-600">Creative</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl mb-2">📱</div>
                  <div className="text-xl font-bold text-gray-600">{Math.round(screenTimeData.activityBreakdown.other)}m</div>
                  <div className="text-xs text-gray-600">Other</div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="⏰ Screen Time Analysis" className="mb-8">
            <div className="text-center py-8 text-gray-500">
              No screen time data available for this period
            </div>
          </Card>
        )}

        {/* Learning Progress */}
        {learningData ? (
          <Card title="📚 Learning Progress" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Games</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700">Completed</span>
                    <span className="text-2xl font-bold text-blue-600">{learningData.games.completed}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-gray-700">In Progress</span>
                    <span className="text-2xl font-bold text-yellow-600">{learningData.games.inProgress}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Average Score</span>
                    <span className="text-2xl font-bold text-green-600">{learningData.games.averageScore}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Learning Modules</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-gray-700">Completed</span>
                    <span className="text-2xl font-bold text-purple-600">{learningData.modules.completed}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                    <span className="text-gray-700">In Progress</span>
                    <span className="text-2xl font-bold text-pink-600">{learningData.modules.inProgress}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                    <span className="text-gray-700">Average Score</span>
                    <span className="text-2xl font-bold text-indigo-600">{learningData.modules.averageScore}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Total Points Earned</span>
                <span className="text-3xl font-bold text-orange-600">{learningData.totalPointsEarned}</span>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="📚 Learning Progress" className="mb-8">
            <div className="text-center py-8 text-gray-500">
              No learning data available for this period
            </div>
          </Card>
        )}

        {/* Safety & Alerts */}
        {safetyData ? (
          <Card title="🛡️ Safety & Alerts" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{safetyData.safetyScore}/100</div>
                <div className="text-sm text-gray-600">Safety Score</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{safetyData.totalAlerts}</div>
                <div className="text-sm text-gray-600">Total Alerts</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{safetyData.unresolvedAlerts}</div>
                <div className="text-sm text-gray-600">Unresolved</div>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="🛡️ Safety & Alerts" className="mb-8">
            <div className="text-center py-8 text-gray-500">
              No safety data available for this period
            </div>
          </Card>
        )}

        {/* Recent Sessions */}
        {sessions && sessions.length > 0 && (
          <Card title="📋 Recent Sessions">
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      session.isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {session.isActive ? '🟢' : '⚫'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {new Date(session.startTime).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Duration: {Math.round((session.duration || 0) / 60)}m | 
                        Activities: {session.activities?.length || 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {session.isActive && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DetailedMonitoringPage;

