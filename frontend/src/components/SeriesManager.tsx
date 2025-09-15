import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeriesStore } from '../stores/seriesStore';
import { useCharacterStore } from '../stores/characterStore';
import type { Series, Book, SeriesStatus, BookStatus } from '../types/series';

interface SeriesManagerProps {
  onSeriesSelect?: (series: Series) => void;
}

export const SeriesManager: React.FC<SeriesManagerProps> = ({ onSeriesSelect }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'characters' | 'worldbuilding' | 'consistency'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);

  const {
    series,
    currentSeries,
    setCurrentSeries,
    createSeries,
    updateSeries,
    addBookToSeries,
    checkConsistency,
    generateSeriesAnalytics
  } = useSeriesStore();

  const { characters } = useCharacterStore();

  const handleSeriesSelect = (selectedSeries: Series) => {
    setCurrentSeries(selectedSeries);
    onSeriesSelect?.(selectedSeries);
  };

  const consistencyIssues = currentSeries ? checkConsistency(currentSeries.id) : [];
  const analytics = currentSeries ? generateSeriesAnalytics(currentSeries.id) : null;

  const renderTabContent = () => {
    if (!currentSeries) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            No Series Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create a new series or select an existing one to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create New Series
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewTab series={currentSeries} analytics={analytics} />;
      case 'books':
        return (
          <BooksTab
            series={currentSeries}
            onAddBook={() => setShowBookModal(true)}
            onUpdateBook={(bookId, updates) => useSeriesStore.getState().updateBook(bookId, updates)}
          />
        );
      case 'characters':
        return <CharactersTab series={currentSeries} characters={characters} />;
      case 'worldbuilding':
        return <WorldBuildingTab series={currentSeries} />;
      case 'consistency':
        return <ConsistencyTab issues={consistencyIssues} />;
      default:
        return null;
    }
  };

  return (
    <div className="series-manager bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Series Manager
            </h2>
            {currentSeries && (
              <p className="text-gray-600 dark:text-gray-300">
                {currentSeries.name} • {currentSeries.books.length} books
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Series Selector */}
            <select
              value={currentSeries?.id || ''}
              onChange={(e) => {
                const selectedSeries = series.find(s => s.id === e.target.value);
                if (selectedSeries) handleSeriesSelect(selectedSeries);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select Series</option>
              {series.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              New Series
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        {currentSeries && (
          <div className="flex items-center gap-4 mb-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentSeries.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              currentSeries.status === 'published' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              currentSeries.status === 'writing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {currentSeries.status}
            </div>

            {consistencyIssues.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-sm font-medium">{consistencyIssues.length} issues</span>
              </div>
            )}

            {analytics && (
              <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                {Math.round(analytics.completionRate * 100)}% complete
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'books', label: 'Books', icon: '📚' },
            { id: 'characters', label: 'Characters', icon: '👥' },
            { id: 'worldbuilding', label: 'World Building', icon: '🌍' },
            { id: 'consistency', label: 'Consistency', icon: '✓' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateSeriesModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(seriesData) => {
            const newSeries = createSeries(seriesData);
            handleSeriesSelect(newSeries);
            setShowCreateModal(false);
          }}
        />
      )}

      {showBookModal && currentSeries && (
        <CreateBookModal
          seriesId={currentSeries.id}
          bookNumber={currentSeries.books.length + 1}
          onClose={() => setShowBookModal(false)}
          onCreate={(bookData) => {
            addBookToSeries(currentSeries.id, bookData);
            setShowBookModal(false);
          }}
        />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ series: Series; analytics: any }> = ({ series, analytics }) => (
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
                {book.updatedAt.toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Books Tab Component
const BooksTab: React.FC<{
  series: Series;
  onAddBook: () => void;
  onUpdateBook: (bookId: string, updates: Partial<Book>) => void;
}> = ({ series, onAddBook, onUpdateBook }) => (
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

// Characters Tab Component
const CharactersTab: React.FC<{
  series: Series;
  characters: any[];
}> = ({ series }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Series Characters</h3>

    <div className="grid gap-4">
      {series.sharedElements.characters.map((sharedChar) => (
        <div key={sharedChar.characterId} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {sharedChar.character.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Appears in {sharedChar.appearances.length} book(s)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {sharedChar.appearances.map((appearance, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  Book {appearance.bookNumber}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  appearance.role === 'main' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  appearance.role === 'supporting' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {appearance.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {series.sharedElements.characters.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No characters added to this series yet.
        </div>
      )}
    </div>
  </div>
);

// World Building Tab Component
const WorldBuildingTab: React.FC<{ series: Series }> = ({ series }) => (
  <div className="space-y-6">
    {/* Magic Systems */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Magic Systems</h3>
      <div className="grid gap-4">
        {series.sharedElements.magicSystems.map((system) => (
          <div key={system.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{system.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{system.description}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                {system.type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {system.rules.length} rules
              </span>
            </div>
          </div>
        ))}

        {series.sharedElements.magicSystems.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No magic systems defined yet.
          </div>
        )}
      </div>
    </div>

    {/* Locations */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Locations</h3>
      <div className="grid gap-4">
        {series.sharedElements.locations.map((location) => (
          <div key={location.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{location.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{location.description}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                {location.type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                Appears in {location.appearances.length} book(s)
              </span>
            </div>
          </div>
        ))}

        {series.sharedElements.locations.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No locations defined yet.
          </div>
        )}
      </div>
    </div>

    {/* World Rules */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">World Rules</h3>
      <div className="space-y-3">
        {series.sharedElements.worldBuilding.worldRules.map((rule) => (
          <div key={rule.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{rule.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rule.description}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                {rule.category}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                Established in book {rule.establishedInBook}
              </span>
            </div>
          </div>
        ))}

        {series.sharedElements.worldBuilding.worldRules.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No world rules defined yet.
          </div>
        )}
      </div>
    </div>
  </div>
);

// Consistency Tab Component
const ConsistencyTab: React.FC<{ issues: any[] }> = ({ issues }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consistency Issues</h3>

    {issues.length === 0 ? (
      <div className="text-center py-8 text-green-600 dark:text-green-400">
        ✓ No consistency issues detected across the series
      </div>
    ) : (
      <div className="space-y-3">
        {issues.map((issue: any) => (
          <div key={issue.id} className={`p-4 rounded-lg border-l-4 ${
            issue.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
            issue.severity === 'high' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' :
            issue.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
            'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">{issue.type}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                issue.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                issue.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {issue.severity}
              </span>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{issue.description}</p>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Affects books:</span>
              {issue.books.map((bookNum: number) => (
                <span key={bookNum} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                  {bookNum}
                </span>
              ))}
            </div>

            {issue.suggestion && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <strong>Suggestion:</strong> {issue.suggestion}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

// Create Series Modal Component
const CreateSeriesModal: React.FC<{
  onClose: () => void;
  onCreate: (seriesData: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    genre: 'fantasy',
    status: 'planning' as SeriesStatus,
    metadata: {
      author: '',
      genres: ['fantasy'],
      themes: [],
      targetAudience: 'adult',
      marketCategory: 'litrpg',
      seriesLength: 5,
      marketingTags: []
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      books: [],
      sharedElements: {
        characters: [],
        worldBuilding: {
          timeline: [],
          worldRules: [],
          cultures: [],
          languages: [],
          religions: [],
          economics: []
        },
        magicSystems: [],
        locations: [],
        factions: [],
        terminology: []
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Series</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Series Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Genre
            </label>
            <select
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="fantasy">Fantasy</option>
              <option value="sci-fi">Sci-Fi</option>
              <option value="urban-fantasy">Urban Fantasy</option>
              <option value="post-apocalyptic">Post-Apocalyptic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Planned Series Length
            </label>
            <input
              type="number"
              value={formData.metadata.seriesLength}
              onChange={(e) => setFormData({
                ...formData,
                metadata: { ...formData.metadata, seriesLength: parseInt(e.target.value) || 1 }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Series
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Book Modal Component
const CreateBookModal: React.FC<{
  seriesId: string;
  bookNumber: number;
  onClose: () => void;
  onCreate: (bookData: Omit<Book, 'id' | 'seriesId' | 'createdAt' | 'updatedAt'>) => void;
}> = ({ bookNumber, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    bookNumber,
    title: '',
    subtitle: '',
    status: 'planning' as BookStatus,
    targetWordCount: 80000,
    currentWordCount: 0,
    stories: [],
    characterArcs: [],
    plotThreads: [],
    timelineEvents: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Book</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Book Number
            </label>
            <input
              type="number"
              value={formData.bookNumber}
              onChange={(e) => setFormData({ ...formData, bookNumber: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subtitle (Optional)
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Word Count
            </label>
            <input
              type="number"
              value={formData.targetWordCount}
              onChange={(e) => setFormData({ ...formData, targetWordCount: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeriesManager;