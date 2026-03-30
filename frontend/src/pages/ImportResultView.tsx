import { useState } from 'react';
import { apiClient } from '../api/client';
import type { DraftImportResponse } from '../api/imports';
import { navigateToView } from '../utils/appNavigation';
import type { AppNavigationDetail } from '../utils/appNavigation';

interface ImportResultViewProps {
  navigationState?: AppNavigationDetail | null;
}

interface ConsistencyCheckResult {
  message?: string;
  issues?: Array<{ type?: string; severity?: string; description: string }>;
}

const formatNumber = (n: number): string => new Intl.NumberFormat().format(n);

export default function ImportResultView({ navigationState }: ImportResultViewProps) {
  const payload = navigationState?.payload as { importResult?: DraftImportResponse } | undefined;
  const importResult = payload?.importResult;

  const [checkState, setCheckState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [checkResult, setCheckResult] = useState<ConsistencyCheckResult | null>(null);

  if (!importResult) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-gray-500 dark:text-gray-400">No import data available.</p>
          <button
            onClick={() => navigateToView('import')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to Import
          </button>
        </div>
      </div>
    );
  }

  const seriesId = importResult.series?.id ?? '';
  const maxWords = Math.max(...importResult.chapters.map((c) => c.word_count), 1);

  const runCheck = async () => {
    if (!seriesId || checkState === 'running') return;
    setCheckState('running');
    setCheckResult(null);
    try {
      const result = await apiClient.get<ConsistencyCheckResult>(`/series/${seriesId}/consistency-check`);
      setCheckResult(result.data ?? null);
      setCheckState('done');
    } catch {
      setCheckState('error');
    }
  };

  const nextSteps = [
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      ),
      title: 'Characters',
      description:
        'Add the people in your story — track traits, relationships, and how they change across chapters.',
      action: 'Open Characters',
      view: 'characters',
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      title: 'Timeline',
      description:
        'Map out when events happen in your story to spot chronology issues before they compound.',
      action: 'Open Timeline',
      view: 'timeline',
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      title: 'World Building',
      description:
        "Document locations, rules, magic systems, and lore — the facts your story's consistency depends on.",
      action: 'Open World Building',
      view: 'worldbuilding',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">

        {/* ── Success header ── */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Complete</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">{importResult.book.title}</span>
              {importResult.series && (
                <> &mdash; {importResult.series.title}</>
              )}
            </p>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Book', value: importResult.book.title },
            { label: 'Series', value: importResult.series?.title ?? '—' },
            { label: 'Chapters', value: String(importResult.summary.chapter_count) },
            { label: 'Words', value: formatNumber(importResult.summary.word_count) },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-3"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p
                className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white truncate"
                title={value}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Chapter Breakdown ── */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chapter Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-8">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Chapter</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 w-16">Scenes</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 w-20">Words</th>
                  <th className="px-4 py-2.5 w-32 hidden sm:table-cell"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {importResult.chapters.map((chapter) => (
                  <tr key={chapter.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2 text-gray-400 dark:text-gray-500 tabular-nums">{chapter.chapter_number}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">{chapter.title}</td>
                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300 tabular-nums">{chapter.scene_count}</td>
                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-300 tabular-nums">{formatNumber(chapter.word_count)}</td>
                    <td className="px-4 py-2 hidden sm:table-cell">
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className="h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"
                          style={{ width: `${Math.max(2, Math.round((chapter.word_count / maxWords) * 100))}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Build your canon ── */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Build your canon</h2>
          <p className="mt-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
            Your draft is imported. Now set up the facts your story depends on so you can track continuity across chapters.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {nextSteps.map(({ icon, title, description, action, view }) => (
              <button
                key={title}
                onClick={() => navigateToView(view)}
                className="group flex flex-col items-start gap-3 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 text-left hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {icon}
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
                </div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                  {action} →
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Continuity Check ── */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Initial Continuity Check</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Scan your imported chapters for potential continuity issues — contradictions, timeline gaps, and missing references.
              </p>
            </div>
            <button
              onClick={runCheck}
              disabled={checkState === 'running' || !seriesId}
              className="flex-shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
            >
              {checkState === 'running' && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {checkState === 'running' ? 'Checking…' : 'Run Continuity Check'}
            </button>
          </div>

          {checkState === 'done' && checkResult && (
            <div className="mt-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-3">
              {checkResult.issues && checkResult.issues.length > 0 ? (
                <ul className="space-y-1.5">
                  {checkResult.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                      <span
                        className={`mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                          issue.severity === 'high'
                            ? 'bg-red-500'
                            : issue.severity === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      {issue.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>{checkResult.message ?? 'Check complete — no issues found.'}</p>
                  {checkResult.message?.toLowerCase().includes('coming soon') && (
                    <p className="text-gray-400 dark:text-gray-500">
                      Full continuity analysis is on the roadmap. For now, start building out your characters and timeline above — that's where the real continuity work happens.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {checkState === 'error' && (
            <div className="mt-4 rounded-lg border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-3">
              <p className="text-xs text-red-700 dark:text-red-300">
                Could not run the check — the backend may be unavailable.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer navigation ── */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-6">
          <button
            onClick={() => navigateToView('import')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← Import another book
          </button>
          <button
            onClick={() => navigateToView('dashboard')}
            className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            Go to Dashboard →
          </button>
        </div>

      </div>
    </div>
  );
}
