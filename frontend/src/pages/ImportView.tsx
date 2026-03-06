import { FormEvent, useEffect, useMemo, useState } from 'react';
import { importsApi, type DraftImportResponse } from '../api/imports';
import { useSeriesStore } from '../stores/seriesStore';

type DraftFormat = 'markdown' | 'txt' | 'scrivener';

const formatNumber = (value: number): string => new Intl.NumberFormat().format(value);

export default function ImportView() {
  const { series, currentSeries, fetchSeries } = useSeriesStore();
  const [selectedSeriesId, setSelectedSeriesId] = useState(currentSeries?.id ?? '');
  const [format, setFormat] = useState<DraftFormat>('markdown');
  const [bookTitle, setBookTitle] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<DraftImportResponse | null>(null);

  useEffect(() => {
    if (series.length === 0) {
      fetchSeries().catch(() => undefined);
    }
  }, [series.length, fetchSeries]);

  useEffect(() => {
    if (!selectedSeriesId && currentSeries?.id) {
      setSelectedSeriesId(currentSeries.id);
    }
  }, [selectedSeriesId, currentSeries?.id]);

  const canImport = useMemo(
    () => selectedSeriesId.trim() !== '' && content.trim() !== '' && !isImporting,
    [selectedSeriesId, content, isImporting]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setImportResult(null);

    if (!canImport) {
      setErrorMessage('Select a series and provide draft content before importing.');
      return;
    }

    setIsImporting(true);
    try {
      const response = await importsApi.importDraft(selectedSeriesId, {
        content,
        format,
        bookTitle: bookTitle.trim() || undefined,
        storyTitle: storyTitle.trim() || undefined,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Draft import failed.');
      }

      setImportResult(response.data);
      fetchSeries().catch(() => undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Draft import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Draft Import</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Import Markdown, text exports, or Scrivener compile text and auto-build your
            series -&gt; book -&gt; chapter structure.
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Heading tip: use lines like <span className="font-mono">Chapter 1: Opening</span> to split chapters.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Series
              <select
                value={selectedSeriesId}
                onChange={(event) => setSelectedSeriesId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select a series</option>
                {series.map((seriesItem) => (
                  <option key={seriesItem.id} value={seriesItem.id}>
                    {seriesItem.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Source Format
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value as DraftFormat)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="markdown">Markdown</option>
                <option value="txt">Text (.txt)</option>
                <option value="scrivener">Scrivener export text</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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

            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Story Title (optional)
              <input
                type="text"
                value={storyTitle}
                onChange={(event) => setStoryTitle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Book 1 Draft"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Draft Content
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={16}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Paste your draft export here..."
            />
          </label>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canImport}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isImporting ? 'Importing...' : 'Import Draft'}
            </button>
          </div>
        </form>

        {importResult && (
          <section className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm dark:border-green-900 dark:bg-green-900/20">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-200">Import Complete</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-white px-3 py-2 text-sm dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">Book</p>
                <p className="font-medium text-gray-900 dark:text-white">{importResult.book.title}</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2 text-sm dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">Story</p>
                <p className="font-medium text-gray-900 dark:text-white">{importResult.story.title}</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2 text-sm dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">Chapters</p>
                <p className="font-medium text-gray-900 dark:text-white">{importResult.summary.chapter_count}</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2 text-sm dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">Words</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatNumber(importResult.summary.word_count)}</p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-green-100 bg-white dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/30">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Chapter</th>
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Scenes</th>
                    <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Words</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {importResult.chapters.map((chapter) => (
                    <tr key={chapter.id}>
                      <td className="px-4 py-2 text-gray-900 dark:text-white">
                        {chapter.chapter_number}. {chapter.title}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{chapter.scene_count}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{formatNumber(chapter.word_count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
