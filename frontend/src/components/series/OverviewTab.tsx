import React from 'react';
import type { Series, SeriesAnalytics } from '../../types/series';

interface OverviewTabProps {
  series: Series;
  analytics: SeriesAnalytics | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ series, analytics }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {series.books.length}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Books</div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {analytics?.totalWordCount.toLocaleString() || '0'}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Words</div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {series.sharedElements.characters.length}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Characters</div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {Math.round((analytics?.consistencyScore || 0))}%
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Consistency</div>
      </div>
    </div>

    {/* Series Description */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {series.description || 'No description provided.'}
        </p>
      </div>
    </div>

    {/* Recent Activity */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
      <div className="space-y-3">
        {series.books.slice(-3).reverse().map((book) => (
          <div key={book.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Book {book.bookNumber}: {book.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {book.currentWordCount.toLocaleString()} words • {book.status}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {new Date(book.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
