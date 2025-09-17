import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export interface DashboardStats {
  totalCharacters: number;
  totalSeries: number;
  totalBooks: number;
  totalChapters: number;
  totalWords: number;
  todayWords: number;
  writingStreak: number;
  mainCharacters: number;
  supportingCharacters: number;
  upcomingEvents: number;
  dailyGoal: number;
  dailyProgress: number;
  storyProgress: {
    chaptersComplete: number;
    chaptersTotal: number;
    wordsComplete: number;
    wordsTarget: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

const defaultStats: DashboardStats = {
  totalCharacters: 0,
  totalSeries: 0,
  totalBooks: 0,
  totalChapters: 0,
  totalWords: 0,
  todayWords: 0,
  writingStreak: 0,
  mainCharacters: 0,
  supportingCharacters: 0,
  upcomingEvents: 0,
  dailyGoal: 500,
  dailyProgress: 0,
  storyProgress: {
    chaptersComplete: 0,
    chaptersTotal: 0,
    wordsComplete: 0,
    wordsTarget: 0,
  },
  recentActivity: [],
};

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        seriesResponse,
        charactersResponse
      ] = await Promise.all([
        apiClient.get('/series').catch(() => ({ success: false, data: [] })),
        apiClient.get('/characters').catch(() => ({ success: false, data: [] }))
      ]);

      const series = seriesResponse.success ? (seriesResponse.data || []) : [];
      const characters = charactersResponse.success ? (charactersResponse.data || []) : [];

      // Calculate statistics from the fetched data
      const totalSeries = series.length;
      const totalCharacters = characters.length;

      // Count main vs supporting characters (assuming a property exists)
      const mainCharacters = characters.filter((char: any) => char.character_type === 'main' || char.is_main).length;
      const supportingCharacters = totalCharacters - mainCharacters;

      // For now, set other values to 0 since the database is empty
      // These would be calculated from actual book/chapter/word data when available
      const calculatedStats: DashboardStats = {
        totalCharacters,
        totalSeries,
        totalBooks: 0, // Will be calculated from series->books when available
        totalChapters: 0, // Will be calculated from books->chapters when available
        totalWords: 0, // Will be calculated from chapters->content when available
        todayWords: 0, // Would come from writing session tracking
        writingStreak: 0, // Would come from writing session tracking
        mainCharacters,
        supportingCharacters,
        upcomingEvents: 0, // Would come from timeline events
        dailyGoal: 500, // Could be user preference
        dailyProgress: 0, // Today's words / daily goal
        storyProgress: {
          chaptersComplete: 0,
          chaptersTotal: 0,
          wordsComplete: 0,
          wordsTarget: 80000, // Default target
        },
        recentActivity: [], // Would come from activity tracking
      };

      setStats(calculatedStats);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setStats(defaultStats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchDashboardStats,
  };
}