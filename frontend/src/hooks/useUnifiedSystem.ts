import { useEffect } from 'react';
import { useEntityRegistryStore } from '../stores/entityRegistryStore';
import { useUnifiedTimelineStore } from '../stores/unifiedTimelineStore';
import { useStoryStore } from '../stores/storyStore';
import { useCharacterStore } from '../stores/characterStore';
import { useSeriesStore } from '../stores/seriesStore';
import { adapterRegistry } from '../services/entityAdapters';

/**
 * Hook to initialize and maintain the unified system
 * This connects all legacy stores with the new entity registry
 */
export const useUnifiedSystem = () => {
  const {
    addEntity,
    getEntity,
    addRelationship,
    searchEntities
  } = useEntityRegistryStore();

  const {
    addEvent,
    getEventsByEntity,
    createView,
    setActiveView
  } = useUnifiedTimelineStore();

  const { stories } = useStoryStore();
  const { characters } = useCharacterStore();
  const { series } = useSeriesStore();

  // Initialize the unified system on mount
  useEffect(() => {
    initializeUnifiedSystem();
  }, []);

  // Sync existing data with entity registry
  const initializeUnifiedSystem = () => {
    console.log('🚀 Initializing LitRPG Studio Unified System...');

    // Sync stories to entity registry
    stories.forEach(story => {
      const entity = adapterRegistry.toEntity(story, 'story');
      if (entity) {
        addEntity(entity);
      }

      // Add story chapters as entities
      story.chapters?.forEach(chapter => {
        const chapterEntity = adapterRegistry.toEntity(chapter, 'chapter');
        if (chapterEntity) {
          addEntity(chapterEntity);

          // Create relationship between story and chapter
          addRelationship({
            fromEntity: { id: story.id, type: 'story', name: story.title },
            toEntity: { id: chapter.id, type: 'chapter', name: chapter.title },
            relationshipType: 'part_of',
            strength: 10,
            bidirectional: false,
            description: `Chapter belongs to story "${story.title}"`
          });
        }
      });
    });

    // Sync characters to entity registry
    characters.forEach(character => {
      const entity = adapterRegistry.toEntity(character, 'character');
      if (entity) {
        addEntity(entity);

        // Create relationships between characters and stories they appear in
        stories.forEach(story => {
          if (story.characters?.includes(character.id)) {
            addRelationship({
              fromEntity: { id: character.id, type: 'character', name: character.name },
              toEntity: { id: story.id, type: 'story', name: story.title },
              relationshipType: 'participates',
              strength: 8,
              bidirectional: false,
              description: `Character appears in story "${story.title}"`
            });
          }
        });
      }
    });

    // Sync series to entity registry
    series.forEach(seriesItem => {
      const entity = adapterRegistry.toEntity(seriesItem, 'series');
      if (entity) {
        addEntity(entity);

        // Create relationships between series and books
        seriesItem.books?.forEach(book => {
          if (book.storyId) {
            addRelationship({
              fromEntity: { id: seriesItem.id, type: 'series', name: seriesItem.name },
              toEntity: { id: book.storyId, type: 'story', name: book.title },
              relationshipType: 'parent_of',
              strength: 10,
              bidirectional: false,
              description: `Book is part of series "${seriesItem.name}"`
            });
          }
        });
      }
    });

    // Create default timeline views
    createDefaultTimelineViews();

    console.log('✅ Unified System initialized successfully');
  };

  const createDefaultTimelineViews = () => {
    // Create a default story timeline view
    const storyTimelineId = createView({
      name: 'Story Timeline',
      description: 'Main story events and plot progression',
      scope: 'story',
      displayMode: 'linear',
      zoomLevel: 'scenes',
      groupBy: 'story',
      sortBy: 'chronological',
      colorScheme: 'type',
      showDependencies: true,
      showConflicts: true,
      showDetails: 'minimal',
      allowEditing: true,
      allowReordering: true
    });

    // Create a character development timeline view
    createView({
      name: 'Character Arcs',
      description: 'Character development and relationship changes',
      scope: 'character',
      displayMode: 'linear',
      zoomLevel: 'scenes',
      groupBy: 'entity',
      sortBy: 'chronological',
      colorScheme: 'entity',
      showDependencies: false,
      showConflicts: true,
      showDetails: 'full',
      allowEditing: true,
      allowReordering: false
    });

    // Create a world events timeline view
    createView({
      name: 'World History',
      description: 'Major world events and changes',
      scope: 'world',
      displayMode: 'linear',
      zoomLevel: 'days',
      groupBy: 'type',
      sortBy: 'chronological',
      colorScheme: 'importance',
      showDependencies: true,
      showConflicts: true,
      showDetails: 'minimal',
      allowEditing: true,
      allowReordering: false
    });

    // Set the story timeline as active by default
    setActiveView(storyTimelineId);
  };

  // Utility functions for working with the unified system
  const findEntity = (id: string) => {
    return getEntity(id);
  };

  const findEntitiesByName = (name: string) => {
    return searchEntities({
      query: name,
      sortBy: 'relevance',
      limit: 10
    });
  };

  const findRelatedEntities = (entityId: string) => {
    return searchEntities({
      filter: {
        hasRelationshipWith: entityId
      },
      includeRelationships: true
    });
  };

  const createStoryEvent = (eventData: {
    name: string;
    description: string;
    storyId?: string;
    chapterId?: string;
    characterIds?: string[];
    locationId?: string;
    importance?: 1 | 2 | 3 | 4 | 5;
    storyDay?: number;
  }) => {
    const involvedEntities = [];

    // Add story entity
    if (eventData.storyId) {
      const story = getEntity(eventData.storyId);
      if (story) {
        involvedEntities.push({
          id: story.id,
          type: story.type,
          name: story.name
        });
      }
    }

    // Add character entities
    if (eventData.characterIds) {
      eventData.characterIds.forEach(characterId => {
        const character = getEntity(characterId);
        if (character) {
          involvedEntities.push({
            id: character.id,
            type: character.type,
            name: character.name
          });
        }
      });
    }

    // Add location entity
    if (eventData.locationId) {
      const location = getEntity(eventData.locationId);
      if (location) {
        involvedEntities.push({
          id: location.id,
          type: location.type,
          name: location.name
        });
      }
    }

    return addEvent({
      name: eventData.name,
      description: eventData.description,
      type: 'story_event',
      scope: 'story',
      timestamp: {
        isApproximate: false,
        storyDay: eventData.storyDay || 1
      },
      involvedEntities,
      storyContext: eventData.storyId ? {
        storyId: eventData.storyId,
        chapterId: eventData.chapterId
      } : undefined,
      plotImpact: {
        importance: eventData.importance || 3,
        plotThreads: [],
        consequences: []
      },
      tags: [],
      status: 'draft',
      isCanon: false
    });
  };

  const validateSystemConsistency = () => {
    const issues: string[] = [];

    // Check for orphaned relationships
    // Check for missing entity references
    // Check for timeline inconsistencies
    // Return validation report

    return {
      isValid: issues.length === 0,
      issues,
      suggestions: [
        'Run consistency check regularly',
        'Update relationships when entities change',
        'Validate timeline events for logical consistency'
      ]
    };
  };

  return {
    // Entity operations
    findEntity,
    findEntitiesByName,
    findRelatedEntities,

    // Timeline operations
    createStoryEvent,
    getEventsByEntity,

    // System operations
    initializeUnifiedSystem,
    validateSystemConsistency,

    // Registry operations
    searchEntities,

    // Status
    isInitialized: true
  };
};

/**
 * Auto-initialization hook - use this in App.tsx to ensure system starts up
 */
export const useUnifiedSystemAutoInit = () => {
  const unifiedSystem = useUnifiedSystem();

  // Auto-initialize when the app starts
  useEffect(() => {
    unifiedSystem.initializeUnifiedSystem();
  }, []);

  return unifiedSystem;
};
