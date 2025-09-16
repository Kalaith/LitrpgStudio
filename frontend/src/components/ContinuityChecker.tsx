import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Settings,
  Zap
} from 'lucide-react';
import { useEntityRegistryStore } from '../stores/entityRegistryStore';
import { useUnifiedTimelineStore } from '../stores/unifiedTimelineStore';
import type { BaseEntity } from '../types/entityRegistry';

interface ContinuityIssue {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  category: 'character' | 'location' | 'timeline' | 'consistency';
  title: string;
  description: string;
  entities: string[];
  suggestions?: string[];
  position?: {
    start: number;
    end: number;
  };
}

interface ContinuityCheckerProps {
  content: string;
  currentPosition: number;
  chapterId?: string;
  storyId?: string;
  isEnabled?: boolean;
  onIssueClick?: (issue: ContinuityIssue) => void;
  className?: string;
}

export const ContinuityChecker: React.FC<ContinuityCheckerProps> = ({
  content,
  chapterId,
  storyId,
  isEnabled = true,
  onIssueClick,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['error', 'warning', 'suggestion'])
  );
  const [showSettings, setShowSettings] = useState(false);

  const { searchEntities, getEntity, getRelationshipsForEntity } = useEntityRegistryStore();
  const { searchEvents } = useUnifiedTimelineStore();

  // Extract entity references from text
  const extractedEntities = useMemo(() => {
    if (!content) return [];

    const entityRefs: { name: string; position: number; entity?: BaseEntity }[] = [];

    // Look for entity references in format [EntityName] or [[EntityName]]
    const entityRegex = /\[{1,2}([^\]]+)\]{1,2}/g;
    let match;

    while ((match = entityRegex.exec(content)) !== null) {
      const entityName = match[1];
      const position = match.index;

      // Try to find the entity in the registry
      const searchResults = searchEntities({
        query: entityName,
        limit: 1
      });

      const entity = searchResults.length > 0 ? searchResults[0].entity : undefined;

      entityRefs.push({
        name: entityName,
        position,
        entity
      });
    }

    return entityRefs;
  }, [content, searchEntities]);

  // Analyze content for continuity issues
  const continuityIssues = useMemo(() => {
    if (!isEnabled || !content) return [];

    const issues: ContinuityIssue[] = [];

    // Check for character location consistency
    const characterLocations = new Map<string, string[]>();

    extractedEntities.forEach(ref => {
      if (ref.entity?.type === 'character') {
        const relationships = getRelationshipsForEntity(ref.entity.id);
        const locationRels = relationships.filter(r => r.relationshipType === 'located_in');

        if (locationRels.length > 0) {
          const currentLocations = characterLocations.get(ref.entity.id) || [];
          locationRels.forEach(rel => {
            const location = getEntity(rel.toEntity.id);
            if (location && !currentLocations.includes(location.name)) {
              currentLocations.push(location.name);
            }
          });
          characterLocations.set(ref.entity.id, currentLocations);
        }
      }
    });

    // Flag characters in multiple locations
    characterLocations.forEach((locations, characterId) => {
      if (locations.length > 1) {
        const character = getEntity(characterId);
        if (character) {
          issues.push({
            id: `location-conflict-${characterId}`,
            type: 'warning',
            category: 'consistency',
            title: 'Character Location Conflict',
            description: `${character.name} appears to be in multiple locations: ${locations.join(', ')}`,
            entities: [characterId],
            suggestions: [
              'Update character relationships to reflect current location',
              'Add timeline event for character movement',
              'Clarify character\'s actual location in this scene'
            ]
          });
        }
      }
    });

    // Check for timeline consistency
    if (storyId && chapterId) {
      const chapterEvents = searchEvents('', {
        entities: [storyId],
        scopes: ['story']
      }).filter(event => event.storyContext?.chapterId === chapterId);

      // Look for timeline contradictions
      const mentionedEvents = extractedEntities.filter(ref =>
        ref.name.toLowerCase().includes('event') ||
        ref.name.toLowerCase().includes('battle') ||
        ref.name.toLowerCase().includes('meeting')
      );

      if (mentionedEvents.length > 0 && chapterEvents.length > 0) {
        issues.push({
          id: 'timeline-check',
          type: 'suggestion',
          category: 'timeline',
          title: 'Timeline Cross-Reference',
          description: 'Consider linking mentioned events to your timeline for consistency tracking',
          entities: [],
          suggestions: [
            'Create timeline events for mentioned occurrences',
            'Link character actions to existing timeline events',
            'Verify event chronology matches story progression'
          ]
        });
      }
    }

    // Check for unknown entity references
    const unknownEntities = extractedEntities.filter(ref => !ref.entity);
    if (unknownEntities.length > 0) {
      issues.push({
        id: 'unknown-entities',
        type: 'suggestion',
        category: 'character',
        title: 'Unlinked References',
        description: `Found ${unknownEntities.length} references that aren't in your entity registry`,
        entities: [],
        suggestions: [
          'Create entities for these references',
          'Link to existing entities with different names',
          'Remove brackets if these aren\'t entity references'
        ]
      });
    }

    // Check for repetitive phrasing
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const phraseCounts = new Map<string, number>();

    sentences.forEach(sentence => {
      const words = sentence.trim().toLowerCase().split(/\s+/);
      if (words.length >= 3) {
        for (let i = 0; i <= words.length - 3; i++) {
          const phrase = words.slice(i, i + 3).join(' ');
          phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
        }
      }
    });

    const repeatedPhrases = Array.from(phraseCounts.entries())
      .filter(([phrase, count]) => count >= 3 && phrase.length > 10)
      .slice(0, 3); // Limit to top 3

    if (repeatedPhrases.length > 0) {
      issues.push({
        id: 'repetitive-phrasing',
        type: 'suggestion',
        category: 'consistency',
        title: 'Repetitive Phrasing Detected',
        description: `Found repeated phrases: ${repeatedPhrases.map(([phrase]) => `"${phrase}"`).join(', ')}`,
        entities: [],
        suggestions: [
          'Vary sentence structure and word choice',
          'Use synonyms to avoid repetition',
          'Consider restructuring repeated concepts'
        ]
      });
    }

    return issues.filter(issue => selectedCategories.has(issue.type));
  }, [
    isEnabled,
    content,
    extractedEntities,
    storyId,
    chapterId,
    getRelationshipsForEntity,
    getEntity,
    searchEvents,
    selectedCategories
  ]);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const getIssueIcon = (type: ContinuityIssue['type']) => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return Info;
      case 'suggestion': return CheckCircle;
      default: return Info;
    }
  };

  const getIssueColor = (type: ContinuityIssue['type']) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'suggestion': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  if (!isVisible || !isEnabled) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors z-40"
      >
        <Zap size={20} />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`fixed right-4 top-1/2 transform -translate-y-1/2 w-80 max-h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-40 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Zap size={16} className="text-primary-600 dark:text-primary-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Continuity Check
          </h3>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
            {continuityIssues.length}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Show Issues:
            </div>
            <div className="space-y-2">
              {[
                { key: 'error', label: 'Errors', color: 'text-red-600' },
                { key: 'warning', label: 'Warnings', color: 'text-yellow-600' },
                { key: 'suggestion', label: 'Suggestions', color: 'text-blue-600' }
              ].map(category => (
                <label key={category.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(category.key)}
                    onChange={() => toggleCategory(category.key)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className={`text-sm ${category.color}`}>
                    {category.label}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Issues List */}
      <div className="max-h-64 overflow-y-auto p-2">
        {continuityIssues.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No continuity issues detected</p>
            <p className="text-xs mt-1">Your writing looks consistent!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {continuityIssues.map((issue) => {
              const Icon = getIssueIcon(issue.type);
              return (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${getIssueColor(issue.type)}`}
                  onClick={() => onIssueClick?.(issue)}
                >
                  <div className="flex items-start space-x-2">
                    <Icon size={14} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-1">
                        {issue.title}
                      </div>
                      <div className="text-xs opacity-90 mb-2">
                        {issue.description}
                      </div>
                      {issue.suggestions && issue.suggestions.length > 0 && (
                        <div className="text-xs space-y-1">
                          <div className="font-medium">Suggestions:</div>
                          <ul className="list-disc list-inside space-y-0.5 opacity-75">
                            {issue.suggestions.slice(0, 2).map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};