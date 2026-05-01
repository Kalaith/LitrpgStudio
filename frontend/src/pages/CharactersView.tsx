import { FormEvent, useEffect, useState } from "react";
import { charactersApi } from "../api/characters";
import { storiesApi, chaptersApi } from "../api/stories";
import { useSeriesStore } from "../stores/seriesStore";
import { apiClient } from "../api/client";
import type { AppNavigationDetail } from "../utils/appNavigation";

// ── Types matching what the backend actually returns ─────────────────────────

interface CharacterEntry {
  id: string;
  name: string;
  series_id?: string | null;
  appearance?: string;
  personality?: string;
  backstory?: string;
  motivations?: string;
  flaws?: string;
}

interface StoryEntry {
  id: string;
  title: string;
  series_id?: string | null;
  book?: { title: string } | null;
}

interface ChapterEntry {
  id: string;
  title: string;
  chapter_number: number;
  content: string;
}

interface Candidate {
  name: string;
  count: number;
  aliases?: string[];
}

interface LlmModelsResponse {
  data?: unknown;
}

interface LlmChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

type CharacterForm = Omit<CharacterEntry, "id">;

const emptyForm = (): CharacterForm => ({
  name: "",
  series_id: "",
  appearance: "",
  personality: "",
  backstory: "",
  motivations: "",
  flaws: "",
});

// ── AI-based name extraction (proxied through backend to keep API keys private)

async function isLlmAvailable(): Promise<boolean> {
  try {
    const res = await apiClient.rawGet<LlmModelsResponse>("/llm/models");
    return res.data !== undefined;
  } catch {
    return false;
  }
}

