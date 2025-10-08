import React from 'react';
import type { Series, Book, BookStatus } from '../../types/series';

interface BooksTabProps {
  series: Series;
  onAddBook: () => void;
  onUpdateBook: (bookId: string, updates: Partial<Book>) => void;
}

export const BooksTab: React.FC<BooksTabProps> = ({ series, onAddBook, onUpdateBook }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Books in Series</h3>
      <button
        onClick={onAddBook}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Add Book
      </button>
    </div>

    <div className="space-y-4">
      {series.books.map((book) => (
        <div key={book.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Book {book.bookNumber}: {book.title}
              </h4>
              {book.subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{book.subtitle}</p>
              )}
            </div>
            <select
              value={book.status}
              onChange={(e) => onUpdateBook(book.id, { status: e.target.value as BookStatus })}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="planning">Planning</option>
              <option value="outlining">Outlining</option>
              <option value="writing">Writing</option>
              <option value="editing">Editing</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Word Count</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {book.currentWordCount.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Target</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {book.targetWordCount?.toLocaleString() || 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Stories</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {book.stories.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Plot Threads</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {book.plotThreads.length}
              </div>
            </div>
          </div>

          {book.targetWordCount && (
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((book.currentWordCount / book.targetWordCount) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}

      {series.books.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No books in this series yet. Add your first book to get started!
        </div>
      )}
    </div>
  </div>
);
