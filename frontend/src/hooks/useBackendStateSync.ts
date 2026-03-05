import { useCallback, useEffect, useRef } from 'react';
import { appStateApi } from '../api/appState';
import { useAuth } from '../contexts/AuthContext';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { useCharacterStore } from '../stores/characterStore';
import { useEntityRegistryStore } from '../stores/entityRegistryStore';
import { useSeriesStore } from '../stores/seriesStore';
import { useStoryStore } from '../stores/storyStore';
import { useUnifiedTimelineStore } from '../stores/unifiedTimelineStore';
import { useWorldStateStore } from '../stores/worldStateStore';

const SYNC_INTERVAL_MS = 3000;
const SAVE_DEBOUNCE_MS = 750;

const APP_STATE_KEYS = [
  'sidebar-expanded-sections',
  'sidebar-pinned-items',
  'sidebar-collapsed',
  'characters',
  'skills',
  'litrpg-series-storage',
  'litrpg-story-storage',
  'litrpg-character-storage',
  'litrpg-analytics-storage',
  'unified-timeline-store',
  'entity-registry-store',
  'litrpg-world-state-storage',
  'characterData',
  'storyData',
  'items',
  'userPreferences',
  'recentFiles',
  'analyticsData',
] as const;

const rehydratePersistedStores = async (): Promise<void> => {
  const rehydrators = [
    () => useSeriesStore.persist.rehydrate(),
    () => useStoryStore.persist.rehydrate(),
    () => useCharacterStore.persist.rehydrate(),
    () => useAnalyticsStore.persist.rehydrate(),
    () => useUnifiedTimelineStore.persist.rehydrate(),
    () => useEntityRegistryStore.persist.rehydrate(),
    () => useWorldStateStore.persist.rehydrate(),
  ];

  await Promise.all(
    rehydrators.map(async (rehydrate) => {
      try {
        await rehydrate();
      } catch (error) {
        console.warn('Store rehydrate failed:', error);
      }
    })
  );
};

const collectLocalAppState = (): Record<string, string> => {
  const state: Record<string, string> = {};
  for (const key of APP_STATE_KEYS) {
    const value = localStorage.getItem(key);
    if (typeof value === 'string') {
      state[key] = value;
    }
  }
  return state;
};

const applyRemoteAppState = (state: Record<string, string>): void => {
  for (const key of APP_STATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(state, key)) {
      const value = state[key];
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      }
    }
  }
};

const serializeState = (state: Record<string, string>): string => {
  const orderedState: Record<string, string> = {};
  for (const key of Object.keys(state).sort()) {
    orderedState[key] = state[key];
  }
  return JSON.stringify(orderedState);
};

export const useBackendStateSync = (): void => {
  const { isAuthenticated, isLoading } = useAuth();
  const isHydratedRef = useRef(false);
  const isSavingRef = useRef(false);
  const hasPendingSaveRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastSyncedSnapshotRef = useRef<string>('');

  const pushState = useCallback(async () => {
    if (!isAuthenticated || isLoading || !isHydratedRef.current || isSavingRef.current) {
      return;
    }

    const state = collectLocalAppState();
    const serialized = serializeState(state);
    if (serialized === lastSyncedSnapshotRef.current) {
      return;
    }

    isSavingRef.current = true;
    try {
      await appStateApi.save(state);
      lastSyncedSnapshotRef.current = serialized;
    } catch (error) {
      console.warn('Failed to sync app state to backend:', error);
    } finally {
      isSavingRef.current = false;
      if (hasPendingSaveRef.current) {
        hasPendingSaveRef.current = false;
        void pushState();
      }
    }
  }, [isAuthenticated, isLoading]);

  const schedulePushState = useCallback(() => {
    if (!isAuthenticated || isLoading || !isHydratedRef.current) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      if (isSavingRef.current) {
        hasPendingSaveRef.current = true;
        return;
      }
      void pushState();
    }, SAVE_DEBOUNCE_MS);
  }, [isAuthenticated, isLoading, pushState]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      isHydratedRef.current = false;
      lastSyncedSnapshotRef.current = '';
      return;
    }

    let cancelled = false;
    const hydrate = async () => {
      try {
        const response = await appStateApi.get();
        if (cancelled) {
          return;
        }

        const remoteState = response.success ? response.data?.state : undefined;
        if (remoteState && Object.keys(remoteState).length > 0) {
          applyRemoteAppState(remoteState);
        }

        await rehydratePersistedStores();

        if (cancelled) {
          return;
        }

        isHydratedRef.current = true;
        lastSyncedSnapshotRef.current = serializeState(collectLocalAppState());

        if (!remoteState || Object.keys(remoteState).length === 0) {
          schedulePushState();
        }
      } catch (error) {
        console.warn('Failed to hydrate app state from backend:', error);
        await rehydratePersistedStores();
        if (cancelled) {
          return;
        }
        isHydratedRef.current = true;
        lastSyncedSnapshotRef.current = serializeState(collectLocalAppState());
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [isAuthenticated, isLoading, schedulePushState]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (!isHydratedRef.current) {
        return;
      }
      const currentSnapshot = serializeState(collectLocalAppState());
      if (currentSnapshot !== lastSyncedSnapshotRef.current) {
        schedulePushState();
      }
    }, SYNC_INTERVAL_MS);

    const handlePageHide = () => {
      void pushState();
    };

    window.addEventListener('beforeunload', handlePageHide);
    document.addEventListener('visibilitychange', handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('beforeunload', handlePageHide);
      document.removeEventListener('visibilitychange', handlePageHide);
    };
  }, [isAuthenticated, isLoading, pushState, schedulePushState]);
};

