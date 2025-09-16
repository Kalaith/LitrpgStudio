// API Module Exports
export { apiClient, ApiError } from './client';
export type { ApiResponse } from './client';

export { seriesApi } from './series';
export { booksApi } from './books';
export { charactersApi } from './characters';
export { storiesApi, chaptersApi, writingSessionsApi } from './stories';
export { analyticsApi, consistencyApi, timelineApi } from './analytics';

// Re-export commonly used API functions
export const api = {
  series: seriesApi,
  books: booksApi,
  characters: charactersApi,
  stories: storiesApi,
  chapters: chaptersApi,
  writingSessions: writingSessionsApi,
  analytics: analyticsApi,
  consistency: consistencyApi,
  timeline: timelineApi,
};