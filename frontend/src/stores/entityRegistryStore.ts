import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BaseEntity,
  EntityType,
  EntityRelationship,
  EntityRegistry,
  EntityReference,
  EntitySearchResult,
  EntitySearchOptions,
  EntityFilter,
  RelationshipType,
  EntityChangeEvent,
  CrossReference
} from '../types/entityRegistry';

interface EntityRegistryState {
  registry: EntityRegistry;
  searchHistory: string[];
  recentEntities: string[];
  changeLog: EntityChangeEvent[];

  // Entity Management
  addEntity: (entity: BaseEntity) => void;
  updateEntity: (id: string, updates: Partial<BaseEntity>) => void;
  removeEntity: (id: string) => void;
  getEntity: (id: string) => BaseEntity | undefined;
  getEntitiesByType: (type: EntityType) => BaseEntity[];
  getEntitiesByTag: (tag: string) => BaseEntity[];

  // Relationship Management
  addRelationship: (relationship: Omit<EntityRelationship, 'id' | 'createdAt'>) => void;
  updateRelationship: (id: string, updates: Partial<EntityRelationship>) => void;
  removeRelationship: (id: string) => void;
  getRelationshipsForEntity: (entityId: string) => EntityRelationship[];
  getRelationshipsBetween: (entityId1: string, entityId2: string) => EntityRelationship[];

  // Search and Discovery
  searchEntities: (options: EntitySearchOptions) => EntitySearchResult[];
  findSimilarEntities: (entityId: string, limit?: number) => BaseEntity[];
  getCrossReferences: (entityId: string) => CrossReference;

  // Validation and Consistency
  validateEntity: (entityId: string) => boolean;
  validateAllEntities: () => { valid: BaseEntity[]; invalid: BaseEntity[] };
  findOrphanedEntities: () => BaseEntity[];
  findDuplicateEntities: () => BaseEntity[][];

  // Bulk Operations
  importEntities: (entities: BaseEntity[]) => void;
  exportEntities: (filter?: EntityFilter) => BaseEntity[];
  mergeEntities: (sourceId: string, targetId: string) => void;

  // Utility
  generateEntityId: (type: EntityType) => string;
  addToRecentEntities: (entityId: string) => void;
  clearSearchHistory: () => void;
  getEntityStats: () => Record<EntityType, number>;

  // Additional methods needed by other components
  getAllEntities: () => BaseEntity[];
  getAllRelationships: () => EntityRelationship[];
}

const createEmptyRegistry = (): EntityRegistry => ({
  entities: new Map(),
  relationships: new Map(),
  typeIndex: new Map(),
  tagIndex: new Map(),
  nameIndex: new Map()
});

