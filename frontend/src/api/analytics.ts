import { apiClient, ApiResponse } from './client';
import type { SeriesAnalytics } from '../types/series';

export const analyticsApi = {
  // Series Analytics
  getSeriesAnalytics: (seriesId: string): Promise<ApiResponse<SeriesAnalytics>> =>
    apiClient.get(`/series/${seriesId}/analytics`),

  generateAnalytics: (seriesId: string): Promise<ApiResponse<any>> =>
    apiClient.post(`/series/${seriesId}/analytics/generate`),
};

export const consistencyApi = {
  // Consistency Checking
  checkConsistency: (seriesId: string): Promise<ApiResponse<any[]>> =>
    apiClient.get(`/series/${seriesId}/consistency-check`),

  validateCharacterProgression: (seriesId: string, characterId: string): Promise<ApiResponse<any>> =>
    apiClient.get(`/series/${seriesId}/characters/${characterId}/progression-validation`),
};

export const timelineApi = {
  // Timeline Management
  getTimeline: (seriesId: string): Promise<ApiResponse<any[]>> =>
    apiClient.get(`/series/${seriesId}/timeline`),

  addEvent: (seriesId: string, event: any): Promise<ApiResponse<any>> =>
    apiClient.post(`/series/${seriesId}/timeline`, event),

  updateEvent: (eventId: string, updates: any): Promise<ApiResponse<any>> =>
    apiClient.put(`/timeline/${eventId}`, updates),

  deleteEvent: (eventId: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/timeline/${eventId}`),
};