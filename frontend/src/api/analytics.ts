import { apiClient, ApiResponse } from './client';
import type { SeriesAnalytics } from '../types/series';

export interface AnalyticsGenerationResult {
  analytics_id: string;
  generated_at: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface ConsistencyIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
  severity: number;
}

export interface ProgressionValidationResult {
  isValid: boolean;
  issues: ConsistencyIssue[];
  characterId: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: string;
  entities: string[];
}

export interface TimelineEventInput {
  title: string;
  description: string;
  timestamp: string;
  type: string;
  entities?: string[];
}

export const analyticsApi = {
  // Series Analytics
  getSeriesAnalytics: (seriesId: string): Promise<ApiResponse<SeriesAnalytics>> =>
    apiClient.get(`/series/${seriesId}/analytics`),

  generateAnalytics: (seriesId: string): Promise<ApiResponse<AnalyticsGenerationResult>> =>
    apiClient.post(`/series/${seriesId}/analytics/generate`),
};

export const consistencyApi = {
  // Consistency Checking
  checkConsistency: (seriesId: string): Promise<ApiResponse<ConsistencyIssue[]>> =>
    apiClient.get(`/series/${seriesId}/consistency-check`),

  validateCharacterProgression: (seriesId: string, characterId: string): Promise<ApiResponse<ProgressionValidationResult>> =>
    apiClient.get(`/series/${seriesId}/characters/${characterId}/progression-validation`),
};

export const timelineApi = {
  // Timeline Management
  getTimeline: (seriesId: string): Promise<ApiResponse<TimelineEvent[]>> =>
    apiClient.get(`/series/${seriesId}/timeline`),

  addEvent: (seriesId: string, event: TimelineEventInput): Promise<ApiResponse<TimelineEvent>> =>
    apiClient.post(`/series/${seriesId}/timeline`, event),

  updateEvent: (eventId: string, updates: Partial<TimelineEvent>): Promise<ApiResponse<TimelineEvent>> =>
    apiClient.put(`/timeline/${eventId}`, updates),

  deleteEvent: (eventId: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/timeline/${eventId}`),
};