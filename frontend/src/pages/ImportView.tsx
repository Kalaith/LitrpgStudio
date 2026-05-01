import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { importsApi } from "../api/imports";
import type {
  DraftImportPreviewResponse,
  DraftImportRequest,
} from "../api/imports";
import { useSeriesStore } from "../stores/seriesStore";
import { navigateToView } from "../utils/appNavigation";
import { resetInitialDataSync } from "../hooks/useApiIntegration";
import { useAuth } from "../contexts/AuthContext";

const NEW_SERIES_VALUE = "__new__";

export default function ImportView() {
  const { series, fetchSeries } = useSeriesStore();
  const { isAuthenticated, continueAsGuest } = useAuth();
  const [selectedSeriesId, setSelectedSeriesId] = useState(NEW_SERIES_VALUE);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [content, setContent] = useState("");
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chapterPreview, setChapterPreview] =
    useState<DraftImportPreviewResponse | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setContent((e.target?.result as string) ?? "");
      setChapterPreview(null);
    };
    reader.readAsText(file);
  };
  useEffect(() => {
    if (series.length === 0) {
      fetchSeries().catch(() => undefined);
    }
  }, [series.length, fetchSeries]);

  const canImport = useMemo(
    () => content.trim() !== "" && !isImporting,
    [content, isImporting],
  );

  const detectedFormat = useMemo(
    () => (/^={3,}\s*$/m.test(content) ? "scrivener" : "markdown"),
    [content],
  );

  const maxPreviewWords = useMemo(
    () =>
      Math.max(...(chapterPreview?.chapters.map((c) => c.word_count) ?? []), 1),
    [chapterPreview],
  );

  const handleContentChange = (value: string) => {
    setContent(value);
    setChapterPreview(null);
  };

  const buildImportPayload = (confirmed: boolean = false) => {
    const isNew = selectedSeriesId === NEW_SERIES_VALUE;
    const name = newSeriesName.trim() || bookTitle.trim() || "New Series";
    const payload: DraftImportRequest = {
      content,
      format: detectedFormat,
      bookTitle: bookTitle.trim() || undefined,
      confirmChapters: confirmed,
      ...(isNew ? { seriesName: name } : {}),
    };

    return {
      seriesId: isNew ? "new" : selectedSeriesId,
      payload,
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!canImport) {
      setErrorMessage("Paste your draft content before importing.");
      return;
    }

    setIsImporting(true);
    try {
      // The import API is authenticated even in preview mode; guest sessions
      // keep later created rows owned by the same guest account.
      if (!isAuthenticated) {
        await continueAsGuest();
      }

      const { seriesId, payload } = buildImportPayload(Boolean(chapterPreview));

      if (!chapterPreview) {
        const previewResponse = await importsApi.previewDraft(
          seriesId,
          payload,
        );

        if (!previewResponse.success || !previewResponse.data) {
          throw new Error(previewResponse.error || "Chapter scan failed.");
        }

        setChapterPreview(previewResponse.data);
        return;
      }

      const response = await importsApi.importDraft(seriesId, payload);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Draft import failed.");
      }

      // Reset the initialData flag so loadInitialData re-runs after navigating
      // to the dashboard and the new series appears immediately.
      resetInitialDataSync();
      fetchSeries().catch(() => undefined);
      navigateToView("import_result", { importResult: response.data });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Draft import failed.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Draft Import
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Import Markdown, text exports, or Scrivener compile text and
            auto-build your series -&gt; book -&gt; chapter structure.
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Heading tip: use lines like{" "}
            <span className="font-mono">Chapter 1: Opening</span> to split
            chapters.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Series
              <select
                value={selectedSeriesId}
                onChange={(event) => setSelectedSeriesId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value={NEW_SERIES_VALUE}>New Series</option>
                {series.map((seriesItem) => (
                  <option key={seriesItem.id} value={seriesItem.id}>
                    {seriesItem.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedSeriesId === NEW_SERIES_VALUE && (
              <input
                type="text"
                value={newSeriesName}
                onChange={(event) => setNewSeriesName(event.target.value)}
                placeholder="Series name (optional)"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            )}
          </div>

          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Book Title (optional)
            <input
              type="text"
              value={bookTitle}
              onChange={(event) => setBookTitle(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Imported Book 1"
            />
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Draft Content
              </span>
              <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={`px-3 py-1.5 transition-colors ${
                    inputMode === "paste"
                      ? "bg-primary-600 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  className={`px-3 py-1.5 transition-colors ${
                    inputMode === "upload"
                      ? "bg-primary-600 text-white"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {inputMode === "paste" ? (
              <textarea
                value={content}
                onChange={(event) => handleContentChange(event.target.value)}
                rows={16}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Paste your draft here..."
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {fileName ? (
                  <>
                    <svg
                      className="w-8 h-8 text-green-500 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {fileName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {content.length.toLocaleString()} characters loaded
                    </p>
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-2">
                      Click to change file
                    </p>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-8 h-8 text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Click to choose a file
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      .txt, .md, .markdown
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          {chapterPreview && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-blue-950 dark:text-blue-100">
                    Review detected chapters
                  </h3>
                  <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
                    Confirm this split before Writers Studio creates the book,
                    story, and chapter records.
                  </p>
                </div>
                <div className="text-xs text-blue-900 dark:text-blue-100 tabular-nums">
                  {chapterPreview.summary.chapter_count} chapters ·{" "}
                  {chapterPreview.summary.scene_count} scenes ·{" "}
                  {chapterPreview.summary.word_count.toLocaleString()} words
                </div>
              </div>

              {chapterPreview.warnings.length > 0 && (
                <div className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  {chapterPreview.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              )}

              <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-blue-100 bg-white dark:border-blue-900 dark:bg-gray-900">
                <table className="min-w-full divide-y divide-blue-100 text-sm dark:divide-blue-900">
                  <thead>
                    <tr className="bg-blue-50/80 dark:bg-blue-950/40">
                      <th className="w-8 px-3 py-2 text-left text-xs font-medium text-blue-700 dark:text-blue-200">
                        #
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 dark:text-blue-200">
                        Chapter
                      </th>
                      <th className="w-20 px-3 py-2 text-right text-xs font-medium text-blue-700 dark:text-blue-200">
                        Scenes
                      </th>
                      <th className="w-24 px-3 py-2 text-right text-xs font-medium text-blue-700 dark:text-blue-200">
                        Words
                      </th>
                      <th className="hidden w-28 px-3 py-2 sm:table-cell" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50 dark:divide-gray-800">
                    {chapterPreview.chapters.map((chapter) => (
                      <tr key={chapter.id}>
                        <td className="px-3 py-2 text-gray-500 tabular-nums dark:text-gray-400">
                          {chapter.chapter_number}
                        </td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">
                          {chapter.title}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 tabular-nums dark:text-gray-300">
                          {chapter.scene_count}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 tabular-nums dark:text-gray-300">
                          {chapter.word_count.toLocaleString()}
                        </td>
                        <td className="hidden px-3 py-2 sm:table-cell">
                          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                            <div
                              className="h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"
                              style={{
                                width: `${Math.max(2, Math.round((chapter.word_count / maxPreviewWords) * 100))}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {chapterPreview && (
              <button
                type="button"
                onClick={() => setChapterPreview(null)}
                disabled={isImporting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Edit Draft First
              </button>
            )}
            <button
              type="submit"
              disabled={!canImport}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isImporting
                ? chapterPreview
                  ? "Importing..."
                  : "Scanning..."
                : chapterPreview
                  ? "Import with These Chapters"
                  : "Scan Chapters"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
