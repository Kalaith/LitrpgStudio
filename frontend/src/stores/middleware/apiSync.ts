import type { StateStorage } from 'zustand/middleware';

interface ApiSyncOptions {
  seriesId?: string;
  endpoint: string;
  apiClient: {
    get: (path: string) => Promise<{ success: boolean; data?: unknown }>;
    post: (path: string, body: unknown) => Promise<unknown>;
    delete: (path: string) => Promise<unknown>;
  };
  syncOnLoad?: boolean;
  syncOnSave?: boolean;
}

/**
 * API Sync Middleware for Zustand stores
 * Provides hybrid localStorage + API synchronization
 */
export function createApiSyncStorage(options: ApiSyncOptions): StateStorage {
  const { seriesId, endpoint, apiClient, syncOnLoad = true, syncOnSave = true } = options;

  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        // Try to get from localStorage first (immediate response)
        const localData = localStorage.getItem(name);

        if (!syncOnLoad) {
          return localData;
        }

        // Attempt to sync with API in background
        if (seriesId) {
          try {
            const response = await apiClient.get(`/series/${seriesId}/${endpoint}`);
            if (response.success && response.data) {
              // API data available - merge or replace localStorage
              const apiData = JSON.stringify(response.data);
              localStorage.setItem(name, apiData);
              return apiData;
            }
          } catch (error) {
            console.warn(`API sync failed for ${endpoint}, falling back to localStorage:`, error);
          }
        }

        return localData;
      } catch (error) {
        console.error('Storage getItem error:', error);
        return null;
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        // Always save to localStorage immediately
        localStorage.setItem(name, value);

        if (!syncOnSave || !seriesId) {
          return;
        }

        // Attempt to sync to API in background
        try {
          const data = JSON.parse(value);

          // For complex data structures, we may need to transform or batch
          // For now, we'll save the entire state
          await apiClient.post(`/series/${seriesId}/${endpoint}/sync`, {
            data,
            timestamp: new Date().toISOString()
          });

          console.log(`Successfully synced ${endpoint} to API`);
        } catch (error) {
          console.warn(`API sync failed for ${endpoint}, data saved locally:`, error);
          // Data is still safe in localStorage
        }
      } catch (error) {
        console.error('Storage setItem error:', error);
      }
    },

    removeItem: async (name: string): Promise<void> => {
      try {
        localStorage.removeItem(name);

        if (syncOnSave && seriesId) {
          try {
            await apiClient.delete(`/series/${seriesId}/${endpoint}/sync`);
          } catch (error) {
            console.warn(`API cleanup failed for ${endpoint}:`, error);
          }
        }
      } catch (error) {
        console.error('Storage removeItem error:', error);
      }
    }
  };
}

/**
 * Simple API-aware storage that gracefully degrades to localStorage
 */
export function createHybridStorage(options: Partial<ApiSyncOptions> = {}): StateStorage {
  const { syncOnSave = false } = options;

  return {
    getItem: (name: string): string | null => {
      try {
        return localStorage.getItem(name);
      } catch (error) {
        console.error('Storage getItem error:', error);
        return null;
      }
    },

    setItem: (name: string, value: string): void => {
      try {
        localStorage.setItem(name, value);

        // Future: Add API sync queue here
        if (syncOnSave) {
          console.log(`Future: Would sync ${name} to API`);
        }
      } catch (error) {
        console.error('Storage setItem error:', error);
      }
    },

    removeItem: (name: string): void => {
      try {
        localStorage.removeItem(name);

        if (syncOnSave) {
          console.log(`Future: Would remove ${name} from API`);
        }
      } catch (error) {
        console.error('Storage removeItem error:', error);
      }
    }
  };
}
