import { useCallback, useEffect, useState } from 'react';
import { timelineApi } from '../../api/timeline';
import { charactersApi } from '../../api/characters';
import { seriesApi } from '../../api/series';

interface SyncStatus {
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
}

/**
 * Hook for syncing local store data with API
 */
export function useApiSync(seriesId: string | null) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    loading: false,
    error: null,
    lastSync: null
  });

  const syncTimeline = useCallback(async (localTimelineEvents: any[]) => {
    if (!seriesId) return;

    try {
      setSyncStatus(prev => ({ ...prev, loading: true, error: null }));

      // Get remote timeline events
      const response = await timelineApi.getTimeline(seriesId);

      if (response.success) {
        // For now, just log the sync opportunity
        console.log('Timeline sync opportunity:', {
          local: localTimelineEvents.length,
          remote: response.data?.length || 0
        });

        setSyncStatus({
          loading: false,
          error: null,
          lastSync: new Date()
        });

        return response.data;
      }
    } catch (error) {
      setSyncStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        lastSync: null
      });
    }
  }, [seriesId]);

  const syncCharacters = useCallback(async () => {
    if (!seriesId) return;

    try {
      setSyncStatus(prev => ({ ...prev, loading: true, error: null }));

      const response = await charactersApi.getAll();

      if (response.success) {
        setSyncStatus({
          loading: false,
          error: null,
          lastSync: new Date()
        });

        return response.data;
      }
    } catch (error) {
      setSyncStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Character sync failed',
        lastSync: null
      });
    }
  }, [seriesId]);

  const syncSeries = useCallback(async () => {
    try {
      setSyncStatus(prev => ({ ...prev, loading: true, error: null }));

      const response = await seriesApi.getAll();

      if (response.success) {
        setSyncStatus({
          loading: false,
          error: null,
          lastSync: new Date()
        });

        return response.data;
      }
    } catch (error) {
      setSyncStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Series sync failed',
        lastSync: null
      });
    }
  }, []);

  // Auto-sync on mount if seriesId is available
  useEffect(() => {
    if (seriesId) {
      syncTimeline([]);
      syncCharacters();
    }
    syncSeries();
  }, [seriesId, syncTimeline, syncCharacters, syncSeries]);

  return {
    syncStatus,
    syncTimeline,
    syncCharacters,
    syncSeries,
    isOnline: !syncStatus.error
  };
}