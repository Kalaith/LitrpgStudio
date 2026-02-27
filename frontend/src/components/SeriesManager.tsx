import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeriesStore } from '../stores/seriesStore';
import type { Series, Book, SeriesStatus, BookStatus } from '../types/series';
import {
  OverviewTab,
  BooksTab,
  CharactersTab,
  WorldBuildingTab,
  ConsistencyTab
} from './series';

interface SeriesManagerProps {
  onSeriesSelect?: (series: Series) => void;
}

type SeriesTab = 'overview' | 'books' | 'characters' | 'worldbuilding' | 'consistency';

const seriesTabs: Array<{ id: SeriesTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'books', label: 'Books', icon: '📚' },
  { id: 'characters', label: 'Characters', icon: '👥' },
  { id: 'worldbuilding', label: 'World Building', icon: '🌍' },
  { id: 'consistency', label: 'Consistency', icon: '✓' }
];

export const SeriesManager: React.FC<SeriesManagerProps> = ({ onSeriesSelect }) => {
  const [activeTab, setActiveTab] = useState<SeriesTab>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);

  const {
    series,
    currentSeries,
    setCurrentSeries,
    createSeries,
    addBookToSeries,
    checkConsistency,
    generateSeriesAnalytics
  } = useSeriesStore();

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
        return <CharactersTab series={currentSeries} />;
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
          {seriesTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
          onCreate={async (seriesData) => {
            const newSeries = await createSeries(seriesData);
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

// Create Series Modal Component
const CreateSeriesModal: React.FC<{
  onClose: () => void;
  onCreate: (seriesData: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({
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
