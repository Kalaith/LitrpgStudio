import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MapPin,
  Package,
  Zap,
  Clock,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Search,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useEntityRegistryStore } from '../stores/entityRegistryStore';
import { useUnifiedTimelineStore } from '../stores/unifiedTimelineStore';
import { useStoryStore } from '../stores/storyStore';
import type { BaseEntity } from '../types/entityRegistry';
import type { TimelineEvent } from '../types/unifiedTimeline';

interface ContextSidebarProps {
  currentStoryId?: string;
  currentChapterId?: string;
  currentPosition?: number; // Word position in text
  className?: string;
  onEntityClick?: (entity: BaseEntity) => void;
  onEventClick?: (event: TimelineEvent) => void;
}

interface ContextSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: (BaseEntity | TimelineEvent)[];
  expanded: boolean;
}

interface ConsistencyIssue {
  type: 'warning' | 'info';
  message: string;
  entityId: string;
}

export const ContextSidebar: React.FC<ContextSidebarProps> = ({
  currentStoryId,
  currentChapterId,
  currentPosition = 0,
  className = '',
  onEntityClick,
  onEventClick
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['characters', 'locations', 'timeline'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showConsistencyAlerts, setShowConsistencyAlerts] = useState(true);

  const { searchEntities, getRelationshipsForEntity } = useEntityRegistryStore();
  const { searchEvents } = useUnifiedTimelineStore();
  const { stories, currentStory } = useStoryStore();

  // Get current story context
  const activeStory = currentStoryId ? stories.find(s => s.id === currentStoryId) : currentStory;
  const activeChapter = activeStory?.chapters?.find(c => c.id === currentChapterId);

  // Context-aware entity filtering
  const contextualEntities = useMemo(() => {
    if (!activeStory) return [];

    // Get entities related to current story
    const storyEntities = searchEntities({
      filter: {
        hasRelationshipWith: activeStory.id
      },
      includeRelationships: true,
      limit: 50
    });

    // If we have chapter context, prioritize chapter-related entities
    if (activeChapter) {
      const chapterEntities = searchEntities({
        filter: {
          hasRelationshipWith: activeChapter.id
        },
        includeRelationships: true
      });

      // Merge and prioritize chapter entities
      const entityMap = new Map();
      storyEntities.forEach(result => {
        entityMap.set(result.entity.id, { ...result, relevance: result.relevanceScore });
      });

      chapterEntities.forEach(result => {
        const existing = entityMap.get(result.entity.id);
        entityMap.set(result.entity.id, {
          ...result,
          relevance: (existing?.relevance || 0) + result.relevanceScore + 5 // Chapter bonus
        });
      });

      return Array.from(entityMap.values())
        .sort((a, b) => b.relevance - a.relevance)
        .map(r => r.entity);
    }

    return storyEntities.map(r => r.entity);
  }, [activeStory, activeChapter, searchEntities]);

  // Context-aware timeline events
  const contextualEvents = useMemo(() => {
    if (!activeStory) return [];

    let events = searchEvents('', {
      entities: [activeStory.id],
      scopes: ['story', 'character']
    });

    // If we have chapter context, filter to relevant timeline
    if (activeChapter) {
      events = events.filter(event =>
        !event.storyContext?.chapterId ||
        event.storyContext.chapterId === activeChapter.id ||
        // Include events that happen before/during this chapter
        (event.timestamp.storyChapter && activeChapter.order &&
         event.timestamp.storyChapter <= activeChapter.order)
      );
    }

    return events.slice(0, 10); // Limit to most relevant
  }, [activeStory, activeChapter, searchEvents]);

  // Organize context into sections
  const contextSections: ContextSection[] = useMemo(() => {
    const sections: ContextSection[] = [
      {
        id: 'characters',
        title: 'Characters',
        icon: Users,
        items: contextualEntities.filter(e => e.type === 'character'),
        expanded: expandedSections.has('characters')
      },
      {
        id: 'locations',
        title: 'Locations',
        icon: MapPin,
        items: contextualEntities.filter(e => e.type === 'location'),
        expanded: expandedSections.has('locations')
      },
      {
        id: 'items',
        title: 'Items & Equipment',
        icon: Package,
        items: contextualEntities.filter(e => e.type === 'item'),
        expanded: expandedSections.has('items')
      },
      {
        id: 'skills',
        title: 'Skills & Abilities',
        icon: Zap,
        items: contextualEntities.filter(e => e.type === 'skill'),
        expanded: expandedSections.has('skills')
      },
      {
        id: 'timeline',
        title: 'Recent Events',
        icon: Clock,
        items: contextualEvents,
        expanded: expandedSections.has('timeline')
      }
    ];

    // Filter out empty sections and apply search
    return sections.filter(section => {
      if (section.items.length === 0) return false;

      if (searchQuery) {
        section.items = section.items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return section.items.length > 0;
      }

      return true;
    });
  }, [contextualEntities, contextualEvents, expandedSections, searchQuery]);

  // Consistency checking
  const consistencyIssues = useMemo(() => {
    if (!showConsistencyAlerts || !activeStory) return [];

    const issues: ConsistencyIssue[] = [];

    // Check for character location consistency
    const characters = contextualEntities.filter(e => e.type === 'character');
    characters.forEach(character => {
      const relationships = getRelationshipsForEntity(character.id);
      const locationRels = relationships.filter(r => r.relationshipType === 'located_in');

      if (locationRels.length > 1) {
        issues.push({
          type: 'warning' as const,
          message: `${character.name} appears to be in multiple locations`,
          entityId: character.id
        });
      }
    });

    // Check for timeline consistency
    if (contextualEvents.length > 1) {
      for (let i = 1; i < contextualEvents.length; i++) {
        const prev = contextualEvents[i - 1];
        const current = contextualEvents[i];

        if (prev.timestamp.storyDay && current.timestamp.storyDay &&
            prev.timestamp.storyDay < current.timestamp.storyDay) {
          // Check if any characters are in impossible situations
          const prevEntities = prev.involvedEntities.map(e => e.id);
          const currentEntities = current.involvedEntities.map(e => e.id);
          const sharedEntities = prevEntities.filter(id => currentEntities.includes(id));

          if (sharedEntities.length > 0 &&
              current.timestamp.storyDay - prev.timestamp.storyDay < 1) {
            issues.push({
              type: 'info' as const,
              message: `Quick succession of events involving shared characters`,
              entityId: sharedEntities[0]
            });
          }
        }
      }
    }

    return issues.slice(0, 5); // Limit alerts
  }, [contextualEntities, contextualEvents, activeStory, showConsistencyAlerts, getRelationshipsForEntity]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleEntityClick = useCallback((item: BaseEntity | TimelineEvent) => {
    if ('type' in item && item.type) {
      // It's an entity
      onEntityClick?.(item as BaseEntity);
    } else {
      // It's a timeline event
      onEventClick?.(item as TimelineEvent);
    }
  }, [onEntityClick, onEventClick]);

  const EntityItem = ({ entity }: { entity: BaseEntity }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group"
      onClick={() => handleEntityClick(entity)}
    >
      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {entity.name}
        </div>
        {entity.description && (
          <div className="text-xs text-gray-500 truncate">
            {entity.description}
          </div>
        )}
      </div>
      <ExternalLink size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );

  const EventItem = ({ event }: { event: TimelineEvent }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group"
      onClick={() => handleEntityClick(event)}
    >
      <div className={`w-2 h-2 rounded-full ${
        event.plotImpact?.importance === 5 ? 'bg-red-500' :
        event.plotImpact?.importance === 4 ? 'bg-orange-500' :
        event.plotImpact?.importance === 3 ? 'bg-yellow-500' :
        'bg-green-500'
      }`}></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {event.name}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {event.timestamp.storyDay ? `Day ${event.timestamp.storyDay}` : 'Timeline event'}
        </div>
      </div>
      <Clock size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );

  if (!activeStory) {
    return (
      <div className={`w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select a story to see relevant context</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Writing Context</h3>
          <button
            onClick={() => setShowConsistencyAlerts(!showConsistencyAlerts)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showConsistencyAlerts ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        {/* Current Context Display */}
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          <div className="font-medium">{activeStory.title}</div>
          {activeChapter && (
            <div>Chapter: {activeChapter.title}</div>
          )}
          {currentPosition > 0 && (
            <div>Position: ~{Math.floor(currentPosition / 250)} paragraphs</div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search context..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Consistency Alerts */}
      {showConsistencyAlerts && consistencyIssues.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <AlertTriangle size={14} className="mr-1 text-yellow-500" />
            Consistency Alerts
          </h4>
          <div className="space-y-2">
            {consistencyIssues.map((issue, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${
                  issue.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300'
                }`}
              >
                <div className="flex items-start">
                  {issue.type === 'warning' ?
                    <AlertTriangle size={12} className="mt-0.5 mr-1 flex-shrink-0" /> :
                    <Info size={12} className="mt-0.5 mr-1 flex-shrink-0" />
                  }
                  <span>{issue.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context Sections */}
      <div className="flex-1 overflow-y-auto">
        {contextSections.map((section) => (
          <div key={section.id} className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <section.icon size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {section.title}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {section.items.length}
                  </span>
                </div>
                {section.expanded ?
                  <ChevronDown size={16} className="text-gray-400" /> :
                  <ChevronRight size={16} className="text-gray-400" />
                }
              </div>
            </button>

            <AnimatePresence>
              {section.expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-1">
                    {section.items.length === 0 ? (
                      <div className="text-xs text-gray-500 italic py-2">
                        {searchQuery ? 'No matching items' : 'No items in this category'}
                      </div>
                    ) : (
                      section.items.map((item) => (
                        <div key={item.id}>
                          {'type' in item ? (
                            <EntityItem entity={item as BaseEntity} />
                          ) : (
                            <EventItem event={item as TimelineEvent} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <button className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          <Plus size={16} />
          <span>Add to Context</span>
        </button>
      </div>
    </div>
  );
};