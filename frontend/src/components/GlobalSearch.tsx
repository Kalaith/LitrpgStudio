import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  Hash,
  User,
  MapPin,
  Package,
  Zap,
  Clock,
  BookOpen,
  FileText,
  Star,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useEntityRegistryStore } from '../stores/entityRegistryStore';
import { useUnifiedTimelineStore } from '../stores/unifiedTimelineStore';
import type { BaseEntity, EntityType } from '../types/entityRegistry';
import type { TimelineEvent } from '../types/unifiedTimeline';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (result: SearchResultItem) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResultItem {
  id: string;
  type: 'entity' | 'event' | 'action';
  name: string;
  description: string;
  category: string;
  relevance: number;
  data: BaseEntity | TimelineEvent | QuickAction;
}

interface QuickAction {
  id: string;
  name: string;
  description: string;
  category: string;
  action: () => void;
  shortcut?: string;
}

const getEntityIcon = (type: EntityType) => {
  switch (type) {
    case 'character': return User;
    case 'location': return MapPin;
    case 'item': return Package;
    case 'skill': return Zap;
    case 'story': return BookOpen;
    case 'chapter': return FileText;
    case 'series': return TrendingUp;
    default: return Hash;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'character': return 'text-blue-600 bg-blue-100';
    case 'location': return 'text-green-600 bg-green-100';
    case 'item': return 'text-purple-600 bg-purple-100';
    case 'skill': return 'text-yellow-600 bg-yellow-100';
    case 'story': return 'text-indigo-600 bg-indigo-100';
    case 'event': return 'text-red-600 bg-red-100';
    case 'action': return 'text-gray-600 bg-gray-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onSelect,
  placeholder = "Search anything or type @ to link...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { searchEntities, searchHistory, getEntityStats } = useEntityRegistryStore();
  const { searchEvents } = useUnifiedTimelineStore();

  // Quick actions
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'new-character',
      name: 'Create New Character',
      description: 'Add a new character to your story',
      category: 'action',
      action: () => console.log('Create character'),
      shortcut: 'Ctrl+N, C'
    },
    {
      id: 'new-location',
      name: 'Create New Location',
      description: 'Add a new location to your world',
      category: 'action',
      action: () => console.log('Create location'),
      shortcut: 'Ctrl+N, L'
    },
    {
      id: 'new-timeline-event',
      name: 'Create Timeline Event',
      description: 'Add an event to your story timeline',
      category: 'action',
      action: () => console.log('Create event'),
      shortcut: 'Ctrl+T'
    },
    {
      id: 'export-story',
      name: 'Export Story',
      description: 'Export your story in various formats',
      category: 'action',
      action: () => console.log('Export story'),
      shortcut: 'Ctrl+E'
    }
  ], []);

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      // Show recent items and quick actions when no query
      const recentResults: SearchResultItem[] = searchHistory.slice(0, 5).map((historyQuery, index) => ({
        id: `history-${index}`,
        type: 'action' as const,
        name: historyQuery,
        description: 'Recent search',
        category: 'recent',
        relevance: 10 - index,
        data: {
          id: `recent-${index}`,
          name: historyQuery,
          description: 'Recent search',
          category: 'recent',
          action: () => setQuery(historyQuery)
        } as QuickAction
      }));

      const actionResults: SearchResultItem[] = quickActions.map(action => ({
        id: action.id,
        type: 'action',
        name: action.name,
        description: action.description,
        category: action.category,
        relevance: 5,
        data: action
      }));

      return [...recentResults, ...actionResults].slice(0, 8);
    }

    const results: SearchResultItem[] = [];

    // Check if it's linking mode (starts with @)
    const actualQuery = query.startsWith('@') ? query.slice(1) : query;
    const isLinking = query.startsWith('@');
    setIsLinkingMode(isLinking);

    // Search entities
    const entityResults = searchEntities({
      query: actualQuery,
      sortBy: 'relevance',
      limit: 20
    });

    results.push(...entityResults.map(result => ({
      id: result.entity.id,
      type: 'entity' as const,
      name: result.entity.name,
      description: result.entity.description || 'No description',
      category: result.entity.type,
      relevance: result.relevanceScore,
      data: result.entity
    })));

    // Search timeline events
    if (!isLinking) {
      const eventResults = searchEvents(actualQuery);
      results.push(...eventResults.slice(0, 10).map(event => ({
        id: event.id,
        type: 'event' as const,
        name: event.name,
        description: event.description,
        category: 'event',
        relevance: event.plotImpact?.importance || 1,
        data: event
      })));
    }

    // Search quick actions
    if (!isLinking) {
      const matchingActions = quickActions.filter(action =>
        action.name.toLowerCase().includes(actualQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(actualQuery.toLowerCase())
      );

      results.push(...matchingActions.map(action => ({
        id: action.id,
        type: 'action' as const,
        name: action.name,
        description: action.description,
        category: action.category,
        relevance: 3,
        data: action
      })));
    }

    // Sort by relevance and limit
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }, [query, searchEntities, searchEvents, quickActions, searchHistory]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % searchResults.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            handleSelect(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const handleSelect = (result: SearchResultItem) => {
    if (result.type === 'action') {
      const action = result.data as QuickAction;
      if (action.action) {
        action.action();
      }
    }

    onSelect?.(result);
    onClose();
    setQuery('');
  };

  const ResultItem = ({ result, index }: { result: SearchResultItem; index: number }) => {
    const isSelected = index === selectedIndex;
    const Icon = result.type === 'entity'
      ? getEntityIcon((result.data as BaseEntity).type)
      : result.type === 'event'
      ? Clock
      : result.category === 'recent'
      ? Clock
      : Star;

    return (
      <motion.div
        key={result.id}
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
        className={`flex items-center space-x-3 p-3 mx-2 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        onClick={() => handleSelect(result)}
      >
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${
          isSelected
            ? 'bg-blue-200 dark:bg-blue-800'
            : getCategoryColor(result.category)
        }`}>
          <Icon size={16} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm truncate">{result.name}</span>
            {result.type === 'entity' && isLinkingMode && (
              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                Link
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate mt-0.5">
            {result.description}
          </div>
        </div>

        {/* Category & Action */}
        <div className="flex-shrink-0 flex items-center space-x-2">
          <span className="text-xs text-gray-400 capitalize">
            {result.category}
          </span>
          {result.type === 'action' && (result.data as QuickAction).shortcut && (
            <span className="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {(result.data as QuickAction).shortcut}
            </span>
          )}
          {isSelected && (
            <ArrowRight size={14} className="text-blue-500" />
          )}
        </div>
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 w-full max-w-2xl mx-4 ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Search size={20} className="text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 text-lg bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
            />
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              {isLinkingMode && (
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  Linking Mode
                </span>
              )}
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                ↑↓
              </kbd>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                Enter
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto py-2">
            {searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((result, index) => (
                  <ResultItem key={result.id} result={result} index={index} />
                ))}
              </div>
            ) : query.trim() ? (
              <div className="py-8 text-center text-gray-500">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-2">Try searching for characters, locations, items, or events</p>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Command size={48} className="mx-auto mb-4 opacity-50" />
                <p>Search anything in your project</p>
                <p className="text-sm mt-2">Type @ to create links, or use quick actions</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>💡 Tip: Type @ to link entities</span>
                {getEntityStats && (
                  <span>
                    {Object.values(getEntityStats()).reduce((sum, count) => sum + count, 0)} items indexed
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span>Search powered by Unified Registry</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};