export interface WritingSession {
  id: string;
  storyId: string;
  chapterId?: string;
  startTime: Date;
  endTime?: Date;
  wordTarget: number;
  wordsWritten: number;
  initialWordCount: number;
  finalWordCount: number;
  duration: number; // in minutes
  isActive: boolean;
  date: string; // YYYY-MM-DD format
  sessionType?: 'new_chapter' | 'section' | 'continue';
  sessionContext?: string;
}

export interface WritingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project';
  target: number; // words
  current: number; // words achieved
  deadline?: Date;
  isActive: boolean;
  createdAt: Date;
  completedAt?: Date;
  storyId?: string; // For project-specific goals
}

export interface WritingStreak {
  current: number;
  longest: number;
  lastWritingDate: string; // YYYY-MM-DD format
}

export interface DailyWritingStats {
  date: string; // YYYY-MM-DD format
  wordsWritten: number;
  sessionsCount: number;
  totalMinutes: number;
  averageWPM: number;
  goalsAchieved: number;
  chaptersCompleted: string[];
}

export interface WeeklyWritingStats {
  weekStart: string; // YYYY-MM-DD format (Monday)
  wordsWritten: number;
  sessionsCount: number;
  totalMinutes: number;
  averageWPM: number;
  goalsAchieved: number;
  dailyStats: DailyWritingStats[];
}

export interface MonthlyWritingStats {
  month: string; // YYYY-MM format
  wordsWritten: number;
  sessionsCount: number;
  totalMinutes: number;
  averageWPM: number;
  goalsAchieved: number;
  weeklyStats: WeeklyWritingStats[];
}

export interface ProductivityInsight {
  id: string;
  type: 'peak_hours' | 'streak_analysis' | 'goal_achievement' | 'pace_trend' | 'chapter_completion';
  title: string;
  description: string;
  value: number | string;
  trend: 'up' | 'down' | 'stable';
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
}

export interface WritingPaceData {
  averageWPM: number;
  recentWPM: number;
  bestWPM: number;
  sessionsData: {
    date: string;
    wpm: number;
    duration: number;
    wordsWritten: number;
  }[];
}

export interface ChapterCompletionRate {
  chapterId: string;
  chapterTitle: string;
  storyTitle: string;
  targetWords: number;
  currentWords: number;
  completionPercentage: number;
  estimatedTimeToComplete: number; // in hours
  lastUpdated: Date;
}

export interface TimeOfDayStats {
  hour: number;
  wordsWritten: number;
  sessionsCount: number;
  averageWPM: number;
  productivityScore: number; // 0-100
}

export interface AnalyticsState {
  sessions: WritingSession[];
  goals: WritingGoal[];
  streak: WritingStreak;
  dailyStats: Record<string, DailyWritingStats>;
  insights: ProductivityInsight[];
  isTrackingSession: boolean;
  currentSession: WritingSession | null;
}

export interface AnalyticsActions {
  // Session Management
  startSession: (
    storyId: string,
    chapterId?: string,
    wordTarget?: number,
    sessionType?: 'new_chapter' | 'section' | 'continue',
    sessionContext?: string
  ) => void;
  endSession: () => void;
  updateSessionProgress: (currentWordCount: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;

  // Goal Management
  createGoal: (goal: Omit<WritingGoal, 'id' | 'current' | 'createdAt'>) => void;
  updateGoal: (goalId: string, updates: Partial<WritingGoal>) => void;
  deleteGoal: (goalId: string) => void;
  markGoalComplete: (goalId: string) => void;

  // Analytics Calculation
  calculateDailyStats: (date: string) => DailyWritingStats;
  calculateWeeklyStats: (weekStart: string) => WeeklyWritingStats;
  calculateMonthlyStats: (month: string) => MonthlyWritingStats;
  updateStreak: (writingDate: string) => void;
  generateInsights: () => ProductivityInsight[];

  // Data Retrieval
  getSessionsByDateRange: (startDate: string, endDate: string) => WritingSession[];
  getWritingPaceData: () => WritingPaceData;
  getChapterCompletionRates: () => ChapterCompletionRate[];
  getTimeOfDayStats: () => TimeOfDayStats[];
  getTotalWordsWritten: () => number;
  getAverageSessionDuration: () => number;

  // Utility
  exportData: () => string;
  importData: (data: string) => void;
  clearAllData: () => void;
}

export type AnalyticsStore = AnalyticsState & AnalyticsActions;