async function extractCandidatesWithLlm(
  chapters: ChapterEntry[],
): Promise<Candidate[]> {
  // Combine chapter text, truncating to ~12k chars per chunk to stay within context limits
  const MAX_CHUNK = 12000;
  const fullText = chapters.map((c) => c.content).join("\n\n---\n\n");
  const chunks: string[] = [];
  for (let i = 0; i < fullText.length; i += MAX_CHUNK) {
    chunks.push(fullText.slice(i, i + MAX_CHUNK));
  }

  // Phase 1: Collect raw names from each chunk
  const allNames = new Map<string, number>();

  for (const chunk of chunks) {
    const res = await apiClient.rawPost<LlmChatResponse>("/llm/chat", {
      model: "local-model",
      messages: [
        {
          role: "system",
          content:
            "You are a fiction analysis assistant. Extract ONLY character names (people, not places or objects) from the provided text. Return a JSON array of strings — just the names, nothing else. Include both short forms and full names as they appear. Do not include pronouns, titles alone, or non-character words.",
        },
        {
          role: "user",
          content: `Extract all character names from this fiction text. Return ONLY a JSON array of name strings, no explanation.\n\n${chunk}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const content = res.choices?.[0]?.message?.content ?? "";

    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      try {
        const names: string[] = JSON.parse(jsonMatch[0]);
        for (const name of names) {
          if (typeof name === "string" && name.trim().length >= 2) {
            const clean = name.trim();
            allNames.set(clean, (allNames.get(clean) ?? 0) + 1);
          }
        }
      } catch {
        /* ignore parse errors */
      }
    }
  }

  if (allNames.size === 0) return [];

  // Phase 2: Ask LLM to consolidate name variants into groups
  const nameList = Array.from(allNames.keys());
  const consolidateRes = await apiClient.rawPost<LlmChatResponse>("/llm/chat", {
    model: "local-model",
    messages: [
      {
        role: "system",
        content:
          'You are a fiction analysis assistant. Given a list of character names extracted from a novel, group names that refer to the same character. Return a JSON array of arrays, where each inner array contains the variant names for one character, with the FULLEST/most complete name first. For example: [["Lyra Meadowlight", "Lyra"], ["John Smith", "John"]]. Names that have no variants should still be in a single-element array. Do not add names that are not in the input list.',
      },
      {
        role: "user",
        content: `Group these character names by identity (same person = same group). Return ONLY the JSON array of arrays, no explanation.\n\nNames: ${JSON.stringify(nameList)}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 2048,
  });

  const consolidateContent =
    consolidateRes.choices?.[0]?.message?.content ?? "";

  const consolidateMatch = consolidateContent.match(/\[[\s\S]*\]/);
  if (consolidateMatch) {
    try {
      const groups: string[][] = JSON.parse(consolidateMatch[0]);
      if (
        Array.isArray(groups) &&
        groups.length > 0 &&
        Array.isArray(groups[0])
      ) {
        return groups
          .filter((g) => Array.isArray(g) && g.length > 0)
          .map((group) => {
            // Use the fullest name (first in group) as the canonical name
            const canonical = group[0];
            // Sum up mention counts for all variants
            const totalCount = group.reduce(
              (sum, variant) => sum + (allNames.get(variant) ?? 0),
              0,
            );
            // Store variant names (excluding canonical) for display
            const aliases = group.slice(1).filter((v) => v !== canonical);
            return {
              name: canonical,
              count: totalCount,
              aliases,
            };
          })
          .sort((a, b) => b.count - a.count);
      }
    } catch {
      /* fall through to ungrouped */
    }
  }

  // Fallback: return ungrouped if consolidation fails
  return Array.from(allNames.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// ── LLM-based character detail extraction ─────────────────────────────────────

interface CharacterDetails {
  appearance: string;
  personality: string;
  backstory: string;
  motivations: string;
  flaws: string;
}

async function extractCharacterDetails(
  characterName: string,
  chapters: ChapterEntry[],
  aliases: string[] = [],
): Promise<CharacterDetails | null> {
  // Build name variants: full name, each individual word (first/last), plus explicit aliases
  const parts = characterName.split(/\s+/).filter((p) => p.length >= 2);
  const autoVariants =
    parts.length > 1 ? [characterName, ...parts] : [characterName];
  const allAliases = [...new Set([...autoVariants, ...aliases])];
  const nameVariants = allAliases;
  const mentions: string[] = [];
  let totalLen = 0;
  const MAX_CONTEXT = 10000;

  for (const chapter of chapters) {
    const lines = chapter.content.split(/\n/);
    for (let i = 0; i < lines.length; i++) {
      if (
        nameVariants.some((v) => lines[i].includes(v)) &&
        totalLen < MAX_CONTEXT
      ) {
        // Grab surrounding context (±2 lines)
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 3);
        const passage = lines.slice(start, end).join("\n");
        mentions.push(passage);
        totalLen += passage.length;
      }
    }
  }

  if (mentions.length === 0) return null;

  const excerpts = mentions.join("\n---\n").slice(0, MAX_CONTEXT);

  const res = await apiClient.rawPost<LlmChatResponse>("/llm/chat", {
    model: "local-model",
    messages: [
      {
        role: "system",
        content: `You are a fiction analysis assistant. Given excerpts from a novel that mention a character, extract structured details about that character. Return ONLY a JSON object with these exact keys: "appearance", "personality", "backstory", "motivations", "flaws". Each value should be a concise paragraph (2-4 sentences) summarising what can be inferred from the text. If something cannot be determined, use an empty string.`,
      },
      {
        role: "user",
        content: `Character name: "${characterName}"${parts.length > 1 ? ` (also referred to as "${parts[0]}" or "${parts[parts.length - 1]}")` : ""}\n\nExcerpts:\n${excerpts}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 1024,
  });

  const content = res.choices?.[0]?.message?.content ?? "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        appearance:
          typeof parsed.appearance === "string" ? parsed.appearance : "",
        personality:
          typeof parsed.personality === "string" ? parsed.personality : "",
        backstory: typeof parsed.backstory === "string" ? parsed.backstory : "",
        motivations:
          typeof parsed.motivations === "string" ? parsed.motivations : "",
        flaws: typeof parsed.flaws === "string" ? parsed.flaws : "",
      };
    } catch {
      /* ignore parse errors */
    }
  }

  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500";

interface CharactersViewProps {
  navigationState?: AppNavigationDetail | null;
}

export default function CharactersView({
  navigationState,
}: CharactersViewProps) {
  const { series, currentSeries, fetchSeries } = useSeriesStore();

  const [characters, setCharacters] = useState<CharacterEntry[]>([]);
  const [stories, setStories] = useState<StoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters — default to the globally selected series
  const [filterSeriesId, setFilterSeriesId] = useState(currentSeries?.id ?? "");

  // Profile view
  const [viewingChar, setViewingChar] = useState<CharacterEntry | null>(null);

  // Keep profile view in sync with character updates (e.g. after enrichment)
  useEffect(() => {
    if (viewingChar) {
      const updated = characters.find((c) => c.id === viewingChar.id);
      if (updated && updated !== viewingChar) setViewingChar(updated);
    }
  }, [characters, viewingChar]);

  // Add/Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CharacterForm>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Scan panel
  const [showScan, setShowScan] = useState(false);
  const [scanStoryId, setScanStoryId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanMethod, setScanMethod] = useState<"ai" | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isAddingFromScan, setIsAddingFromScan] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [enrichStatus, setEnrichStatus] = useState<
    Map<string, "pending" | "running" | "done" | "failed">
  >(new Map());
  const [isEnrichingAll, setIsEnrichingAll] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (series.length === 0) fetchSeries().catch(() => undefined);
  }, [series.length, fetchSeries]);

  // Keep filter in sync when global series selection changes
  useEffect(() => {
    if (currentSeries?.id) {
      setFilterSeriesId(currentSeries.id);
      setScanStoryId(""); // reset so the auto-pick effect fires
      setScanDone(false);
      setScanError(null);
      setCandidates([]);
    }
  }, [currentSeries?.id]);

  useEffect(() => {
    if (navigationState?.view !== "characters") {
      return;
    }

    const payload = navigationState.payload as
      | { seriesId?: unknown; storyId?: unknown }
      | undefined;
    const targetSeriesId =
      typeof payload?.seriesId === "string" ? payload.seriesId : "";
    const targetStoryId =
      typeof payload?.storyId === "string" ? payload.storyId : "";

    if (!targetSeriesId && !targetStoryId) {
      return;
    }

    if (targetSeriesId) {
      setFilterSeriesId(targetSeriesId);
    }
    if (targetStoryId) {
      setScanStoryId(targetStoryId);
      setShowScan(true);
    }
    setScanDone(false);
    setScanError(null);
    setCandidates([]);
    setSelected(new Set());
  }, [navigationState?.payload, navigationState?.token, navigationState?.view]);

  useEffect(() => {
    Promise.all([charactersApi.getAll(), storiesApi.getAll()])
      .then(([charRes, storyRes]) => {
        if (charRes.success && Array.isArray(charRes.data)) {
          setCharacters(charRes.data as unknown as CharacterEntry[]);
        }
        if (storyRes.success && Array.isArray(storyRes.data)) {
          setStories(storyRes.data as unknown as StoryEntry[]);
        }
      })
      .catch(() => {
        setLoadError("Could not reach the backend.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = filterSeriesId
    ? characters.filter((c) => c.series_id === filterSeriesId)
    : characters;

  const storiesForScan = filterSeriesId
    ? stories.filter((s) => s.series_id === filterSeriesId)
    : stories;

  // Auto-select the first story when the filtered list changes and nothing is picked yet
  useEffect(() => {
    if (!scanStoryId && storiesForScan.length > 0) {
      setScanStoryId(storiesForScan[0].id);
    }
  }, [storiesForScan, scanStoryId]);

  const getSeriesName = (id?: string | null) =>
    series.find((s) => s.id === id)?.name ?? null;

  // ── Scan ───────────────────────────────────────────────────────────────────

  const runScan = async () => {
    if (!scanStoryId) return;
    setIsScanning(true);
    setScanDone(false);
    setCandidates([]);
    setSelected(new Set());
    setScanMethod(null);
    setScanError(null);
    try {
      const res = await chaptersApi.getByStoryId(scanStoryId);
      if (res.success && Array.isArray(res.data)) {
        const chapters = res.data as unknown as ChapterEntry[];

        const llmReady = await isLlmAvailable();
        if (!llmReady) {
          throw new Error(
            "AI character scanning is not configured. Add a Gemini or OpenAI API key to the backend env file.",
          );
        }

        const found = await extractCandidatesWithLlm(chapters);
        setScanMethod("ai");
        setCandidates(found);
        setScanDone(true);
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "AI scan failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const toggleCandidate = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(candidates.map((c) => c.name)));
  const selectNone = () => setSelected(new Set());

  // Filter out candidates that are already characters in this context
  const existingNames = new Set(filtered.map((c) => c.name.toLowerCase()));
  const newCandidates = candidates.filter(
    (c) => !existingNames.has(c.name.toLowerCase()),
  );

  // Determine series_id for newly added characters
  const scanSeries =
    stories.find((s) => s.id === scanStoryId)?.series_id ??
    filterSeriesId ??
    null;

  const addFromScan = async () => {
    if (selected.size === 0) return;
    setIsAddingFromScan(true);
    const created: CharacterEntry[] = [];
    const selectedNames = Array.from(selected);

    // Build alias lookup from candidates
    const aliasMap = new Map<string, string[]>();
    for (const c of candidates) {
      if (c.aliases && c.aliases.length > 0) {
        aliasMap.set(c.name, c.aliases);
      }
    }

    // Phase 1: Create all characters with just their names
    for (const name of selectedNames) {
      try {
        const res = await charactersApi.create({
          name,
          series_id: scanSeries,
        } as never);
        if (res.success && res.data) {
          created.push(res.data as unknown as CharacterEntry);
        }
      } catch {
        // skip failures
      }
    }
    setCharacters((prev) => [...prev, ...created]);
    setSelected(new Set());
    setCandidates((prev) =>
      prev.filter((c) => !selectedNames.includes(c.name)),
    );
    setIsAddingFromScan(false);

    // Phase 2: Enrich each character with LLM-extracted details (runs in background)
    const llmReady = await isLlmAvailable();
    if (!llmReady || created.length === 0 || !scanStoryId) return;

    // Fetch chapters once for all enrichment calls
    const chaptersRes = await chaptersApi.getByStoryId(scanStoryId);
    if (!chaptersRes.success || !Array.isArray(chaptersRes.data)) return;
    const chapters = chaptersRes.data as unknown as ChapterEntry[];

    // Initialise status map
    const statusMap = new Map<
      string,
      "pending" | "running" | "done" | "failed"
    >();
    for (const c of created) statusMap.set(c.id, "pending");
    setEnrichStatus(new Map(statusMap));

    // Process sequentially to avoid overloading the configured AI provider.
    for (const char of created) {
      statusMap.set(char.id, "running");
      setEnrichStatus(new Map(statusMap));

      try {
        const details = await extractCharacterDetails(
          char.name,
          chapters,
          aliasMap.get(char.name) ?? [],
        );
        if (details) {
          const updateRes = await charactersApi.update(
            char.id,
            details as never,
          );
          if (updateRes.success && updateRes.data) {
            setCharacters((prev) =>
              prev.map((c) =>
                c.id === char.id
                  ? (updateRes.data as unknown as CharacterEntry)
                  : c,
              ),
            );
          }
          statusMap.set(char.id, "done");
        } else {
          statusMap.set(char.id, "done");
        }
      } catch {
        statusMap.set(char.id, "failed");
      }
      setEnrichStatus(new Map(statusMap));
    }
  };

  // ── Enrichment helpers ─────────────────────────────────────────────────────

  /** Resolve the story ID to use for enrichment — prefer scanStoryId, fall back to first story in series */
  const resolveEnrichStoryId = (): string | null => {
    if (scanStoryId) return scanStoryId;
    if (storiesForScan.length > 0) return storiesForScan[0].id;
    if (stories.length > 0) return stories[0].id;
    return null;
  };

  /** Enrich a single character with LLM-extracted details */
  const enrichCharacter = async (
    charId: string,
    charName: string,
    chapters: ChapterEntry[],
  ) => {
    const details = await extractCharacterDetails(charName, chapters);
    if (details) {
      const updateRes = await charactersApi.update(charId, details as never);
      if (updateRes.success && updateRes.data) {
        setCharacters((prev) =>
          prev.map((c) =>
            c.id === charId ? (updateRes.data as unknown as CharacterEntry) : c,
          ),
        );
      }
      return true;
    }
    return false;
  };

  /** Scan a single character for details (called from per-card button) */
  const enrichSingle = async (charId: string, charName: string) => {
    const storyId = resolveEnrichStoryId();
    if (!storyId) return;

    const llmReady = await isLlmAvailable();
    if (!llmReady) {
      alert("AI scanning is not configured. Check the backend env file.");
      return;
    }

    setEnrichStatus((prev) => new Map(prev).set(charId, "running"));
    try {
      const chaptersRes = await chaptersApi.getByStoryId(storyId);
      if (!chaptersRes.success || !Array.isArray(chaptersRes.data))
        throw new Error("no chapters");
      const chapters = chaptersRes.data as unknown as ChapterEntry[];
      const ok = await enrichCharacter(charId, charName, chapters);
      setEnrichStatus((prev) =>
        new Map(prev).set(charId, ok ? "done" : "failed"),
      );
    } catch {
      setEnrichStatus((prev) => new Map(prev).set(charId, "failed"));
    }
  };

  /** Broad scan — enrich ALL filtered characters */
  const enrichAll = async () => {
    const storyId = resolveEnrichStoryId();
    if (!storyId) return;

    const llmReady = await isLlmAvailable();
    if (!llmReady) {
      alert("AI scanning is not configured. Check the backend env file.");
      return;
    }

    setIsEnrichingAll(true);
    const chaptersRes = await chaptersApi.getByStoryId(storyId);
    if (!chaptersRes.success || !Array.isArray(chaptersRes.data)) {
      setIsEnrichingAll(false);
      return;
    }
    const chapters = chaptersRes.data as unknown as ChapterEntry[];

    const targets = filtered;
    const statusMap = new Map<
      string,
      "pending" | "running" | "done" | "failed"
    >();
    for (const c of targets) statusMap.set(c.id, "pending");
    setEnrichStatus(new Map(statusMap));

    for (const char of targets) {
      statusMap.set(char.id, "running");
      setEnrichStatus(new Map(statusMap));
      try {
        const ok = await enrichCharacter(char.id, char.name, chapters);
        statusMap.set(char.id, ok ? "done" : "failed");
      } catch {
        statusMap.set(char.id, "failed");
      }
      setEnrichStatus(new Map(statusMap));
    }
    setIsEnrichingAll(false);
  };

  // ── Form handlers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), series_id: filterSeriesId || "" });
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (char: CharacterEntry) => {
    setEditingId(char.id);
    setForm({
      name: char.name,
      series_id: char.series_id ?? "",
      appearance: char.appearance ?? "",
      personality: char.personality ?? "",
      backstory: char.backstory ?? "",
      motivations: char.motivations ?? "",
      flaws: char.flaws ?? "",
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const payload = { ...form, series_id: form.series_id || null };
      if (editingId) {
        const res = await charactersApi.update(editingId, payload as never);
        if (res.success && res.data) {
          setCharacters((prev) =>
            prev.map((c) =>
              c.id === editingId ? (res.data as unknown as CharacterEntry) : c,
            ),
          );
        }
      } else {
        const res = await charactersApi.create(payload as never);
        if (res.success && res.data) {
          setCharacters((prev) => [
            ...prev,
            res.data as unknown as CharacterEntry,
          ]);
        }
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this character?")) return;
    try {
      await charactersApi.delete(id);
      setCharacters((prev) => prev.filter((c) => c.id !== id));
    } catch {
      /* ignore */
    }
  };

  const field = (key: keyof CharacterForm) => ({
    value: form[key] ?? "",
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Characters
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Track the people in your story — appearances, traits, and
              motivations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {series.length > 0 && (
              <select
                value={filterSeriesId}
                onChange={(e) => {
                  setFilterSeriesId(e.target.value);
                  setScanDone(false);
                  setScanError(null);
                  setCandidates([]);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">All Series</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowScan((v) => !v)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                showScan
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              🔍 Scan Draft for Names
            </button>
            <button
              onClick={enrichAll}
              disabled={filtered.length === 0 || isEnrichingAll}
              className="rounded-lg border border-purple-300 dark:border-purple-700 px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isEnrichingAll && (
                <svg
                  className="animate-spin w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {isEnrichingAll ? "Scanning…" : "✨ Scan All for Details"}
            </button>
            <button
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              + Add Character
            </button>
          </div>
        </div>

        {/* ── Scan Panel ── */}
        {showScan && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-900/10 p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Scan Draft for Character Names
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Uses the configured AI provider to read the selected draft,
                extract character names, and prepare them for detail scanning.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Story / Draft
                </label>
                <select
                  value={scanStoryId}
                  onChange={(e) => {
                    setScanStoryId(e.target.value);
                    setScanDone(false);
                    setScanError(null);
                    setCandidates([]);
                  }}
                  className={inputCls}
                >
                  <option value="">— choose a story —</option>
                  {storiesForScan.map((s) => {
                    const sName = getSeriesName(s.series_id);
                    const label = sName ? `${sName} › ${s.title}` : s.title;
                    return (
                      <option key={s.id} value={s.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button
                onClick={runScan}
                disabled={!scanStoryId || isScanning}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isScanning && (
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
                {isScanning ? "Scanning…" : "Scan Chapters"}
              </button>
            </div>

            {scanError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
                {scanError}
              </div>
            )}

            {scanDone && newCandidates.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI did not find any new names, or all detected names are already
                added.
              </p>
            )}

            {newCandidates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {newCandidates.length} candidate names found
                    {scanMethod && (
                      <span className="ml-2 inline-flex items-center rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        AI
                      </span>
                    )}{" "}
                    — check the ones that are characters:
                  </p>
                  <div className="flex gap-3 text-xs text-blue-600 dark:text-blue-400">
                    <button onClick={selectAll} className="hover:underline">
                      Select all
                    </button>
                    <button onClick={selectNone} className="hover:underline">
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {newCandidates.map(({ name, count, aliases }) => (
                    <label
                      key={name}
                      title={
                        aliases && aliases.length > 0
                          ? `Also known as: ${aliases.join(", ")}`
                          : name
                      }
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 cursor-pointer text-sm transition-colors ${
                        selected.has(name)
                          ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600"
                        checked={selected.has(name)}
                        onChange={() => toggleCandidate(name)}
                      />
                      <span className="flex-1 truncate">
                        <span className="font-medium">{name}</span>
                        {aliases && aliases.length > 0 && (
                          <span className="block text-[10px] text-gray-400 dark:text-gray-500 truncate">
                            aka {aliases.join(", ")}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        ×{count}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={addFromScan}
                    disabled={selected.size === 0 || isAddingFromScan}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingFromScan
                      ? "Adding…"
                      : `Add ${selected.size > 0 ? selected.size : ""} Character${selected.size !== 1 ? "s" : ""}`}
                  </button>
                </div>
              </div>
            )}

            {/* ── LLM enrichment progress ── */}
            {enrichStatus.size > 0 && (
              <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/10 p-4 space-y-2">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                  Extracting character details from story…
                </p>
                <div className="space-y-1">
                  {Array.from(enrichStatus.entries()).map(
                    ([charId, status]) => {
                      const char = characters.find((c) => c.id === charId);
                      return (
                        <div
                          key={charId}
                          className="flex items-center gap-2 text-xs"
                        >
                          {status === "running" && (
                            <svg
                              className="animate-spin w-3.5 h-3.5 text-purple-600"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                          )}
                          {status === "done" && (
                            <span className="text-green-600 dark:text-green-400">
                              ✓
                            </span>
                          )}
                          {status === "failed" && (
                            <span className="text-red-500">✗</span>
                          )}
                          {status === "pending" && (
                            <span className="text-gray-400">○</span>
                          )}
                          <span
                            className={`${status === "running" ? "text-purple-700 dark:text-purple-300 font-medium" : "text-gray-600 dark:text-gray-400"}`}
                          >
                            {char?.name ?? charId}
                          </span>
                          {status === "done" && char?.appearance && (
                            <span className="text-gray-400 dark:text-gray-500 ml-1">
                              — details saved
                            </span>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
                {Array.from(enrichStatus.values()).every(
                  (s) => s === "done" || s === "failed",
                ) && (
                  <button
                    onClick={() => setEnrichStatus(new Map())}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-1"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Loading / Error ── */}
        {isLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        )}
        {loadError && !isLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {loadError}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && !loadError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-14 text-center px-6">
            <svg
              className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {filterSeriesId
                ? "No characters in this series yet"
                : "No characters yet"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 max-w-sm">
              Use <strong>Scan Draft for Names</strong> to extract candidates
              from your imported chapters, or add characters manually.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowScan(true)}
                className="rounded-lg border border-blue-300 dark:border-blue-700 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Scan Draft for Names
              </button>
              <button
                onClick={openCreate}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add Manually
              </button>
            </div>
          </div>
        )}

        {/* ── Character Grid ── */}
        {filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((char) => {
              const sName = getSeriesName(char.series_id);
              return (
                <div
                  key={char.id}
                  className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 space-y-2 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  onClick={() => setViewingChar(char)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {char.name}
                      </p>
                      {sName && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {sName}
                        </p>
                      )}
                    </div>
                    <div
                      className="flex gap-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => enrichSingle(char.id, char.name)}
                        disabled={enrichStatus.get(char.id) === "running"}
                        title="Scan story for this character's details"
                        className="rounded px-2 py-1 text-xs text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        {enrichStatus.get(char.id) === "running" ? (
                          <svg
                            className="animate-spin w-3.5 h-3.5 inline"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : enrichStatus.get(char.id) === "done" ? (
                          "✓ Scanned"
                        ) : (
                          "✨ Scan"
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(char)}
                        className="rounded px-2 py-1 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(char.id)}
                        className="rounded px-2 py-1 text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {char.appearance && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {char.appearance}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {char.personality && (
                      <span className="rounded-full bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 text-xs text-purple-700 dark:text-purple-300">
                        {char.personality.slice(0, 40)}
                        {char.personality.length > 40 ? "…" : ""}
                      </span>
                    )}
                    {char.motivations && (
                      <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                        ↗ {char.motivations.slice(0, 35)}
                        {char.motivations.length > 35 ? "…" : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Character Profile Modal ── */}
      {viewingChar && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => setViewingChar(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {viewingChar.name}
                </h2>
                {getSeriesName(viewingChar.series_id) && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {getSeriesName(viewingChar.series_id)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    enrichSingle(viewingChar.id, viewingChar.name);
                  }}
                  disabled={enrichStatus.get(viewingChar.id) === "running"}
                  className="rounded-lg border border-purple-300 dark:border-purple-700 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {enrichStatus.get(viewingChar.id) === "running" ? (
                    <svg
                      className="animate-spin w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    "\u2728"
                  )}{" "}
                  Scan
                </button>
                <button
                  onClick={() => {
                    setViewingChar(null);
                    openEdit(viewingChar);
                  }}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => setViewingChar(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none ml-1"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Profile body */}
            <div className="p-6 space-y-5">
              {/* Appearance */}
              {viewingChar.appearance ? (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                    Appearance
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {viewingChar.appearance}
                  </p>
                </section>
              ) : null}

              {/* Personality */}
              {viewingChar.personality ? (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                    Personality
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {viewingChar.personality}
                  </p>
                </section>
              ) : null}

              {/* Backstory */}
              {viewingChar.backstory ? (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                    Backstory
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {viewingChar.backstory}
                  </p>
                </section>
              ) : null}

              {/* Motivations */}
              {viewingChar.motivations ? (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                    Motivations
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {viewingChar.motivations}
                  </p>
                </section>
              ) : null}

              {/* Flaws */}
              {viewingChar.flaws ? (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                    Flaws &amp; Fears
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {viewingChar.flaws}
                  </p>
                </section>
              ) : null}

              {/* Empty state */}
              {!viewingChar.appearance &&
                !viewingChar.personality &&
                !viewingChar.backstory &&
                !viewingChar.motivations &&
                !viewingChar.flaws && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">
                      No details yet for this character.
                    </p>
                    <button
                      onClick={() =>
                        enrichSingle(viewingChar.id, viewingChar.name)
                      }
                      disabled={enrichStatus.get(viewingChar.id) === "running"}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {enrichStatus.get(viewingChar.id) === "running"
                        ? "Scanning\u2026"
                        : "\u2728 Scan for Details"}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Character" : "Add Character"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Name <span className="text-red-500">*</span>
                <input
                  type="text"
                  className={`mt-1 ${inputCls}`}
                  placeholder="e.g. Elara"
                  {...field("name")}
                  autoFocus
                />
              </label>
              {series.length > 0 && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Series
                  <select
                    className={`mt-1 ${inputCls}`}
                    {...field("series_id")}
                  >
                    <option value="">— not linked —</option>
                    {series.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Appearance
                <textarea
                  rows={2}
                  className={`mt-1 ${inputCls}`}
                  placeholder="What they look like"
                  {...field("appearance")}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Personality
                <textarea
                  rows={2}
                  className={`mt-1 ${inputCls}`}
                  placeholder="How they act, speak, present themselves"
                  {...field("personality")}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Backstory
                <textarea
                  rows={3}
                  className={`mt-1 ${inputCls}`}
                  placeholder="History and context relevant to the story"
                  {...field("backstory")}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Motivations
                <textarea
                  rows={2}
                  className={`mt-1 ${inputCls}`}
                  placeholder="What they want and why"
                  {...field("motivations")}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Flaws / Fears
                <textarea
                  rows={2}
                  className={`mt-1 ${inputCls}`}
                  placeholder="Weaknesses, blind spots, fears"
                  {...field("flaws")}
                />
              </label>
              {formError && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving…"
                    : editingId
                      ? "Save Changes"
                      : "Add Character"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
