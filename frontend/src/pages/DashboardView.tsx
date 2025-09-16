import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Grid, Settings, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { DashboardWidget } from '../components/DashboardWidget';
import type { WidgetConfig, WidgetType } from '../components/DashboardWidget';
import { useStoryStore } from '../stores/storyStore';
import { useEntityRegistryStore } from '../stores/entityRegistryStore';
import { useUnifiedTimelineStore } from '../stores/unifiedTimelineStore';
import { useApiStatus } from '../hooks/useApiStatus';
import { useSeriesWithApi, useCharactersWithApi } from '../hooks/useApiIntegration';

const defaultWidgets: WidgetConfig[] = [
  {
    id: 'word-count-1',
    type: 'word_count',
    title: 'Word Count',
    size: 'medium',
    position: { x: 0, y: 0 }
  },
  {
    id: 'writing-streak-1',
    type: 'writing_streak',
    title: 'Writing Streak',
    size: 'small',
    position: { x: 2, y: 0 }
  },
  {
    id: 'character-overview-1',
    type: 'character_overview',
    title: 'Characters',
    size: 'medium',
    position: { x: 0, y: 1 }
  },
  {
    id: 'writing-goals-1',
    type: 'writing_goals',
    title: 'Daily Goal',
    size: 'small',
    position: { x: 2, y: 1 }
  },
  {
    id: 'story-progress-1',
    type: 'story_progress',
    title: 'Story Progress',
    size: 'large',
    position: { x: 3, y: 0 }
  },
  {
    id: 'recent-activity-1',
    type: 'recent_activity',
    title: 'Recent Activity',
    size: 'medium',
    position: { x: 0, y: 2 }
  }
];

const availableWidgetTypes: { type: WidgetType; title: string; description: string }[] = [
  { type: 'word_count', title: 'Word Count', description: 'Track your daily and total word count' },
  { type: 'writing_streak', title: 'Writing Streak', description: 'Monitor your writing consistency' },
  { type: 'character_overview', title: 'Character Overview', description: 'Quick view of your characters' },
  { type: 'timeline_events', title: 'Timeline Events', description: 'Upcoming story events' },
  { type: 'writing_goals', title: 'Writing Goals', description: 'Track your daily writing goals' },
  { type: 'recent_activity', title: 'Recent Activity', description: 'Latest changes and edits' },
  { type: 'story_progress', title: 'Story Progress', description: 'Overall story completion' },
  { type: 'quick_stats', title: 'Quick Stats', description: 'Key project statistics' }
];

const DashboardView: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [gridSize, setGridSize] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');

  const { currentStory } = useStoryStore();
  const { getEntityStats } = useEntityRegistryStore();
  const { getEventStats } = useUnifiedTimelineStore();

  // API integration hooks
  const { isOnline, baseUrl, checkApiStatus } = useApiStatus();
  const seriesApi = useSeriesWithApi();
  const charactersApi = useCharactersWithApi();

  // Grid layout calculations with responsive design
  const gridClasses = useMemo(() => {
    switch (gridSize) {
      case 'compact': return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2';
      case 'comfortable': return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
      case 'spacious': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
      default: return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
    }
  }, [gridSize]);

  // Handle widget updates
  const handleWidgetUpdate = useCallback((updatedWidget: WidgetConfig) => {
    setWidgets(prev => prev.map(w => w.id === updatedWidget.id ? updatedWidget : w));
  }, []);

  // Handle widget removal
  const handleWidgetRemove = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  }, []);

  // Add new widget
  const handleAddWidget = useCallback((type: WidgetType) => {
    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type,
      title: availableWidgetTypes.find(w => w.type === type)?.title || type,
      size: 'medium',
      position: { x: 0, y: 0 } // Will be auto-positioned
    };
    setWidgets(prev => [...prev, newWidget]);
    setShowAddWidget(false);
  }, []);

  // Reset to default layout
  const resetToDefault = useCallback(() => {
    setWidgets(defaultWidgets);
    setGridSize('comfortable');
  }, []);

  // Generate drag handle props for each widget
  const getDragHandleProps = useCallback((widgetId: string) => ({
    onMouseDown: () => setIsDragging(widgetId),
    onMouseUp: () => setIsDragging(null),
    onMouseLeave: () => setIsDragging(null)
  }), []);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 gap-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2">
            <Grid size={24} className="text-primary-600 dark:text-primary-400" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Author Dashboard</h1>
          </div>

          {/* API Status Indicator */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi size={16} className="text-green-500" />
            ) : (
              <WifiOff size={16} className="text-yellow-500" />
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isOnline ? 'Backend Connected' : 'Offline Mode'}
            </span>
          </div>

          {currentStory && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Project: <span className="font-medium text-gray-700 dark:text-gray-300">{currentStory.title}</span>
            </div>
          )}
        </div>

        {/* Dashboard Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grid Size Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['compact', 'comfortable', 'spacious'].map((size) => (
              <button
                key={size}
                onClick={() => setGridSize(size as typeof gridSize)}
                className={`px-2 md:px-3 py-1 text-xs rounded transition-colors ${
                  gridSize === size
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="hidden sm:inline">{size.charAt(0).toUpperCase() + size.slice(1)}</span>
                <span className="sm:hidden">{size.charAt(0).toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Reset Button */}
          <button
            onClick={resetToDefault}
            className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Add Widget Button */}
          <div className="relative">
            <button
              onClick={() => setShowAddWidget(!showAddWidget)}
              className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Widget</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* Add Widget Dropdown */}
            <AnimatePresence>
              {showAddWidget && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-2 w-64 md:w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50"
                >
                  <div className="p-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2 py-1">
                      Available Widgets
                    </div>
                    {availableWidgetTypes.map((widgetType) => (
                      <button
                        key={widgetType.type}
                        onClick={() => handleAddWidget(widgetType.type)}
                        className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {widgetType.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {widgetType.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <motion.div
            layout
            className={`grid ${gridClasses} auto-rows-min`}
          >
            <AnimatePresence>
              {widgets.map((widget) => (
                <DashboardWidget
                  key={widget.id}
                  config={widget}
                  onUpdate={handleWidgetUpdate}
                  onRemove={handleWidgetRemove}
                  isDragging={isDragging === widget.id}
                  dragHandleProps={getDragHandleProps(widget.id)}
                  className="transition-all duration-200"
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Empty State */}
        {widgets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-96 text-center"
          >
            <Grid size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Widgets Added
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
              Add widgets to customize your author dashboard. Track your progress, monitor your writing goals, and keep tabs on your story elements.
            </p>
            <button
              onClick={() => setShowAddWidget(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add Your First Widget</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
