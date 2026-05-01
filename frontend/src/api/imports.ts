import { apiClient, ApiResponse } from "./client";

export interface DraftImportRequest {
  content: string;
  format: "markdown" | "txt" | "scrivener";
  bookTitle?: string;
  storyTitle?: string;
  seriesName?: string;
  previewOnly?: boolean;
  confirmChapters?: boolean;
}

export interface DraftImportChapterSummary {
  id: string;
  title: string;
  chapter_number: number;
  word_count: number;
  scene_count: number;
}

export interface DraftImportResponse {
  series?: {
    id: string;
    title: string;
  };
  book: {
    id: string;
    title: string;
    book_number: number;
  };
  story: {
    id: string;
    title: string;
  };
  chapters: DraftImportChapterSummary[];
  summary: {
    chapter_count: number;
    scene_count: number;
    word_count: number;
    format: string;
  };
}

export interface DraftImportPreviewResponse {
  chapters: DraftImportChapterSummary[];
  summary: {
    chapter_count: number;
    scene_count: number;
    word_count: number;
    format: string;
  };
  warnings: string[];
  requires_confirmation: boolean;
}

export const importsApi = {
  previewDraft: (
    seriesId: string,
    payload: DraftImportRequest,
  ): Promise<ApiResponse<DraftImportPreviewResponse>> =>
    apiClient.post(`/series/${seriesId}/imports/draft`, {
      ...payload,
      previewOnly: true,
    }),
  importDraft: (
    seriesId: string,
    payload: DraftImportRequest,
  ): Promise<ApiResponse<DraftImportResponse>> =>
    apiClient.post(`/series/${seriesId}/imports/draft`, payload),
};
