import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  TimelineEvent,
  TimelineView,
  TimelineScope,
  TimelineEventType,
  TimelineAnalysis,
  TimelineTemplate,
  EventConflict,
  ValidationIssue,
  TimelineTimestamp,
  EventDependency
} from '../types/unifiedTimeline';
import { EntityReference } from '../types/entityRegistry';

interface UnifiedTimelineState {
  // Data Storage
  events: Map<string, TimelineEvent>;
  views: Map<string, TimelineView>;
  templates: Map<string, TimelineTemplate>;

  // Current State
  activeViewId: string | null;
  selectedEventIds: Set<string>;
  editingEventId: string | null;

  // Event Management
  addEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  removeEvent: (id: string) => void;
  duplicateEvent: (id: string) => string;
  moveEvent: (id: string, newTimestamp: TimelineTimestamp) => void;

  // Bulk Operations
  addMultipleEvents: (events: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>[]) => string[];
  removeMultipleEvents: (ids: string[]) => void;
  mergeEvents: (sourceId: string, targetId: string) => void;

  // View Management
  createView: (view: Omit<TimelineView, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateView: (id: string, updates: Partial<TimelineView>) => void;
  removeView: (id: string) => void;
  setActiveView: (id: string | null) => void;
  duplicateView: (id: string, newName: string) => string;

  // Template Management
  createTemplate: (template: Omit<TimelineTemplate, 'id'>) => string;
  applyTemplate: (templateId: string, targetScope: TimelineScope, entityMappings?: Record<string, string>) => string[];
  removeTemplate: (id: string) => void;

  // Querying and Filtering
  getEvent: (id: string) => TimelineEvent | undefined;
  getEventsInView: (viewId: string) => TimelineEvent[];
  getEventsByScope: (scope: TimelineScope) => TimelineEvent[];
  getEventsByType: (type: TimelineEventType) => TimelineEvent[];
  getEventsByEntity: (entityId: string) => TimelineEvent[];
  getEventsByTimeRange: (start: TimelineTimestamp, end: TimelineTimestamp) => TimelineEvent[];

  // Relationship Management
  addDependency: (fromEventId: string, toEventId: string, dependencyType: EventDependency['dependencyType'], description?: string) => void;
  removeDependency: (fromEventId: string, toEventId: string) => void;
  getDependentEvents: (eventId: string) => TimelineEvent[];
  getDependencyChain: (eventId: string) => TimelineEvent[];

  // Validation and Analysis
  validateEvent: (eventId: string) => ValidationIssue[];
  validateAllEvents: () => ValidationIssue[];
  findConflicts: (eventId?: string) => EventConflict[];
  analyzeTimeline: (viewId?: string) => TimelineAnalysis;
  detectPlotHoles: () => ValidationIssue[];

  // Search and Discovery
  searchEvents: (query: string, options?: {
    scopes?: TimelineScope[];
    types?: TimelineEventType[];
    entities?: string[];
    includeArchived?: boolean;
  }) => TimelineEvent[];
  findSimilarEvents: (eventId: string, limit?: number) => TimelineEvent[];
  suggestRelatedEvents: (eventId: string) => TimelineEvent[];

  // Timeline Manipulation
  reorderEvents: (eventIds: string[], newOrder: number[]) => void;
  insertEventBetween: (eventData: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>, beforeEventId: string, afterEventId: string) => string;
  splitEvent: (eventId: string, splitPoint: TimelineTimestamp) => { firstPart: string; secondPart: string };
  combineEvents: (eventIds: string[]) => string;

  // Import/Export
  exportTimeline: (viewId?: string, format?: 'json' | 'csv' | 'pdf') => any;
  importEvents: (events: TimelineEvent[], replaceExisting?: boolean) => void;

  // Collaboration Features
  addComment: (eventId: string, comment: string, type?: 'comment' | 'suggestion') => void;
  resolveComment: (commentId: string) => void;
  createChangeRequest: (eventId: string, changes: Partial<TimelineEvent>, reason: string) => void;

  // Utility Functions
  generateEventId: () => string;
  getNextEventOrder: (scope: TimelineScope) => number;
  calculateEventDuration: (eventId: string) => number; // in minutes
  getTimelineBounds: (scope?: TimelineScope) => { start: TimelineTimestamp; end: TimelineTimestamp } | null;

  // Selection Management
  selectEvent: (id: string, addToSelection?: boolean) => void;
  selectMultipleEvents: (ids: string[]) => void;
  clearSelection: () => void;
  setEditingEvent: (id: string | null) => void;

  // Statistics and Insights
  getEventStatistics: () => {
    totalEvents: number;
    eventsByScope: Record<TimelineScope, number>;
    eventsByType: Record<TimelineEventType, number>;
    mostActiveEntity: EntityReference | null;
    averageEventsPerDay: number;
  };
}

const createEmptyMaps = () => ({
  events: new Map<string, TimelineEvent>(),
  views: new Map<string, TimelineView>(),
  templates: new Map<string, TimelineTemplate>()
});

export const useUnifiedTimelineStore = create<UnifiedTimelineState>()(
  persist(
    (set, get) => ({
      // Initial State
      ...createEmptyMaps(),
      activeViewId: null,
      selectedEventIds: new Set<string>(),
      editingEventId: null,

      // Event Management
      addEvent: (eventData) => {
        const id = get().generateEventId();
        const event: TimelineEvent = {
          ...eventData,
          id,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set((state) => {
          const newEvents = new Map(state.events);
          newEvents.set(id, event);
          return { events: newEvents };
        });

        return id;
      },

      updateEvent: (id, updates) => {
        set((state) => {
          const event = state.events.get(id);
          if (!event) return state;

          const updatedEvent = {
            ...event,
            ...updates,
            updatedAt: new Date()
          };

          const newEvents = new Map(state.events);
          newEvents.set(id, updatedEvent);
          return { events: newEvents };
        });
      },

      removeEvent: (id) => {
        set((state) => {
          const newEvents = new Map(state.events);
          newEvents.delete(id);

          // Remove from selections
          const newSelection = new Set(state.selectedEventIds);
          newSelection.delete(id);

          // Clear editing if this event was being edited
          const newEditingId = state.editingEventId === id ? null : state.editingEventId;

          // Remove dependencies involving this event
          for (const [eventId, event] of newEvents) {
            if (event.dependencies) {
              const newDependencies = event.dependencies.filter(dep => dep.eventId !== id);
              if (newDependencies.length !== event.dependencies.length) {
                newEvents.set(eventId, {
                  ...event,
                  dependencies: newDependencies,
                  updatedAt: new Date()
                });
              }
            }
          }

          return {
            events: newEvents,
            selectedEventIds: newSelection,
            editingEventId: newEditingId
          };
        });
      },

      duplicateEvent: (id) => {
        const event = get().events.get(id);
        if (!event) return '';

        const duplicatedEvent = {
          ...event,
          name: `${event.name} (Copy)`,
          id: undefined as any,
          createdAt: undefined as any,
          updatedAt: undefined as any
        };

        return get().addEvent(duplicatedEvent);
      },

      moveEvent: (id, newTimestamp) => {
        get().updateEvent(id, { timestamp: newTimestamp });
      },

      // Bulk Operations
      addMultipleEvents: (eventsData) => {
        const ids: string[] = [];
        eventsData.forEach(eventData => {
          ids.push(get().addEvent(eventData));
        });
        return ids;
      },

      removeMultipleEvents: (ids) => {
        ids.forEach(id => get().removeEvent(id));
      },

      mergeEvents: (sourceId, targetId) => {
        const sourceEvent = get().events.get(sourceId);
        const targetEvent = get().events.get(targetId);

        if (!sourceEvent || !targetEvent) return;

        // Merge data from source into target
        const mergedEvent = {
          ...targetEvent,
          description: `${targetEvent.description}\n\n--- Merged from "${sourceEvent.name}" ---\n${sourceEvent.description}`,
          involvedEntities: [
            ...targetEvent.involvedEntities,
            ...sourceEvent.involvedEntities.filter(entity =>
              !targetEvent.involvedEntities.some(existing => existing.id === entity.id)
            )
          ],
          tags: Array.from(new Set([...targetEvent.tags, ...sourceEvent.tags]))
        };

        get().updateEvent(targetId, mergedEvent);
        get().removeEvent(sourceId);
      },

      // View Management
      createView: (viewData) => {
        const id = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const view: TimelineView = {
          ...viewData,
          id,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set((state) => {
          const newViews = new Map(state.views);
          newViews.set(id, view);
          return { views: newViews };
        });

        return id;
      },

      updateView: (id, updates) => {
        set((state) => {
          const view = state.views.get(id);
          if (!view) return state;

          const updatedView = {
            ...view,
            ...updates,
            updatedAt: new Date()
          };

          const newViews = new Map(state.views);
          newViews.set(id, updatedView);
          return { views: newViews };
        });
      },

      removeView: (id) => {
        set((state) => {
          const newViews = new Map(state.views);
          newViews.delete(id);

          const newActiveViewId = state.activeViewId === id ? null : state.activeViewId;

          return {
            views: newViews,
            activeViewId: newActiveViewId
          };
        });
      },

      setActiveView: (id) => {
        set({ activeViewId: id });
      },

      duplicateView: (id, newName) => {
        const view = get().views.get(id);
        if (!view) return '';

        const duplicatedView = {
          ...view,
          name: newName,
          id: undefined as any,
          createdAt: undefined as any,
          updatedAt: undefined as any
        };

        return get().createView(duplicatedView);
      },

      // Template Management
      createTemplate: (templateData) => {
        const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const template: TimelineTemplate = {
          ...templateData,
          id
        };

        set((state) => {
          const newTemplates = new Map(state.templates);
          newTemplates.set(id, template);
          return { templates: newTemplates };
        });

        return id;
      },

      applyTemplate: (templateId, targetScope, entityMappings = {}) => {
        const template = get().templates.get(templateId);
        if (!template) return [];

        const createdEventIds: string[] = [];

        template.templateEvents.forEach((templateEvent, index) => {
          const eventData = {
            name: templateEvent.name,
            description: templateEvent.description,
            type: templateEvent.type,
            scope: targetScope,
            timestamp: {
              isApproximate: false,
              storyDay: Math.floor(templateEvent.relativePosition * 100) // Simple mapping
            },
            involvedEntities: template.requiredEntities.map(entity =>
              entityMappings[entity.id] ? { ...entity, id: entityMappings[entity.id] } : entity
            ),
            plotImpact: {
              importance: templateEvent.importance,
              plotThreads: [],
              consequences: []
            },
            tags: template.metadata.tags,
            status: 'draft' as const,
            isCanon: false
          };

          const eventId = get().addEvent(eventData);
          createdEventIds.push(eventId);
        });

        return createdEventIds;
      },

      removeTemplate: (id) => {
        set((state) => {
          const newTemplates = new Map(state.templates);
          newTemplates.delete(id);
          return { templates: newTemplates };
        });
      },

      // Querying
      getEvent: (id) => get().events.get(id),

      getEventsInView: (viewId) => {
        const view = get().views.get(viewId);
        if (!view) return [];

        let events = Array.from(get().events.values());

        // Apply view filters
        if (view.scope !== 'global') {
          events = events.filter(event => event.scope === view.scope);
        }

        if (view.entityFilter && view.entityFilter.length > 0) {
          events = events.filter(event =>
            event.involvedEntities.some(entity =>
              view.entityFilter!.some(filter => filter.id === entity.id)
            )
          );
        }

        if (view.typeFilter && view.typeFilter.length > 0) {
          events = events.filter(event => view.typeFilter!.includes(event.type));
        }

        if (view.tagFilter && view.tagFilter.length > 0) {
          events = events.filter(event =>
            view.tagFilter!.some(tag => event.tags.includes(tag))
          );
        }

        // Apply time range filter
        if (view.timeRange) {
          events = events.filter(event => {
            // Simple time range filtering - would need more sophisticated logic
            return true; // TODO: Implement proper time range filtering
          });
        }

        // Sort events
        events.sort((a, b) => {
          switch (view.sortBy) {
            case 'chronological':
              // Simple chronological sort by story day
              const aDays = a.timestamp.storyDay || 0;
              const bDays = b.timestamp.storyDay || 0;
              return aDays - bDays;
            case 'importance':
              const aImportance = a.plotImpact?.importance || 1;
              const bImportance = b.plotImpact?.importance || 1;
              return bImportance - aImportance;
            default:
              return a.name.localeCompare(b.name);
          }
        });

        return events;
      },

      getEventsByScope: (scope) => {
        return Array.from(get().events.values()).filter(event => event.scope === scope);
      },

      getEventsByType: (type) => {
        return Array.from(get().events.values()).filter(event => event.type === type);
      },

      getEventsByEntity: (entityId) => {
        return Array.from(get().events.values()).filter(event =>
          event.involvedEntities.some(entity => entity.id === entityId)
        );
      },

      getEventsByTimeRange: (start, end) => {
        // TODO: Implement proper time range filtering
        return Array.from(get().events.values());
      },

      // Dependency Management
      addDependency: (fromEventId, toEventId, dependencyType, description) => {
        const fromEvent = get().events.get(fromEventId);
        if (!fromEvent) return;

        const dependency: EventDependency = {
          eventId: toEventId,
          dependencyType,
          description
        };

        const newDependencies = [...(fromEvent.dependencies || []), dependency];

        get().updateEvent(fromEventId, {
          dependencies: newDependencies
        });
      },

      removeDependency: (fromEventId, toEventId) => {
        const fromEvent = get().events.get(fromEventId);
        if (!fromEvent || !fromEvent.dependencies) return;

        const newDependencies = fromEvent.dependencies.filter(dep => dep.eventId !== toEventId);

        get().updateEvent(fromEventId, {
          dependencies: newDependencies
        });
      },

      getDependentEvents: (eventId) => {
        const allEvents = Array.from(get().events.values());
        return allEvents.filter(event =>
          event.dependencies?.some(dep => dep.eventId === eventId)
        );
      },

      getDependencyChain: (eventId) => {
        // TODO: Implement dependency chain traversal
        return [];
      },

      // Validation
      validateEvent: (eventId) => {
        const event = get().events.get(eventId);
        if (!event) return [];

        const issues: ValidationIssue[] = [];

        // Basic validation
        if (!event.name.trim()) {
          issues.push({
            type: 'timeline_inconsistency',
            severity: 'error',
            message: 'Event name cannot be empty'
          });
        }

        if (!event.involvedEntities.length) {
          issues.push({
            type: 'timeline_inconsistency',
            severity: 'warning',
            message: 'Event has no involved entities'
          });
        }

        // Check dependencies
        if (event.dependencies) {
          event.dependencies.forEach(dep => {
            if (!get().events.has(dep.eventId)) {
              issues.push({
                type: 'timeline_inconsistency',
                severity: 'error',
                message: `Dependency references non-existent event: ${dep.eventId}`
              });
            }
          });
        }

        return issues;
      },

      validateAllEvents: () => {
        const allIssues: ValidationIssue[] = [];
        for (const eventId of get().events.keys()) {
          allIssues.push(...get().validateEvent(eventId));
        }
        return allIssues;
      },

      findConflicts: (eventId) => {
        // TODO: Implement conflict detection logic
        return [];
      },

      analyzeTimeline: (viewId) => {
        const events = viewId ? get().getEventsInView(viewId) : Array.from(get().events.values());

        const analysis: TimelineAnalysis = {
          totalEvents: events.length,
          timeSpan: {
            start: { isApproximate: false, storyDay: 0 },
            end: { isApproximate: false, storyDay: 100 },
            duration: { days: 100, approximate: true }
          },
          eventsByType: {} as Record<TimelineEventType, number>,
          eventsByScope: {} as Record<TimelineScope, number>,
          eventsByImportance: {},
          conflicts: [],
          gaps: [],
          inconsistencies: [],
          averageEventsPerChapter: 0,
          mostActiveCharacter: { id: '', type: 'character', name: '' },
          mostChangedLocation: '',
          plotThreadCoverage: {},
          generatedAt: new Date()
        };

        // Calculate statistics
        events.forEach(event => {
          analysis.eventsByType[event.type] = (analysis.eventsByType[event.type] || 0) + 1;
          analysis.eventsByScope[event.scope] = (analysis.eventsByScope[event.scope] || 0) + 1;

          const importance = event.plotImpact?.importance || 1;
          analysis.eventsByImportance[importance] = (analysis.eventsByImportance[importance] || 0) + 1;
        });

        return analysis;
      },

      detectPlotHoles: () => {
        // TODO: Implement plot hole detection
        return [];
      },

      // Search
      searchEvents: (query, options = {}) => {
        let events = Array.from(get().events.values());

        // Apply scope filter
        if (options.scopes && options.scopes.length > 0) {
          events = events.filter(event => options.scopes!.includes(event.scope));
        }

        // Apply type filter
        if (options.types && options.types.length > 0) {
          events = events.filter(event => options.types!.includes(event.type));
        }

        // Apply entity filter
        if (options.entities && options.entities.length > 0) {
          events = events.filter(event =>
            event.involvedEntities.some(entity =>
              options.entities!.includes(entity.id)
            )
          );
        }

        // Apply text search
        const queryLower = query.toLowerCase();
        events = events.filter(event =>
          event.name.toLowerCase().includes(queryLower) ||
          event.description.toLowerCase().includes(queryLower) ||
          event.tags.some(tag => tag.toLowerCase().includes(queryLower))
        );

        return events;
      },

      findSimilarEvents: (eventId, limit = 10) => {
        const event = get().events.get(eventId);
        if (!event) return [];

        const allEvents = Array.from(get().events.values())
          .filter(e => e.id !== eventId);

        // Simple similarity scoring
        const similarities = allEvents.map(other => {
          let score = 0;

          // Same type
          if (other.type === event.type) score += 3;

          // Same scope
          if (other.scope === event.scope) score += 2;

          // Shared entities
          const sharedEntities = event.involvedEntities.filter(entity =>
            other.involvedEntities.some(otherEntity => otherEntity.id === entity.id)
          );
          score += sharedEntities.length * 2;

          // Shared tags
          const sharedTags = event.tags.filter(tag => other.tags.includes(tag));
          score += sharedTags.length;

          // Similar importance
          const eventImportance = event.plotImpact?.importance || 1;
          const otherImportance = other.plotImpact?.importance || 1;
          if (Math.abs(eventImportance - otherImportance) <= 1) score += 1;

          return { event: other, score };
        });

        return similarities
          .filter(s => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(s => s.event);
      },

      suggestRelatedEvents: (eventId) => {
        // TODO: Implement AI-powered event suggestions
        return get().findSimilarEvents(eventId, 5);
      },

      // Selection Management
      selectEvent: (id, addToSelection = false) => {
        set((state) => {
          const newSelection = addToSelection
            ? new Set([...state.selectedEventIds, id])
            : new Set([id]);

          return { selectedEventIds: newSelection };
        });
      },

      selectMultipleEvents: (ids) => {
        set({ selectedEventIds: new Set(ids) });
      },

      clearSelection: () => {
        set({ selectedEventIds: new Set() });
      },

      setEditingEvent: (id) => {
        set({ editingEventId: id });
      },

      // Utility
      generateEventId: () => {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      },

      getNextEventOrder: (scope) => {
        const events = get().getEventsByScope(scope);
        return events.length;
      },

      calculateEventDuration: (eventId) => {
        const event = get().events.get(eventId);
        if (!event?.duration) return 0;

        return (event.duration.days || 0) * 24 * 60 +
               (event.duration.hours || 0) * 60 +
               (event.duration.minutes || 0);
      },

      getTimelineBounds: (scope) => {
        const events = scope ? get().getEventsByScope(scope) : Array.from(get().events.values());
        if (!events.length) return null;

        // Simple bounds calculation using story days
        const storyDays = events
          .map(e => e.timestamp.storyDay || 0)
          .filter(d => d > 0);

        if (!storyDays.length) return null;

        return {
          start: { isApproximate: false, storyDay: Math.min(...storyDays) },
          end: { isApproximate: false, storyDay: Math.max(...storyDays) }
        };
      },

      // Statistics
      getEventStatistics: () => {
        const events = Array.from(get().events.values());

        const stats = {
          totalEvents: events.length,
          eventsByScope: {} as Record<TimelineScope, number>,
          eventsByType: {} as Record<TimelineEventType, number>,
          mostActiveEntity: null as EntityReference | null,
          averageEventsPerDay: 0
        };

        // Count by scope and type
        events.forEach(event => {
          stats.eventsByScope[event.scope] = (stats.eventsByScope[event.scope] || 0) + 1;
          stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
        });

        // Find most active entity
        const entityCounts = new Map<string, { entity: EntityReference; count: number }>();
        events.forEach(event => {
          event.involvedEntities.forEach(entity => {
            const current = entityCounts.get(entity.id);
            if (current) {
              current.count++;
            } else {
              entityCounts.set(entity.id, { entity, count: 1 });
            }
          });
        });

        let maxCount = 0;
        for (const { entity, count } of entityCounts.values()) {
          if (count > maxCount) {
            maxCount = count;
            stats.mostActiveEntity = entity;
          }
        }

        // Calculate average events per day
        const bounds = get().getTimelineBounds();
        if (bounds) {
          const totalDays = (bounds.end.storyDay || 0) - (bounds.start.storyDay || 0) + 1;
          stats.averageEventsPerDay = totalDays > 0 ? events.length / totalDays : 0;
        }

        return stats;
      },

      // Placeholder implementations for remaining methods
      reorderEvents: (eventIds, newOrder) => {
        // TODO: Implement event reordering
      },

      insertEventBetween: (eventData, beforeEventId, afterEventId) => {
        // TODO: Implement smart insertion between events
        return get().addEvent(eventData);
      },

      splitEvent: (eventId, splitPoint) => {
        // TODO: Implement event splitting
        return { firstPart: '', secondPart: '' };
      },

      combineEvents: (eventIds) => {
        // TODO: Implement event combination
        return '';
      },

      exportTimeline: (viewId, format = 'json') => {
        const events = viewId ? get().getEventsInView(viewId) : Array.from(get().events.values());

        if (format === 'json') {
          return JSON.stringify(events, null, 2);
        }

        // TODO: Implement other export formats
        return events;
      },

      importEvents: (events, replaceExisting = false) => {
        if (replaceExisting) {
          set({ events: new Map() });
        }

        events.forEach(event => {
          get().addEvent(event);
        });
      },

      addComment: (eventId, comment, type = 'comment') => {
        // TODO: Implement comment system
      },

      resolveComment: (commentId) => {
        // TODO: Implement comment resolution
      },

      createChangeRequest: (eventId, changes, reason) => {
        // TODO: Implement change request system
      }
    }),
    {
      name: 'unified-timeline-store',
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          events: Array.from(state.events.entries()),
          views: Array.from(state.views.entries()),
          templates: Array.from(state.templates.entries()),
          selectedEventIds: Array.from(state.selectedEventIds)
        });
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          events: new Map(parsed.events || []),
          views: new Map(parsed.views || []),
          templates: new Map(parsed.templates || []),
          selectedEventIds: new Set(parsed.selectedEventIds || [])
        };
      }
    }
  )
);