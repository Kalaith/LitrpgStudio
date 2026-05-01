import { apiClient, ApiResponse } from "./client";

export type CanonEntryType =
  | "character"
  | "location"
  | "faction"
  | "item"
  | "rule"
  | "system"
  | "custom";

export interface CanonCustomField {
  id?: string;
  name: string;
  type: "text" | "number" | "select";
  value: string | number | null;
  options?: string[];
}

export interface CanonRelationship {
  id?: string;
  target_entry_id: string;
  type: string;
  notes?: string;
}

export interface CanonBacklink {
  story_id: string;
  story_title: string;
  chapter_id: string;
  chapter_title: string;
  chapter_number: number;
  matches: number;
  snippet: string;
}

export interface CanonEntry {
  id: string;
  name: string;
  type: CanonEntryType;
  custom_type_name?: string;
  summary: string;
  tags: string[];
  aliases?: string[];
  custom_fields: CanonCustomField[];
  relationships: CanonRelationship[];
  backlinks?: CanonBacklink[];
  mention_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CanonEntriesResponse {
  entries: CanonEntry[];
  count: number;
}

export interface CanonCustomType {
  id: string;
  name: string;
  description?: string;
  field_definitions: CanonCustomField[];
  created_at: string;
  updated_at: string;
}

const toQueryString = (params: Record<string, string | undefined>): string => {
  const query = Object.entries(params)
    .filter(([, value]) => value && value.trim() !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`,
    )
    .join("&");

  return query ? `?${query}` : "";
};

export const canonVaultApi = {
  getEntries: (
    seriesId: string,
    options?: {
      q?: string;
      type?: CanonEntryType | "";
      includeBacklinks?: boolean;
    },
  ): Promise<ApiResponse<CanonEntriesResponse>> => {
    const query = toQueryString({
      q: options?.q,
      type: options?.type,
      include_backlinks: options?.includeBacklinks === false ? "false" : "true",
    });
    return apiClient.get(`/series/${seriesId}/canon-vault/entries${query}`);
  },

  createEntry: (
    seriesId: string,
    entry: Partial<CanonEntry>,
  ): Promise<ApiResponse<CanonEntry>> =>
    apiClient.post(`/series/${seriesId}/canon-vault/entries`, entry),

  updateEntry: (
    seriesId: string,
    entryId: string,
    updates: Partial<CanonEntry>,
  ): Promise<ApiResponse<CanonEntry>> =>
    apiClient.put(
      `/series/${seriesId}/canon-vault/entries/${entryId}`,
      updates,
    ),

  deleteEntry: (
    seriesId: string,
    entryId: string,
  ): Promise<ApiResponse<void>> =>
    apiClient.delete(`/series/${seriesId}/canon-vault/entries/${entryId}`),

  getCustomTypes: (seriesId: string): Promise<ApiResponse<CanonCustomType[]>> =>
    apiClient.get(`/series/${seriesId}/canon-vault/custom-types`),

  createCustomType: (
    seriesId: string,
    payload: Pick<
      CanonCustomType,
      "name" | "description" | "field_definitions"
    >,
  ): Promise<ApiResponse<CanonCustomType>> =>
    apiClient.post(`/series/${seriesId}/canon-vault/custom-types`, payload),
};
