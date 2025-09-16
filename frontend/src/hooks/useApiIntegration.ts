import { useEffect } from 'react';
import { useSeriesStore } from '../stores/seriesStore';
import { useCharacterStore } from '../stores/characterStore';
import { useStoryStore } from '../stores/storyStore';
import { api } from '../api';

// Hook to manage API integration and sync with stores
export function useApiIntegration() {
  const seriesStore = useSeriesStore();
  const characterStore = useCharacterStore();
  const storyStore = useStoryStore();

  // Load initial data
  const loadInitialData = async () => {
    try {
      // Check if backend is available
      const isHealthy = await api.series.getAll().then(() => true).catch(() => false);

      if (!isHealthy) {
        console.warn('Backend API is not available, using local storage only');
        return;
      }

      // Load series data
      const seriesResponse = await api.series.getAll();
      if (seriesResponse.success && seriesResponse.data) {
        // Merge with local data, preferring backend data
        seriesStore.series = seriesResponse.data;
      }

      // Load characters data
      const charactersResponse = await api.characters.getAll();
      if (charactersResponse.success && charactersResponse.data) {
        characterStore.characters = charactersResponse.data;
      }

      // Load stories data
      const storiesResponse = await api.stories.getAll();
      if (storiesResponse.success && storiesResponse.data) {
        storyStore.stories = storiesResponse.data;
      }

    } catch (error) {
      console.warn('Failed to sync with backend, using local storage:', error);
    }
  };

  // Sync series to backend
  const syncSeriesToBackend = async (series: any) => {
    try {
      if (series.id && !series.id.includes('local-')) {
        // Update existing
        await api.series.update(series.id, series);
      } else {
        // Create new
        const response = await api.series.create(series);
        if (response.success && response.data) {
          return response.data;
        }
      }
    } catch (error) {
      console.warn('Failed to sync series to backend:', error);
    }
    return null;
  };

  // Sync character to backend
  const syncCharacterToBackend = async (character: any) => {
    try {
      if (character.id && !character.id.includes('local-')) {
        // Update existing
        await api.characters.update(character.id, character);
      } else {
        // Create new
        const response = await api.characters.create(character);
        if (response.success && response.data) {
          return response.data;
        }
      }
    } catch (error) {
      console.warn('Failed to sync character to backend:', error);
    }
    return null;
  };

  return {
    loadInitialData,
    syncSeriesToBackend,
    syncCharacterToBackend,
    isOnline: true // Could be enhanced with actual network detection
  };
}

// Hook specifically for series operations with API integration
export function useSeriesWithApi() {
  const store = useSeriesStore();
  const { syncSeriesToBackend } = useApiIntegration();

  const createSeries = async (seriesData: any) => {
    try {
      // Try to create on backend first
      const response = await api.series.create(seriesData);
      if (response.success && response.data) {
        // Update store with backend data
        store.createSeries(response.data);
        return response.data;
      }
    } catch (error) {
      console.warn('Backend create failed, falling back to local:', error);
    }

    // Fallback to local creation
    return store.createSeries(seriesData);
  };

  const updateSeries = async (seriesId: string, updates: any) => {
    try {
      const response = await api.series.update(seriesId, updates);
      if (response.success && response.data) {
        store.updateSeries(seriesId, response.data);
        return;
      }
    } catch (error) {
      console.warn('Backend update failed, falling back to local:', error);
    }

    // Fallback to local update
    store.updateSeries(seriesId, updates);
  };

  const deleteSeries = async (seriesId: string) => {
    try {
      await api.series.delete(seriesId);
    } catch (error) {
      console.warn('Backend delete failed, proceeding with local delete:', error);
    }

    // Always delete locally
    store.deleteSeries(seriesId);
  };

  return {
    ...store,
    createSeries,
    updateSeries,
    deleteSeries,
  };
}

// Hook specifically for character operations with API integration
export function useCharactersWithApi() {
  const store = useCharacterStore();

  const createCharacter = async (characterData: any) => {
    try {
      const response = await api.characters.create(characterData);
      if (response.success && response.data) {
        store.createCharacter(response.data);
        return response.data;
      }
    } catch (error) {
      console.warn('Backend create failed, falling back to local:', error);
    }

    // Fallback to local creation
    store.createCharacter(characterData);
  };

  const updateCharacter = async (characterId: string, updates: any) => {
    try {
      const response = await api.characters.update(characterId, updates);
      if (response.success && response.data) {
        store.updateCharacter(characterId, response.data);
        return;
      }
    } catch (error) {
      console.warn('Backend update failed, falling back to local:', error);
    }

    // Fallback to local update
    store.updateCharacter(characterId, updates);
  };

  const levelUpCharacter = async (characterId: string) => {
    try {
      const response = await api.characters.levelUp(characterId);
      if (response.success && response.data) {
        store.updateCharacter(characterId, response.data);
        return;
      }
    } catch (error) {
      console.warn('Backend level up failed, falling back to local:', error);
    }

    // Fallback to local level up
    store.levelUpCharacter(characterId);
  };

  return {
    ...store,
    createCharacter,
    updateCharacter,
    levelUpCharacter,
  };
}