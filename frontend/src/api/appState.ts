import { apiClient, type ApiResponse } from './client';

export interface AppStateData {
  version: number;
  state: Record<string, string>;
  updated_at?: string | null;
}

export const appStateApi = {
  get: (): Promise<ApiResponse<AppStateData>> => apiClient.get('/app-state'),
  save: (state: Record<string, string>, version = 1): Promise<ApiResponse<AppStateData>> =>
    apiClient.put('/app-state', { state, version }),
};

