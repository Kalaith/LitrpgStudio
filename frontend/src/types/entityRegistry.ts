// Unified Entity Registry Types
// This serves as the single source of truth for all entities in LitRPG Studio

// Re-export all types from the dedicated types file
export type {
  EntityType,
  BaseEntity,
  EntityReference,
  EntityRelationship,
  RelationshipType,
  EntityRegistry,
  EntitySearchResult,
  EntityValidationResult,
  EntityValidationError,
  EntityValidationWarning,
  CrossReference,
  EntityChangeEvent,
  EntityAdapter,
  EntityFilter,
  EntitySearchOptions
} from './entityRegistryTypes';