import React from 'react';
import { motion } from 'framer-motion';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { format } from 'date-fns';

interface AnalyticsDashboardWidgetProps {
  onViewAnalytics?: () => void;
  className?: string;
}

export const AnalyticsDashboardWidget: React.FC<AnalyticsDashboardWidgetProps> = ({
  onViewAnalytics,
  className = '',
}) => {
  const {
    currentSession,
    isTrackingSession,
    streak,
    goals,
    getTotalWordsWritten,
    getWritingPaceData,
    sessions,
  } = useAnalyticsStore();

  const totalWords = getTotalWordsWritten();
  const paceData = getWritingPaceData();
  const activeGoals = goals.filter(g => g.isActive);
  const todaySessions = sessions.filter(s =>
    s.date === format(new Date(), 'yyyy-MM-dd') && !s.isActive
  );
  const todayWords = todaySessions.reduce((sum, s) => sum + s.wordsWritten, 0);

  const getStreakEmoji = (streakCount: number) => {
    if (streakCount >= 30) return '🏆';
    if (streakCount >= 14) return '🔥';
    if (streakCount >= 7) return '⚡';
    if (streakCount >= 3) return '📝';
    return '💪';
  };

  const getGoalProgress = () => {
    if (activeGoals.length === 0) return 0;
    const totalProgress = activeGoals.reduce((sum, goal) => {
      return sum + (goal.current / goal.target) * 100;
    }, 0);
    return Math.round(totalProgress / activeGoals.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Writing Analytics</h3>
        {onViewAnalytics && (
          <button
            onClick={onViewAnalytics}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Details →
          </button>
        )}
      </div>

      {/* Current Session Status */}
      {currentSession && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-6 p-4 rounded-lg ${
            isTrackingSession
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">
                {isTrackingSession ? '🟢 Active Session' : '⏸️ Session Paused'}
              </div>
              <div className="text-sm text-gray-600">
                {currentSession.wordsWritten} / {currentSession.wordTarget} words
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {Math.round((currentSession.wordsWritten / currentSession.wordTarget) * 100)}%
              </div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {todayWords.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Words Today</div>
        </div>

        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {totalWords.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">Total Words</div>
        </div>

        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center">
            <span className="text-lg mr-1">{getStreakEmoji(streak.current)}</span>
            <span className="text-2xl font-bold text-purple-600">
              {streak.current}
            </span>
          </div>
          <div className="text-xs text-gray-600">Day Streak</div>
        </div>

        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {paceData.recentWPM}
          </div>
          <div className="text-xs text-gray-600">Avg WPM</div>
        </div>
      </div>

      {/* Goals Progress */}
      {activeGoals.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Goal Progress</span>
            <span className="text-sm text-gray-500">
              {activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <motion.div
              className="bg-blue-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(getGoalProgress(), 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="text-xs text-gray-500 text-center">
            {getGoalProgress()}% average completion
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>

        {todaySessions.length > 0 ? (
          <div className="space-y-2">
            {todaySessions.slice(-3).map((session) => (
              <div key={session.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {format(session.startTime, 'HH:mm')}
                  </span>
                </div>
                <div className="text-gray-800 font-medium">
                  +{session.wordsWritten} words
                </div>
              </div>
            ))}

            {todaySessions.length > 3 && (
              <div className="text-xs text-gray-500 text-center pt-2">
                ... and {todaySessions.length - 3} more sessions today
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <div className="text-2xl mb-1">📝</div>
            <div className="text-sm">No writing sessions today</div>
            {!currentSession && (
              <div className="text-xs mt-1">Start a session to begin tracking!</div>
            )}
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      {!currentSession && onViewAnalytics && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onViewAnalytics}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Start Writing Session
          </button>
        </div>
      )}
    </motion.div>
  );
};