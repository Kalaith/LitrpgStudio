import { apiClient, ApiResponse } from './client';
import type { Series, BookAppearance, CharacterDevelopment } from '../types/series';

export const seriesApi = {
  // Series Management
  getAll: (): Promise<ApiResponse<Series[]>> =>
    apiClient.get('/series'),

  getById: (id: string): Promise<ApiResponse<Series>> =>
    apiClient.get(`/series/${id}`),

  create: (seriesData: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Series>> =>
    apiClient.post('/series', seriesData),

  update: (id: string, updates: Partial<Series>): Promise<ApiResponse<Series>> =>
    apiClient.put(`/series/${id}`, updates),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/series/${id}`),

  export: (id: string): Promise<ApiResponse<string>> =>
    apiClient.post(`/series/${id}/export`),

  import: (data: string): Promise<ApiResponse<Series>> =>
    apiClient.post('/series/import', { data }),

  // Character Integration
  addCharacterToSeries: (
    seriesId: string,
    characterId: string,
    appearance: BookAppearance
  ): Promise<ApiResponse<Series>> =>
    apiClient.post(`/series/${seriesId}/characters/${characterId}`, { appearances: [appearance] }),

  removeCharacterFromSeries: (seriesId: string, characterId: string): Promise<ApiResponse<Series>> =>
    apiClient.delete(`/series/${seriesId}/characters/${characterId}`),

  addCharacterAppearance: (
    seriesId: string,
    characterId: string,
    appearance: BookAppearance
  ): Promise<ApiResponse<Series>> =>
    apiClient.post(`/series/${seriesId}/characters/${characterId}/appearances`, appearance),

  updateCharacterDevelopment: (
    seriesId: string,
    characterId: string,
    development: CharacterDevelopment
  ): Promise<ApiResponse<Series>> =>
    apiClient.put(`/series/${seriesId}/characters/${characterId}/development`, development),
};