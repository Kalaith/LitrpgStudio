import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  format,
  startOfWeek,
  startOfMonth,
  differenceInMinutes,
  parseISO,
  isToday,
  isYesterday,
  subDays,
} from 'date-fns';
import type {
  AnalyticsStore,
  WritingSession,
  WritingGoal,
  WritingStreak,
  DailyWritingStats,
  WeeklyWritingStats,
  MonthlyWritingStats,
  ProductivityInsight,
  WritingPaceData,
  ChapterCompletionRate,
  TimeOfDayStats,
} from '../types/analytics';
import { useStoryStore } from './storyStore';

const generateId = () => crypto.randomUUID();

const getDateString = (date: Date = new Date()) => format(date, 'yyyy-MM-dd');

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      // State
      sessions: [],
      goals: [],
      streak: {
        current: 0,
        longest: 0,
        lastWritingDate: '',
      },
      dailyStats: {},
      insights: [],
      isTrackingSession: false,
      currentSession: null,

      // Session Management
      startSession: (storyId, chapterId, wordTarget = 500) => {
        const now = new Date();
        const story = useStoryStore.getState().stories.find(s => s.id === storyId);
        const initialWordCount = story?.wordCount || 0;

        const session: WritingSession = {
          id: generateId(),
          storyId,
          chapterId,
          startTime: now,
          wordTarget,
          wordsWritten: 0,
          initialWordCount,
          finalWordCount: initialWordCount,
          duration: 0,
          isActive: true,
          date: getDateString(now),
        };

        set({
          currentSession: session,
          isTrackingSession: true,
        });
      },

      endSession: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        const now = new Date();
        const duration = differenceInMinutes(now, currentSession.startTime);
        const story = useStoryStore.getState().stories.find(s => s.id === currentSession.storyId);
        const finalWordCount = story?.wordCount || currentSession.initialWordCount;
        const wordsWritten = Math.max(0, finalWordCount - currentSession.initialWordCount);

        const completedSession: WritingSession = {
          ...currentSession,
          endTime: now,
          duration,
          finalWordCount,
          wordsWritten,
          isActive: false,
        };

        set(state => ({
          sessions: [...state.sessions, completedSession],
          currentSession: null,
          isTrackingSession: false,
        }));

        // Update streak and daily stats
        get().updateStreak(completedSession.date);
        get().calculateDailyStats(completedSession.date);
      },

      updateSessionProgress: (currentWordCount) => {
        set(state => {
          if (!state.currentSession) return state;

          const wordsWritten = Math.max(0, currentWordCount - state.currentSession.initialWordCount);
          return {
            currentSession: {
              ...state.currentSession,
              wordsWritten,
              finalWordCount: currentWordCount,
            },
          };
        });
      },

      pauseSession: () => {
        set(state => ({
          isTrackingSession: false,
        }));
      },

      resumeSession: () => {
        set(state => ({
          isTrackingSession: true,
        }));
      },

      // Goal Management
      createGoal: (goalData) => {
        const goal: WritingGoal = {
          ...goalData,
          id: generateId(),
          current: 0,
          createdAt: new Date(),
        };

        set(state => ({
          goals: [...state.goals, goal],
        }));
      },

      updateGoal: (goalId, updates) => {
        set(state => ({
          goals: state.goals.map(goal =>
            goal.id === goalId ? { ...goal, ...updates } : goal
          ),
        }));
      },

      deleteGoal: (goalId) => {
        set(state => ({
          goals: state.goals.filter(goal => goal.id !== goalId),
        }));
      },

      markGoalComplete: (goalId) => {
        set(state => ({
          goals: state.goals.map(goal =>
            goal.id === goalId
              ? { ...goal, completedAt: new Date(), isActive: false }
              : goal
          ),
        }));
      },

      // Analytics Calculation
      calculateDailyStats: (date) => {
        const { sessions } = get();
        const daySessions = sessions.filter(s => s.date === date && !s.isActive);

        const stats: DailyWritingStats = {
          date,
          wordsWritten: daySessions.reduce((total, s) => total + s.wordsWritten, 0),
          sessionsCount: daySessions.length,
          totalMinutes: daySessions.reduce((total, s) => total + s.duration, 0),
          averageWPM: 0,
          goalsAchieved: 0,
          chaptersCompleted: [],
        };

        if (stats.totalMinutes > 0) {
          stats.averageWPM = Math.round(stats.wordsWritten / (stats.totalMinutes / 60));
        }

        // Update daily stats cache
        set(state => ({
          dailyStats: {
            ...state.dailyStats,
            [date]: stats,
          },
        }));

        return stats;
      },

      calculateWeeklyStats: (weekStart) => {
        const { sessions } = get();
        const weekEnd = format(subDays(parseISO(weekStart), -6), 'yyyy-MM-dd');
        const weekSessions = sessions.filter(
          s => s.date >= weekStart && s.date <= weekEnd && !s.isActive
        );

        const dailyStats: DailyWritingStats[] = [];
        for (let i = 0; i < 7; i++) {
          const date = format(subDays(parseISO(weekStart), -i), 'yyyy-MM-dd');
          dailyStats.push(get().calculateDailyStats(date));
        }

        const stats: WeeklyWritingStats = {
          weekStart,
          wordsWritten: dailyStats.reduce((total, d) => total + d.wordsWritten, 0),
          sessionsCount: dailyStats.reduce((total, d) => total + d.sessionsCount, 0),
          totalMinutes: dailyStats.reduce((total, d) => total + d.totalMinutes, 0),
          averageWPM: 0,
          goalsAchieved: dailyStats.reduce((total, d) => total + d.goalsAchieved, 0),
          dailyStats,
        };

        if (stats.totalMinutes > 0) {
          stats.averageWPM = Math.round(stats.wordsWritten / (stats.totalMinutes / 60));
        }

        return stats;
      },

      calculateMonthlyStats: (month) => {
        const monthStart = format(startOfMonth(parseISO(month + '-01')), 'yyyy-MM-dd');
        const { sessions } = get();
        const monthSessions = sessions.filter(
          s => s.date.startsWith(month) && !s.isActive
        );

        const weeklyStats: WeeklyWritingStats[] = [];
        let currentWeek = startOfWeek(parseISO(monthStart), { weekStartsOn: 1 });
        const monthEnd = parseISO(month + '-01');
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);

        while (currentWeek <= monthEnd) {
          const weekStart = format(currentWeek, 'yyyy-MM-dd');
          weeklyStats.push(get().calculateWeeklyStats(weekStart));
          currentWeek.setDate(currentWeek.getDate() + 7);
        }

        const stats: MonthlyWritingStats = {
          month,
          wordsWritten: weeklyStats.reduce((total, w) => total + w.wordsWritten, 0),
          sessionsCount: weeklyStats.reduce((total, w) => total + w.sessionsCount, 0),
          totalMinutes: weeklyStats.reduce((total, w) => total + w.totalMinutes, 0),
          averageWPM: 0,
          goalsAchieved: weeklyStats.reduce((total, w) => total + w.goalsAchieved, 0),
          weeklyStats,
        };

        if (stats.totalMinutes > 0) {
          stats.averageWPM = Math.round(stats.wordsWritten / (stats.totalMinutes / 60));
        }

        return stats;
      },

      updateStreak: (writingDate) => {
        const { streak } = get();
        const today = getDateString();
        const yesterday = getDateString(subDays(new Date(), 1));

        let newStreak = { ...streak };

        if (writingDate === today) {
          if (streak.lastWritingDate === yesterday || streak.lastWritingDate === today) {
            if (streak.lastWritingDate !== today) {
              newStreak.current = streak.current + 1;
            }
          } else {
            newStreak.current = 1;
          }
          newStreak.lastWritingDate = today;
        } else if (writingDate === yesterday && streak.lastWritingDate !== yesterday) {
          newStreak.current = streak.current + 1;
          newStreak.lastWritingDate = yesterday;
        }

        if (newStreak.current > newStreak.longest) {
          newStreak.longest = newStreak.current;
        }

        // Check if streak is broken
        if (streak.lastWritingDate && streak.lastWritingDate !== today && streak.lastWritingDate !== yesterday) {
          const lastWritingDateObj = parseISO(streak.lastWritingDate);
          const daysSinceLastWriting = differenceInMinutes(new Date(), lastWritingDateObj) / (60 * 24);

          if (daysSinceLastWriting > 2) {
            newStreak.current = writingDate === today ? 1 : 0;
          }
        }

        set({ streak: newStreak });
      },

      generateInsights: () => {
        const { sessions, goals, streak } = get();
        const insights: ProductivityInsight[] = [];
        const now = new Date();

        // Recent sessions for analysis
        const recentSessions = sessions.filter(s => {
          const sessionDate = parseISO(s.date);
          return differenceInMinutes(now, sessionDate) <= 30 * 24 * 60; // Last 30 days
        });

        // Peak hours insight
        const hourlyStats: Record<number, { sessions: number; words: number }> = {};
        recentSessions.forEach(session => {
          const hour = session.startTime.getHours();
          if (!hourlyStats[hour]) {
            hourlyStats[hour] = { sessions: 0, words: 0 };
          }
          hourlyStats[hour].sessions++;
          hourlyStats[hour].words += session.wordsWritten;
        });

        const peakHour = Object.entries(hourlyStats).reduce((peak, [hour, stats]) => {
          const hourNum = parseInt(hour);
          const productivity = stats.words / stats.sessions;
          if (productivity > peak.productivity) {
            return { hour: hourNum, productivity };
          }
          return peak;
        }, { hour: 0, productivity: 0 });

        if (peakHour.productivity > 0) {
          insights.push({
            id: generateId(),
            type: 'peak_hours',
            title: 'Peak Productivity Hour',
            description: `You're most productive at ${peakHour.hour}:00 with an average of ${Math.round(peakHour.productivity)} words per session.`,
            value: `${peakHour.hour}:00`,
            trend: 'stable',
            period: 'monthly',
            date: now,
          });
        }

        // Streak analysis
        insights.push({
          id: generateId(),
          type: 'streak_analysis',
          title: 'Writing Streak',
          description: `Current streak: ${streak.current} days. Your longest streak was ${streak.longest} days.`,
          value: streak.current,
          trend: streak.current > 0 ? 'up' : 'down',
          period: 'daily',
          date: now,
        });

        // Goal achievement rate
        const activeGoals = goals.filter(g => g.isActive);
        const completedGoals = goals.filter(g => g.completedAt);
        const achievementRate = goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;

        insights.push({
          id: generateId(),
          type: 'goal_achievement',
          title: 'Goal Achievement Rate',
          description: `You've completed ${completedGoals.length} out of ${goals.length} goals (${Math.round(achievementRate)}% success rate).`,
          value: `${Math.round(achievementRate)}%`,
          trend: achievementRate >= 70 ? 'up' : achievementRate >= 40 ? 'stable' : 'down',
          period: 'monthly',
          date: now,
        });

        // Pace trend
        const last7Days = recentSessions.filter(s => {
          const sessionDate = parseISO(s.date);
          return differenceInMinutes(now, sessionDate) <= 7 * 24 * 60;
        });

        const prev7Days = sessions.filter(s => {
          const sessionDate = parseISO(s.date);
          const daysDiff = differenceInMinutes(now, sessionDate) / (24 * 60);
          return daysDiff > 7 && daysDiff <= 14;
        });

        const currentWeekAvg = last7Days.length > 0
          ? last7Days.reduce((sum, s) => sum + s.wordsWritten, 0) / last7Days.length
          : 0;

        const prevWeekAvg = prev7Days.length > 0
          ? prev7Days.reduce((sum, s) => sum + s.wordsWritten, 0) / prev7Days.length
          : 0;

        if (currentWeekAvg > 0 && prevWeekAvg > 0) {
          const change = ((currentWeekAvg - prevWeekAvg) / prevWeekAvg) * 100;
          insights.push({
            id: generateId(),
            type: 'pace_trend',
            title: 'Writing Pace Trend',
            description: `Your average words per session ${change >= 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(change))}% this week.`,
            value: Math.round(currentWeekAvg),
            trend: change >= 5 ? 'up' : change <= -5 ? 'down' : 'stable',
            period: 'weekly',
            date: now,
          });
        }

        set({ insights });
        return insights;
      },

      // Data Retrieval
      getSessionsByDateRange: (startDate, endDate) => {
        const { sessions } = get();
        return sessions.filter(s => s.date >= startDate && s.date <= endDate);
      },

      getWritingPaceData: () => {
        const { sessions } = get();
        const completedSessions = sessions.filter(s => !s.isActive && s.duration > 0);

        const sessionsData = completedSessions.map(s => ({
          date: s.date,
          wpm: Math.round(s.wordsWritten / (s.duration / 60)) || 0,
          duration: s.duration,
          wordsWritten: s.wordsWritten,
        }));

        const averageWPM = sessionsData.length > 0
          ? Math.round(sessionsData.reduce((sum, s) => sum + s.wpm, 0) / sessionsData.length)
          : 0;

        const recentSessions = sessionsData.slice(-10);
        const recentWPM = recentSessions.length > 0
          ? Math.round(recentSessions.reduce((sum, s) => sum + s.wpm, 0) / recentSessions.length)
          : 0;

        const bestWPM = sessionsData.length > 0
          ? Math.max(...sessionsData.map(s => s.wpm))
          : 0;

        return {
          averageWPM,
          recentWPM,
          bestWPM,
          sessionsData: sessionsData.slice(-30), // Last 30 sessions
        };
      },

      getChapterCompletionRates: () => {
        const stories = useStoryStore.getState().stories;
        const rates: ChapterCompletionRate[] = [];

        stories.forEach(story => {
          story.chapters.forEach(chapter => {
            const targetWords = Math.round((story.targetWordCount || 50000) / story.chapters.length);
            const completionPercentage = Math.min((chapter.wordCount / targetWords) * 100, 100);

            // Estimate time based on recent writing pace
            const paceData = get().getWritingPaceData();
            const remainingWords = Math.max(0, targetWords - chapter.wordCount);
            const estimatedTimeToComplete = paceData.recentWPM > 0
              ? remainingWords / (paceData.recentWPM * 60) // Convert to hours
              : 0;

            rates.push({
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              storyTitle: story.title,
              targetWords,
              currentWords: chapter.wordCount,
              completionPercentage: Math.round(completionPercentage),
              estimatedTimeToComplete: Math.round(estimatedTimeToComplete * 10) / 10, // Round to 1 decimal
              lastUpdated: chapter.updatedAt,
            });
          });
        });

        return rates;
      },

      getTimeOfDayStats: () => {
        const { sessions } = get();
        const hourlyStats: Record<number, TimeOfDayStats> = {};

        // Initialize all hours
        for (let hour = 0; hour < 24; hour++) {
          hourlyStats[hour] = {
            hour,
            wordsWritten: 0,
            sessionsCount: 0,
            averageWPM: 0,
            productivityScore: 0,
          };
        }

        sessions.forEach(session => {
          if (!session.isActive && session.duration > 0) {
            const hour = session.startTime.getHours();
            const stats = hourlyStats[hour];

            stats.wordsWritten += session.wordsWritten;
            stats.sessionsCount++;

            if (stats.sessionsCount > 0) {
              const totalMinutes = sessions
                .filter(s => s.startTime.getHours() === hour && !s.isActive)
                .reduce((sum, s) => sum + s.duration, 0);

              stats.averageWPM = totalMinutes > 0
                ? Math.round(stats.wordsWritten / (totalMinutes / 60))
                : 0;
            }
          }
        });

        // Calculate productivity scores (0-100 based on words written and session frequency)
        const maxWords = Math.max(...Object.values(hourlyStats).map(s => s.wordsWritten));
        const maxSessions = Math.max(...Object.values(hourlyStats).map(s => s.sessionsCount));

        Object.values(hourlyStats).forEach(stats => {
          if (maxWords > 0 && maxSessions > 0) {
            const wordScore = (stats.wordsWritten / maxWords) * 60;
            const sessionScore = (stats.sessionsCount / maxSessions) * 40;
            stats.productivityScore = Math.round(wordScore + sessionScore);
          }
        });

        return Object.values(hourlyStats);
      },

      getTotalWordsWritten: () => {
        const { sessions } = get();
        return sessions
          .filter(s => !s.isActive)
          .reduce((total, s) => total + s.wordsWritten, 0);
      },

      getAverageSessionDuration: () => {
        const { sessions } = get();
        const completedSessions = sessions.filter(s => !s.isActive && s.duration > 0);

        if (completedSessions.length === 0) return 0;

        return Math.round(
          completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length
        );
      },

      // Utility
      exportData: () => {
        const state = get();
        return JSON.stringify({
          sessions: state.sessions,
          goals: state.goals,
          streak: state.streak,
          dailyStats: state.dailyStats,
        }, null, 2);
      },

      importData: (data) => {
        try {
          const imported = JSON.parse(data);
          set({
            sessions: imported.sessions || [],
            goals: imported.goals || [],
            streak: imported.streak || { current: 0, longest: 0, lastWritingDate: '' },
            dailyStats: imported.dailyStats || {},
          });
        } catch (error) {
          console.error('Failed to import analytics data:', error);
        }
      },

      clearAllData: () => {
        set({
          sessions: [],
          goals: [],
          streak: { current: 0, longest: 0, lastWritingDate: '' },
          dailyStats: {},
          insights: [],
          currentSession: null,
          isTrackingSession: false,
        });
      },
    }),
    {
      name: 'litrpg-analytics-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        goals: state.goals,
        streak: state.streak,
        dailyStats: state.dailyStats,
      }),
    }
  )
);