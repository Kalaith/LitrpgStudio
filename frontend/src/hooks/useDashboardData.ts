import { useMemo } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { useSeriesStore } from '../stores/seriesStore';
import { useStoryStore } from '../stores/storyStore';
import type { Character } from '../types/character';
import type { Story } from '../types/story';

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

const DEFAULT_WORD_TARGET = 80000;
const DEFAULT_DAILY_GOAL = 500;

function buildStats(
  seriesCount: number,
  characters: Character[],
  stories: Story[]
): DashboardStats {
  const totalCharacters = characters.length;
  const mainCharacters = characters.filter((char) =>
    char.storyReferences?.some((ref) => ref.mentionType === 'main_character')
  ).length;
  const supportingCharacters = totalCharacters - mainCharacters;

  const totalChapters = stories.reduce((sum, story) => sum + (story.chapters?.length ?? 0), 0);
  const totalWords = stories.reduce(
    (sum, story) => sum + (story.chapters?.reduce((chapterSum, chapter) => chapterSum + (chapter.wordCount ?? 0), 0) ?? 0),
    0
  );

  const chaptersComplete = stories.reduce(
    (sum, story) => sum + (story.chapters?.filter((chapter) => (chapter.wordCount ?? 0) > 0).length ?? 0),
    0
  );

  const wordsTarget = DEFAULT_WORD_TARGET;
  const todayWords = 0;

  return {
    totalCharacters,
    totalSeries: seriesCount,
    totalBooks: 0,
    totalChapters,
    totalWords,
    todayWords,
    writingStreak: 0,
    mainCharacters,
    supportingCharacters,
    upcomingEvents: 0,
    dailyGoal: DEFAULT_DAILY_GOAL,
    dailyProgress: wordsTarget > 0 ? Math.min(100, Math.round((todayWords / DEFAULT_DAILY_GOAL) * 100)) : 0,
    storyProgress: {
      chaptersComplete,
      chaptersTotal: totalChapters,
      wordsComplete: totalWords,
      wordsTarget,
    },
    recentActivity: [],
  };
}

export function useDashboardData() {
  const seriesCount = useSeriesStore((state) => state.series.length);
  const characters = useCharacterStore((state) => state.characters);
  const stories = useStoryStore((state) => state.stories);

  const stats = useMemo(
    () => buildStats(seriesCount, characters, stories),
    [seriesCount, characters, stories]
  );

  return {
    stats,
    isLoading: false,
    error: null as string | null,
    refresh: async () => undefined,
  };
}
