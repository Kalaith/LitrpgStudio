import { apiClient, ApiResponse } from './client';
import type { Story, Chapter, StoryEvent, StoryTemplate, CharacterProgressionEvent } from '../types/story';

export const storiesApi = {
  // Story Management
  getAll: (): Promise<ApiResponse<Story[]>> =>
    apiClient.get('/stories'),

  getById: (id: string): Promise<ApiResponse<Story>> =>
    apiClient.get(`/stories/${id}`),

  create: (storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Story>> =>
    apiClient.post('/stories', storyData),

  update: (id: string, updates: Partial<Story>): Promise<ApiResponse<Story>> =>
    apiClient.put(`/stories/${id}`, updates),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/stories/${id}`),

  // Story Events
  addEvent: (id: string, event: Omit<StoryEvent, 'id'>): Promise<ApiResponse<Story>> =>
    apiClient.post(`/stories/${id}/events`, event),

  // Templates
  getTemplates: (): Promise<ApiResponse<StoryTemplate[]>> =>
    apiClient.get('/templates/stories'),

  saveAsTemplate: (templateData: Omit<StoryTemplate, 'id'>): Promise<ApiResponse<StoryTemplate>> =>
    apiClient.post('/templates/stories', templateData),

  createFromTemplate: (templateId: string, title: string): Promise<ApiResponse<Story>> =>
    apiClient.post(`/templates/stories/${templateId}/create`, { title }),
};

export const chaptersApi = {
  // Chapter Management
  getByStoryId: (storyId: string): Promise<ApiResponse<Chapter[]>> =>
    apiClient.get(`/stories/${storyId}/chapters`),

  getById: (id: string): Promise<ApiResponse<Chapter>> =>
    apiClient.get(`/chapters/${id}`),

  create: (storyId: string, chapterData: Omit<Chapter, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Chapter>> =>
    apiClient.post(`/stories/${storyId}/chapters`, chapterData),

  update: (id: string, updates: Partial<Chapter>): Promise<ApiResponse<Chapter>> =>
    apiClient.put(`/chapters/${id}`, updates),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/chapters/${id}`),

  reorder: (storyId: string, chapterIds: string[]): Promise<ApiResponse<Chapter[]>> =>
    apiClient.put(`/stories/${storyId}/chapters/reorder`, { chapterIds }),

  // Character Progression
  addCharacterProgression: (id: string, progression: CharacterProgressionEvent): Promise<ApiResponse<Chapter>> =>
    apiClient.post(`/chapters/${id}/progression`, progression),
};

export const writingSessionsApi = {
  start: (storyId: string, chapterId?: string, wordTarget?: number): Promise<ApiResponse<Record<string, unknown>>> =>
    apiClient.post('/writing-sessions/start', { story_id: storyId, chapter_id: chapterId, word_target: wordTarget }),

  end: (): Promise<ApiResponse<Record<string, unknown>>> =>
    apiClient.post('/writing-sessions/end'),

  updateProgress: (wordsWritten: number): Promise<ApiResponse<Record<string, unknown>>> =>
    apiClient.put('/writing-sessions/progress', { words_written: wordsWritten }),
};
