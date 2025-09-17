import { apiClient, ApiResponse } from './client';
import type { TimelineEvent } from '../types/unifiedTimeline';

export const timelineApi = {
  // Get timeline events for a series
  getTimeline: (seriesId: string): Promise<ApiResponse<TimelineEvent[]>> =>
    apiClient.get(`/series/${seriesId}/timeline`),

  // Add a timeline event
  addEvent: (seriesId: string, eventData: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<TimelineEvent>> =>
    apiClient.post(`/series/${seriesId}/timeline`, eventData),

  // Update a timeline event
  updateEvent: (eventId: string, updates: Partial<TimelineEvent>): Promise<ApiResponse<TimelineEvent>> =>
    apiClient.put(`/timeline/${eventId}`, updates),

  // Delete a timeline event
  deleteEvent: (eventId: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/timeline/${eventId}`),
};