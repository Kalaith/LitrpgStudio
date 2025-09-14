import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { WritingSession } from './WritingSession';
import { WritingGoals } from './WritingGoals';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface WritingAnalyticsProps {
  className?: string;
}

type ViewMode = 'overview' | 'session' | 'goals' | 'insights';
type TimeRange = 'week' | 'month' | 'quarter' | 'year';

export const WritingAnalytics: React.FC<WritingAnalyticsProps> = ({ className = '' }) => {
  const {
    sessions,
    streak,
    insights,
    generateInsights,
    getWritingPaceData,
    getChapterCompletionRates,
    getTimeOfDayStats,
    getTotalWordsWritten,
    getAverageSessionDuration,
    calculateDailyStats,
  } = useAnalyticsStore();

  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // Generate insights on component mount
  useEffect(() => {
    generateInsights();
  }, [generateInsights]);

  // Get data for charts based on time range
  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'quarter':
        startDate = subDays(now, 90);
        break;
      case 'year':
        startDate = subDays(now, 365);
        break;
    }

    const dateRange = eachDayOfInterval({ start: startDate, end: now });
    const dailyData = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return calculateDailyStats(dateStr);
    });

    return {
      labels: dailyData.map(d => format(new Date(d.date), 'MMM dd')),
      datasets: [
        {
          label: 'Words Written',
          data: dailyData.map(d => d.wordsWritten),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
        },
        {
          label: 'Sessions',
          data: dailyData.map(d => d.sessionsCount),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  }, [timeRange, sessions, calculateDailyStats]);

  // Writing pace chart data
  const paceData = useMemo(() => {
    const data = getWritingPaceData();
    const recentSessions = data.sessionsData.slice(-14); // Last 14 sessions

    return {
      labels: recentSessions.map(s => format(new Date(s.date), 'MMM dd')),
      datasets: [
        {
          label: 'Words per Minute',
          data: recentSessions.map(s => s.wpm),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [getWritingPaceData]);

  // Time of day productivity chart
  const timeOfDayData = useMemo(() => {
    const stats = getTimeOfDayStats();
    const hours = stats.filter(s => s.sessionsCount > 0);

    return {
      labels: hours.map(s => `${s.hour}:00`),
      datasets: [
        {
          label: 'Productivity Score',
          data: hours.map(s => s.productivityScore),
          backgroundColor: hours.map(s => {
            const intensity = s.productivityScore / 100;
            return `rgba(251, 191, 36, ${0.3 + intensity * 0.7})`;
          }),
          borderColor: 'rgb(251, 191, 36)',
          borderWidth: 1,
        },
      ],
    };
  }, [getTimeOfDayStats]);

  // Chapter completion rates
  const chapterCompletionData = useMemo(() => {
    const rates = getChapterCompletionRates();
    const topChapters = rates
      .sort((a, b) => b.completionPercentage - a.completionPercentage)
      .slice(0, 10);

    return {
      labels: topChapters.map(c => `${c.storyTitle}: ${c.chapterTitle}`.slice(0, 30) + '...'),
      datasets: [
        {
          data: topChapters.map(c => c.completionPercentage),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
            '#4BC0C0', '#FF6384',
          ],
          hoverBackgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
            '#4BC0C0', '#FF6384',
          ],
        },
      ],
    };
  }, [getChapterCompletionRates]);

  const totalWords = getTotalWordsWritten();
  const avgSessionDuration = getAverageSessionDuration();
  const paceData_obj = getWritingPaceData();

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {totalWords.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Words</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {streak.current}
          </div>
          <div className="text-sm text-gray-600">Day Streak</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {paceData_obj.recentWPM}
          </div>
          <div className="text-sm text-gray-600">Avg WPM</div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">
            {avgSessionDuration}
          </div>
          <div className="text-sm text-gray-600">Avg Session (min)</div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-center space-x-2">
        {(['week', 'month', 'quarter', 'year'] as TimeRange[]).map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Progress Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Daily Writing Progress
          </h3>
          <div className="h-64">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    type: 'linear' as const,
                    display: true,
                    position: 'left' as const,
                    title: {
                      display: true,
                      text: 'Words Written',
                    },
                  },
                  y1: {
                    type: 'linear' as const,
                    display: true,
                    position: 'right' as const,
                    title: {
                      display: true,
                      text: 'Sessions',
                    },
                    grid: {
                      drawOnChartArea: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Writing Pace Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Writing Pace Trend
          </h3>
          <div className="h-64">
            <Line
              data={paceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Words per Minute',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Time of Day Productivity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Productivity by Time of Day
          </h3>
          <div className="h-64">
            <Bar
              data={timeOfDayData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: 'Productivity Score',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Chapter Completion */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Chapter Completion Rates
          </h3>
          <div className="h-64">
            {chapterCompletionData.labels.length > 0 ? (
              <Doughnut
                data={chapterCompletionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right' as const,
                      labels: {
                        boxWidth: 12,
                        font: {
                          size: 10,
                        },
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📝</div>
                  <div>No chapters to display</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Writing Insights
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.slice(0, 6).map(insight => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{insight.title}</h4>
                  <span className={`text-sm ${
                    insight.trend === 'up' ? 'text-green-600' :
                    insight.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {insight.trend === 'up' ? '↗' : insight.trend === 'down' ? '↘' : '→'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                <div className="text-lg font-bold text-blue-600">{insight.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Streak Information */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Writing Streak</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {streak.current} days
            </div>
            <div className="text-sm text-gray-600">Current streak</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {streak.longest} days
            </div>
            <div className="text-sm text-gray-600">Longest streak</div>
          </div>

          <div className="text-4xl">
            {streak.current >= 7 ? '🔥' : streak.current >= 3 ? '📝' : '💪'}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Writing Analytics</h1>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'session', label: 'Writing Session', icon: '✍️' },
              { key: 'goals', label: 'Goals', icon: '🎯' },
              { key: 'insights', label: 'Insights', icon: '💡' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as ViewMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                  viewMode === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'overview' && renderOverview()}
          {viewMode === 'session' && (
            <div className="max-w-2xl mx-auto">
              <WritingSession />
            </div>
          )}
          {viewMode === 'goals' && <WritingGoals />}
          {viewMode === 'insights' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Detailed Insights</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {insights.map(insight => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-800">
                        {insight.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        insight.trend === 'up' ? 'bg-green-100 text-green-800' :
                        insight.trend === 'down' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {insight.period}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{insight.description}</p>
                    <div className="text-2xl font-bold text-blue-600">
                      {insight.value}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Generated: {format(insight.date, 'MMM dd, yyyy')}
                    </div>
                  </motion.div>
                ))}

                {insights.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">💡</div>
                    <div className="text-lg font-medium mb-2">No insights yet</div>
                    <div className="text-sm">
                      Start writing and tracking sessions to generate insights!
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};