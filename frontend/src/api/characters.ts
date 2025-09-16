import { apiClient, ApiResponse } from './client';
import type { Character, Skill, Item, CharacterTemplate } from '../types/character';

export const charactersApi = {
  // Character Management
  getAll: (): Promise<ApiResponse<Character[]>> =>
    apiClient.get('/characters'),

  getById: (id: string): Promise<ApiResponse<Character>> =>
    apiClient.get(`/characters/${id}`),

  create: (characterData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Character>> =>
    apiClient.post('/characters', characterData),

  update: (id: string, updates: Partial<Character>): Promise<ApiResponse<Character>> =>
    apiClient.put(`/characters/${id}`, updates),

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/characters/${id}`),

  // Character Progression
  levelUp: (id: string): Promise<ApiResponse<Character>> =>
    apiClient.post(`/characters/${id}/level-up`),

  // Skills
  addSkill: (id: string, skill: Skill): Promise<ApiResponse<Character>> =>
    apiClient.post(`/characters/${id}/skills`, skill),

  updateSkill: (characterId: string, skillId: string, updates: Partial<Skill>): Promise<ApiResponse<Character>> =>
    apiClient.put(`/characters/${characterId}/skills/${skillId}`, updates),

  // Items and Equipment
  addItem: (id: string, item: Item): Promise<ApiResponse<Character>> =>
    apiClient.post(`/characters/${id}/items`, item),

  removeItem: (characterId: string, itemId: string): Promise<ApiResponse<Character>> =>
    apiClient.delete(`/characters/${characterId}/items/${itemId}`),

  equipItem: (characterId: string, itemId: string): Promise<ApiResponse<Character>> =>
    apiClient.post(`/characters/${characterId}/items/${itemId}/equip`),

  unequipItem: (characterId: string, itemId: string): Promise<ApiResponse<Character>> =>
    apiClient.post(`/characters/${characterId}/items/${itemId}/unequip`),

  // Templates
  getTemplates: (): Promise<ApiResponse<CharacterTemplate[]>> =>
    apiClient.get('/templates/characters'),

  saveAsTemplate: (templateData: Omit<CharacterTemplate, 'id'>): Promise<ApiResponse<CharacterTemplate>> =>
    apiClient.post('/templates/characters', templateData),

  createFromTemplate: (templateId: string, name: string): Promise<ApiResponse<Character>> =>
    apiClient.post(`/templates/characters/${templateId}/create`, { name }),
};