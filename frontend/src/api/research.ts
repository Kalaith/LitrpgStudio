import { apiClient, ApiResponse } from "./client";
import type { ResearchCollection, ResearchSource } from "../types/research";

type ResearchSourceApi = Partial<ResearchSource> & {
  created_at?: string;
  updated_at?: string;
  last_accessed?: string;
};

type ResearchCollectionApi = Partial<ResearchCollection> & {
  created_at?: string;
  updated_at?: string;
};

function toDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeSource(raw: ResearchSourceApi): ResearchSource {
  const content = raw.content ?? {
    summary: "",
    keyPoints: [],
    excerpts: [],
    media: [],
    structure: {
      headings: [],
      sections: [],
      references: [],
      figures: [],
      tables: [],
    },
    readingTime: 0,
    wordCount: 0,
    language: "en",
    quality: {
      credibility: 0,
      accuracy: 0,
      relevance: 0,
      completeness: 0,
      freshness: 0,
      overallScore: 0,
      issues: [],
    },
  };
  const metadata = raw.metadata ?? {
    author: [],
    accessDate: new Date(),
    format: "unknown",
  };
  const now = new Date();

  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    type: (raw.type ?? "article") as ResearchSource["type"],
    content: {
      ...content,
      keyPoints: content.keyPoints ?? [],
      excerpts: content.excerpts ?? [],
      media: content.media ?? [],
      structure: content.structure ?? {
        headings: [],
        sections: [],
        references: [],
        figures: [],
        tables: [],
      },
      quality: content.quality ?? {
        credibility: 0,
        accuracy: 0,
        relevance: 0,
        completeness: 0,
        freshness: 0,
        overallScore: 0,
        issues: [],
      },
    },
    metadata: {
      ...metadata,
      author: metadata.author ?? [],
      accessDate: toDate(metadata.accessDate, now),
      publishDate: metadata.publishDate
        ? toDate(metadata.publishDate, now)
        : undefined,
      format: metadata.format ?? "unknown",
    },
    annotations: raw.annotations ?? [],
    links: raw.links ?? [],
    citations: raw.citations ?? [],
    attachments: raw.attachments ?? [],
    tags: raw.tags ?? [],
    collections: raw.collections ?? [],
    favorited: Boolean(raw.favorited),
    archived: Boolean(raw.archived),
    createdAt: toDate(raw.createdAt ?? raw.created_at, now),
    updatedAt: toDate(raw.updatedAt ?? raw.updated_at, now),
    lastAccessed: toDate(raw.lastAccessed ?? raw.last_accessed, now),
  };
}

function normalizeCollection(raw: ResearchCollectionApi): ResearchCollection {
  const now = new Date();
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: raw.description ?? "",
    category: (raw.category ?? "general") as ResearchCollection["category"],
    sources: raw.sources ?? [],
    tags: raw.tags ?? [],
    color: raw.color ?? "#3B82F6",
    icon: raw.icon ?? "📚",
    visibility: raw.visibility ?? "private",
    collaborators: raw.collaborators ?? [],
    createdAt: toDate(raw.createdAt ?? raw.created_at, now),
    updatedAt: toDate(raw.updatedAt ?? raw.updated_at, now),
  };
}

const mapResponse = <TInput, TOutput>(
  response: ApiResponse<TInput>,
  transform: (data: TInput) => TOutput,
): ApiResponse<TOutput> => ({
  success: response.success,
  data: response.data ? transform(response.data) : undefined,
  error: response.error,
  message: response.message,
  status: response.status,
});

export const researchApi = {
  getSources: async (): Promise<ApiResponse<ResearchSource[]>> => {
    const response =
      await apiClient.get<ResearchSourceApi[]>("/research/sources");
    return mapResponse(response, (sources) => sources.map(normalizeSource));
  },

  getCollections: async (): Promise<ApiResponse<ResearchCollection[]>> => {
    const response = await apiClient.get<ResearchCollectionApi[]>(
      "/research/collections",
    );
    return mapResponse(response, (collections) =>
      collections.map(normalizeCollection),
    );
  },
};
