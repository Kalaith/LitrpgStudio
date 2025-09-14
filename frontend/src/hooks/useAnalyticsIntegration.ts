import { useEffect, useRef } from 'react';
import { useStoryStore } from '../stores/storyStore';
import { useAnalyticsStore } from '../stores/analyticsStore';

/**
 * Hook to integrate analytics tracking with story changes
 * This hook monitors story changes and updates analytics accordingly
 */
export const useAnalyticsIntegration = () => {
  const { stories, currentStory } = useStoryStore();
  const { currentSession, updateSessionProgress } = useAnalyticsStore();

  const previousWordCount = useRef<number>(0);

  useEffect(() => {
    if (currentSession && currentStory) {
      const currentWordCount = currentStory.wordCount;

      // Update session progress if word count changed
      if (currentWordCount !== previousWordCount.current) {
        updateSessionProgress(currentWordCount);
        previousWordCount.current = currentWordCount;
      }
    }
  }, [currentStory?.wordCount, currentSession, updateSessionProgress]);

  // Update the previous word count reference when current story changes
  useEffect(() => {
    if (currentStory) {
      previousWordCount.current = currentStory.wordCount;
    }
  }, [currentStory?.id]);
};

/**
 * Hook to automatically update goal progress based on writing activity
 */
export const useGoalTracking = () => {
  const { stories } = useStoryStore();
  const { goals, updateGoal, sessions } = useAnalyticsStore();

  useEffect(() => {
    // Update goal progress based on recent writing activity
    goals.forEach(goal => {
      if (!goal.isActive) return;

      // Calculate progress based on goal type
      let currentProgress = 0;
      const today = new Date().toISOString().split('T')[0];

      switch (goal.type) {
        case 'daily': {
          // Count words written today
          const todaySessions = sessions.filter(s => s.date === today && !s.isActive);
          currentProgress = todaySessions.reduce((sum, s) => sum + s.wordsWritten, 0);
          break;
        }
        case 'weekly': {
          // Count words written this week
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
          const weekStartStr = weekStart.toISOString().split('T')[0];

          const weekSessions = sessions.filter(s => s.date >= weekStartStr && !s.isActive);
          currentProgress = weekSessions.reduce((sum, s) => sum + s.wordsWritten, 0);
          break;
        }
        case 'monthly': {
          // Count words written this month
          const monthStart = new Date();
          monthStart.setDate(1);
          const monthStartStr = monthStart.toISOString().split('T')[0];

          const monthSessions = sessions.filter(s => s.date >= monthStartStr && !s.isActive);
          currentProgress = monthSessions.reduce((sum, s) => sum + s.wordsWritten, 0);
          break;
        }
        case 'project': {
          // Count words in specific project
          if (goal.storyId) {
            const story = stories.find(s => s.id === goal.storyId);
            currentProgress = story?.wordCount || 0;
          } else {
            // All projects
            currentProgress = stories.reduce((sum, s) => sum + s.wordCount, 0);
          }
          break;
        }
      }

      // Update goal progress if it changed
      if (currentProgress !== goal.current) {
        updateGoal(goal.id, { current: currentProgress });
      }
    });
  }, [stories, sessions, goals, updateGoal]);
};