export const useEntityRegistryStore = create<EntityRegistryState>()(
  persist(
    (set, get) => ({
      registry: createEmptyRegistry(),
      searchHistory: [],
      recentEntities: [],
      changeLog: [],

      // Entity Management
      addEntity: (entity: BaseEntity) => {
        set((state) => {
          const newRegistry = { ...state.registry };

          // Add to entities map
          newRegistry.entities.set(entity.id, entity);

          // Update type index
          if (!newRegistry.typeIndex.has(entity.type)) {
            newRegistry.typeIndex.set(entity.type, new Set());
          }
          newRegistry.typeIndex.get(entity.type)!.add(entity.id);

          // Update tag index
          entity.tags.forEach(tag => {
            if (!newRegistry.tagIndex.has(tag)) {
              newRegistry.tagIndex.set(tag, new Set());
            }
            newRegistry.tagIndex.get(tag)!.add(entity.id);
          });

          // Update name index
          const nameLower = entity.name.toLowerCase();
          if (!newRegistry.nameIndex.has(nameLower)) {
            newRegistry.nameIndex.set(nameLower, new Set());
          }
          newRegistry.nameIndex.get(nameLower)!.add(entity.id);

          // Add change event
          const changeEvent: EntityChangeEvent = {
            type: 'created',
            entity,
            timestamp: new Date(),
            affectedRelationships: []
          };

          return {
            registry: newRegistry,
            changeLog: [...state.changeLog.slice(-99), changeEvent], // Keep last 100 changes
            recentEntities: [entity.id, ...state.recentEntities.slice(0, 19)] // Keep last 20
          };
        });
      },

      updateEntity: (id: string, updates: Partial<BaseEntity>) => {
        set((state) => {
          const existingEntity = state.registry.entities.get(id);
          if (!existingEntity) return state;

          const updatedEntity = { ...existingEntity, ...updates, updatedAt: new Date() };
          const newRegistry = { ...state.registry };

          // Update entities map
          newRegistry.entities.set(id, updatedEntity);

          // Reindex if name or tags changed
          if (updates.name && updates.name !== existingEntity.name) {
            // Remove old name index
            const oldNameLower = existingEntity.name.toLowerCase();
            const oldNameSet = newRegistry.nameIndex.get(oldNameLower);
            if (oldNameSet) {
              oldNameSet.delete(id);
              if (oldNameSet.size === 0) {
                newRegistry.nameIndex.delete(oldNameLower);
              }
            }

            // Add new name index
            const newNameLower = updates.name.toLowerCase();
            if (!newRegistry.nameIndex.has(newNameLower)) {
              newRegistry.nameIndex.set(newNameLower, new Set());
            }
            newRegistry.nameIndex.get(newNameLower)!.add(id);
          }

          if (updates.tags && JSON.stringify(updates.tags) !== JSON.stringify(existingEntity.tags)) {
            // Remove old tag indices
            existingEntity.tags.forEach(tag => {
              const tagSet = newRegistry.tagIndex.get(tag);
              if (tagSet) {
                tagSet.delete(id);
                if (tagSet.size === 0) {
                  newRegistry.tagIndex.delete(tag);
                }
              }
            });

            // Add new tag indices
            updates.tags.forEach(tag => {
              if (!newRegistry.tagIndex.has(tag)) {
                newRegistry.tagIndex.set(tag, new Set());
              }
              newRegistry.tagIndex.get(tag)!.add(id);
            });
          }

          // Add change event
          const changeEvent: EntityChangeEvent = {
            type: 'updated',
            entity: updatedEntity,
            previousVersion: existingEntity,
            timestamp: new Date(),
            affectedRelationships: []
          };

          return {
            registry: newRegistry,
            changeLog: [...state.changeLog.slice(-99), changeEvent]
          };
        });
      },

      removeEntity: (id: string) => {
        set((state) => {
          const entity = state.registry.entities.get(id);
          if (!entity) return state;

          const newRegistry = { ...state.registry };

          // Remove from entities map
          newRegistry.entities.delete(id);

          // Remove from type index
          const typeSet = newRegistry.typeIndex.get(entity.type);
          if (typeSet) {
            typeSet.delete(id);
            if (typeSet.size === 0) {
              newRegistry.typeIndex.delete(entity.type);
            }
          }

          // Remove from tag index
          entity.tags.forEach(tag => {
            const tagSet = newRegistry.tagIndex.get(tag);
            if (tagSet) {
              tagSet.delete(id);
              if (tagSet.size === 0) {
                newRegistry.tagIndex.delete(tag);
              }
            }
          });

          // Remove from name index
          const nameLower = entity.name.toLowerCase();
          const nameSet = newRegistry.nameIndex.get(nameLower);
          if (nameSet) {
            nameSet.delete(id);
            if (nameSet.size === 0) {
              newRegistry.nameIndex.delete(nameLower);
            }
          }

          // Remove all relationships involving this entity
          const affectedRelationships: string[] = [];
          for (const [relId, relationship] of newRegistry.relationships) {
            if (relationship.fromEntity.id === id || relationship.toEntity.id === id) {
              newRegistry.relationships.delete(relId);
              affectedRelationships.push(relId);
            }
          }

          // Add change event
          const changeEvent: EntityChangeEvent = {
            type: 'deleted',
            entity,
            timestamp: new Date(),
            affectedRelationships
          };

          return {
            registry: newRegistry,
            changeLog: [...state.changeLog.slice(-99), changeEvent],
            recentEntities: state.recentEntities.filter(entityId => entityId !== id)
          };
        });
      },

      getEntity: (id: string) => {
        return get().registry.entities.get(id);
      },

      getEntitiesByType: (type: EntityType) => {
        const state = get();
        const entityIds = state.registry.typeIndex.get(type);
        if (!entityIds) return [];

        return Array.from(entityIds)
          .map(id => state.registry.entities.get(id))
          .filter(entity => entity !== undefined) as BaseEntity[];
      },

      getEntitiesByTag: (tag: string) => {
        const state = get();
        const entityIds = state.registry.tagIndex.get(tag);
        if (!entityIds) return [];

        return Array.from(entityIds)
          .map(id => state.registry.entities.get(id))
          .filter(entity => entity !== undefined) as BaseEntity[];
      },

      // Relationship Management
      addRelationship: (relationshipData) => {
        set((state) => {
          const relationship: EntityRelationship = {
            ...relationshipData,
            id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date()
          };

          const newRegistry = { ...state.registry };
          newRegistry.relationships.set(relationship.id, relationship);

          return { registry: newRegistry };
        });
      },

      updateRelationship: (id: string, updates) => {
        set((state) => {
          const existing = state.registry.relationships.get(id);
          if (!existing) return state;

          const updated = { ...existing, ...updates };
          const newRegistry = { ...state.registry };
          newRegistry.relationships.set(id, updated);

          return { registry: newRegistry };
        });
      },

      removeRelationship: (id: string) => {
        set((state) => {
          const newRegistry = { ...state.registry };
          newRegistry.relationships.delete(id);
          return { registry: newRegistry };
        });
      },

      getRelationshipsForEntity: (entityId: string) => {
        const state = get();
        const relationships: EntityRelationship[] = [];

        for (const relationship of state.registry.relationships.values()) {
          if (relationship.fromEntity.id === entityId || relationship.toEntity.id === entityId) {
            relationships.push(relationship);
          }
        }

        return relationships;
      },

      getRelationshipsBetween: (entityId1: string, entityId2: string) => {
        const state = get();
        const relationships: EntityRelationship[] = [];

        for (const relationship of state.registry.relationships.values()) {
          const isMatch = (relationship.fromEntity.id === entityId1 && relationship.toEntity.id === entityId2) ||
                         (relationship.fromEntity.id === entityId2 && relationship.toEntity.id === entityId1);

          if (isMatch) {
            relationships.push(relationship);
          }
        }

        return relationships;
      },

      // Search Implementation
      searchEntities: (options: EntitySearchOptions) => {
        const state = get();
        let entities = Array.from(state.registry.entities.values());

        // Apply filters
        if (options.filter) {
          entities = entities.filter(entity => {
            const filter = options.filter!;

            if (filter.types && !filter.types.includes(entity.type)) return false;
            if (filter.tags && !filter.tags.some(tag => entity.tags.includes(tag))) return false;
            if (filter.createdAfter && entity.createdAt < filter.createdAfter) return false;
            if (filter.createdBefore && entity.createdAt > filter.createdBefore) return false;
            if (filter.customFilter && !filter.customFilter(entity)) return false;

            return true;
          });
        }

        // Apply text search
        if (options.query) {
          const query = options.query.toLowerCase();
          entities = entities.filter(entity =>
            entity.name.toLowerCase().includes(query) ||
            entity.description?.toLowerCase().includes(query) ||
            entity.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }

        // Calculate relevance scores and create results
        const results: EntitySearchResult[] = entities.map(entity => {
          let relevanceScore = 1;
          const matchedFields: string[] = [];

          if (options.query) {
            const query = options.query.toLowerCase();
            if (entity.name.toLowerCase().includes(query)) {
              relevanceScore += 10;
              matchedFields.push('name');
            }
            if (entity.description?.toLowerCase().includes(query)) {
              relevanceScore += 5;
              matchedFields.push('description');
            }
            if (entity.tags.some(tag => tag.toLowerCase().includes(query))) {
              relevanceScore += 3;
              matchedFields.push('tags');
            }
          }

          const relationships = options.includeRelationships
            ? get().getRelationshipsForEntity(entity.id)
            : [];

          return {
            entity,
            relevanceScore,
            matchedFields,
            relationships
          };
        });

        // Sort results
        results.sort((a, b) => {
          if (options.sortBy === 'relevance') {
            return b.relevanceScore - a.relevanceScore;
          } else if (options.sortBy === 'name') {
            return options.sortOrder === 'desc'
              ? b.entity.name.localeCompare(a.entity.name)
              : a.entity.name.localeCompare(b.entity.name);
          } else if (options.sortBy === 'createdAt') {
            return options.sortOrder === 'desc'
              ? b.entity.createdAt.getTime() - a.entity.createdAt.getTime()
              : a.entity.createdAt.getTime() - b.entity.createdAt.getTime();
          } else if (options.sortBy === 'updatedAt') {
            return options.sortOrder === 'desc'
              ? b.entity.updatedAt.getTime() - a.entity.updatedAt.getTime()
              : a.entity.updatedAt.getTime() - b.entity.updatedAt.getTime();
          }
          return 0;
        });

        // Apply limit
        if (options.limit) {
          results.splice(options.limit);
        }

        // Update search history
        if (options.query && options.query.trim()) {
          set(state => ({
            searchHistory: [
              options.query!,
              ...state.searchHistory.filter(q => q !== options.query).slice(0, 19)
            ]
          }));
        }

        return results;
      },

      findSimilarEntities: (entityId: string, limit = 10) => {
        const state = get();
        const entity = state.registry.entities.get(entityId);
        if (!entity) return [];

        const allEntities = Array.from(state.registry.entities.values())
          .filter(e => e.id !== entityId);

        // Simple similarity based on shared tags and type
        const similarities = allEntities.map(other => {
          let score = 0;

          // Same type gets bonus
          if (other.type === entity.type) score += 5;

          // Shared tags
          const sharedTags = entity.tags.filter(tag => other.tags.includes(tag));
          score += sharedTags.length * 2;

          // Name similarity (simple)
          if (other.name.toLowerCase().includes(entity.name.toLowerCase()) ||
              entity.name.toLowerCase().includes(other.name.toLowerCase())) {
            score += 3;
          }

          return { entity: other, score };
        });

        return similarities
          .filter(s => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(s => s.entity);
      },

      getCrossReferences: (entityId: string) => {
        const state = get();
        const referencedIn: CrossReference['referencedIn'] = [];

        // Check relationships
        for (const relationship of state.registry.relationships.values()) {
          if (relationship.toEntity.id === entityId) {
            referencedIn.push({
              entityId: relationship.fromEntity.id,
              context: `${relationship.relationshipType} relationship`,
              fieldName: 'relationship'
            });
          }
        }

        // Could extend to check actual field references in entity data

        return { entityId, referencedIn };
      },

      // Validation
      validateEntity: (entityId: string) => {
        const entity = get().registry.entities.get(entityId);
        return entity ? entity.name.trim() !== '' : false;
      },

      validateAllEntities: () => {
        const entities = Array.from(get().registry.entities.values());
        const valid: BaseEntity[] = [];
        const invalid: BaseEntity[] = [];

        entities.forEach(entity => {
          if (get().validateEntity(entity.id)) {
            valid.push(entity);
          } else {
            invalid.push(entity);
          }
        });

        return { valid, invalid };
      },

      findOrphanedEntities: () => {
        const state = get();
        const entities = Array.from(state.registry.entities.values());
        const orphaned: BaseEntity[] = [];

        entities.forEach(entity => {
          const hasRelationships = state.registry.relationships.size > 0 &&
            Array.from(state.registry.relationships.values()).some(rel =>
              rel.fromEntity.id === entity.id || rel.toEntity.id === entity.id
            );

          if (!hasRelationships && state.registry.relationships.size > 0) {
            orphaned.push(entity);
          }
        });

        return orphaned;
      },

      findDuplicateEntities: () => {
        const entities = Array.from(get().registry.entities.values());
        const nameGroups = new Map<string, BaseEntity[]>();

        entities.forEach(entity => {
          const key = `${entity.type}:${entity.name.toLowerCase()}`;
          if (!nameGroups.has(key)) {
            nameGroups.set(key, []);
          }
          nameGroups.get(key)!.push(entity);
        });

        return Array.from(nameGroups.values()).filter(group => group.length > 1);
      },

      // Bulk Operations
      importEntities: (entities: BaseEntity[]) => {
        entities.forEach(entity => get().addEntity(entity));
      },

      exportEntities: (filter?: EntityFilter) => {
        let entities = Array.from(get().registry.entities.values());

        if (filter) {
          entities = entities.filter(entity => {
            if (filter.types && !filter.types.includes(entity.type)) return false;
            if (filter.tags && !filter.tags.some(tag => entity.tags.includes(tag))) return false;
            if (filter.createdAfter && entity.createdAt < filter.createdAfter) return false;
            if (filter.createdBefore && entity.createdAt > filter.createdBefore) return false;
            if (filter.customFilter && !filter.customFilter(entity)) return false;
            return true;
          });
        }

        return entities;
      },

      mergeEntities: (sourceId: string, targetId: string) => {
        const state = get();
        const sourceEntity = state.registry.entities.get(sourceId);
        const targetEntity = state.registry.entities.get(targetId);

        if (!sourceEntity || !targetEntity) return;

        // Merge tags
        const mergedTags = Array.from(new Set([...sourceEntity.tags, ...targetEntity.tags]));

        // Update target entity
        get().updateEntity(targetId, {
          tags: mergedTags,
          metadata: { ...sourceEntity.metadata, ...targetEntity.metadata }
        });

        // Transfer relationships
        const relationships = get().getRelationshipsForEntity(sourceId);
        relationships.forEach(rel => {
          const newRel = { ...rel };
          if (rel.fromEntity.id === sourceId) {
            newRel.fromEntity = { ...rel.fromEntity, id: targetId, name: targetEntity.name };
          }
          if (rel.toEntity.id === sourceId) {
            newRel.toEntity = { ...rel.toEntity, id: targetId, name: targetEntity.name };
          }
          get().removeRelationship(rel.id);
          get().addRelationship(newRel);
        });

        // Remove source entity
        get().removeEntity(sourceId);
      },

      // Utility
      generateEntityId: (type: EntityType) => {
        return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      },

      addToRecentEntities: (entityId: string) => {
        set(state => ({
          recentEntities: [
            entityId,
            ...state.recentEntities.filter(id => id !== entityId).slice(0, 19)
          ]
        }));
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] });
      },

      getEntityStats: () => {
        const entities = Array.from(get().registry.entities.values());
        const stats: Record<EntityType, number> = {} as Record<EntityType, number>;

        entities.forEach(entity => {
          stats[entity.type] = (stats[entity.type] || 0) + 1;
        });

        return stats;
      },

      // Additional methods needed by other components
      getAllEntities: () => {
        return Array.from(get().registry.entities.values());
      },

      getAllRelationships: () => {
        return Array.from(get().registry.relationships.values());
      }
    }),
    {
      name: 'entity-registry-store',
      // Custom serialization to handle Maps
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          registry: {
            entities: Array.from(state.registry.entities.entries()),
            relationships: Array.from(state.registry.relationships.entries()),
            typeIndex: Array.from(state.registry.typeIndex.entries()).map(([k, v]) => [k, Array.from(v)]),
            tagIndex: Array.from(state.registry.tagIndex.entries()).map(([k, v]) => [k, Array.from(v)]),
            nameIndex: Array.from(state.registry.nameIndex.entries()).map(([k, v]: [string, Set<string>]) => [k, Array.from(v)])
          }
        });
      },
      deserialize: (str: string) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          registry: {
            entities: new Map(parsed.registry.entities),
            relationships: new Map(parsed.registry.relationships),
            typeIndex: new Map(parsed.registry.typeIndex.map(([k, v]: [string, string[]]) => [k, new Set(v)])),
            tagIndex: new Map(parsed.registry.tagIndex.map(([k, v]: [string, string[]]) => [k, new Set(v)])),
            nameIndex: new Map(parsed.registry.nameIndex.map(([k, v]: [string, string[]]) => [k, new Set(v)]))
          }
        };
      }
    }
  )
);