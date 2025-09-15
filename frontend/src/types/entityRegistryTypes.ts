// Entity Registry Type Definitions
// Separated from entityRegistry.ts to avoid verbatimModuleSyntax issues

export type EntityType =
  | 'character'
  | 'location'
  | 'item'
  | 'skill'
  | 'event'
  | 'quest'
  | 'faction'
  | 'story'
  | 'chapter'
  | 'series'
  | 'lootTable'
  | 'research';

export interface BaseEntity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

export interface EntityReference {
  id: string;
  type: EntityType;
  name: string;
}

export interface EntityRelationship {
  id: string;
  fromEntity: EntityReference;
  toEntity: EntityReference;
  relationshipType: RelationshipType;
  strength: number; // 1-10 scale
  description?: string;
  bidirectional: boolean;
  createdAt: Date;
}

export type RelationshipType =
  | 'contains' // location contains character
  | 'owns' // character owns item
  | 'knows' // character knows skill
  | 'participates' // character participates in event
  | 'located_in' // item located in location
  | 'prerequisite' // skill prerequisite for another skill
  | 'enemy_of' // character enemy of character
  | 'ally_of' // character ally of character
  | 'member_of' // character member of faction
  | 'leads' // character leads faction
  | 'part_of' // chapter part of story
  | 'references' // research references entity
  | 'inspired_by' // entity inspired by research
  | 'parent_of' // series parent of story
  | 'child_of' // story child of series
  | 'produces' // loot table produces item
  | 'custom'; // user-defined relationship

export interface EntityRegistry {
  entities: Map<string, BaseEntity>;
  relationships: Map<string, EntityRelationship>;
  typeIndex: Map<EntityType, Set<string>>; // Fast lookup by type
  tagIndex: Map<string, Set<string>>; // Fast lookup by tags
  nameIndex: Map<string, Set<string>>; // Fast search by name
}

export interface EntitySearchResult {
  entity: BaseEntity;
  relevanceScore: number;
  matchedFields: string[];
  relationships: EntityRelationship[];
}

export interface EntityValidationResult {
  isValid: boolean;
  errors: EntityValidationError[];
  warnings: EntityValidationWarning[];
}

export interface EntityValidationError {
  entityId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface EntityValidationWarning {
  entityId: string;
  message: string;
  suggestion?: string;
}

export interface CrossReference {
  entityId: string;
  referencedIn: {
    entityId: string;
    context: string;
    fieldName: string;
  }[];
}

export interface EntityChangeEvent {
  type: 'created' | 'updated' | 'deleted';
  entity: BaseEntity;
  previousVersion?: BaseEntity;
  timestamp: Date;
  affectedRelationships: string[];
}

// Entity Adapter interfaces for converting between specific types and base entities
export interface EntityAdapter<T> {
  fromEntity(entity: BaseEntity): T;
  toEntity(item: T): BaseEntity;
  validateEntity(entity: BaseEntity): EntityValidationResult;
}

// Search and filter interfaces
export interface EntityFilter {
  types?: EntityType[];
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  hasRelationshipWith?: string;
  relationshipTypes?: RelationshipType[];
  customFilter?: (entity: BaseEntity) => boolean;
}

export interface EntitySearchOptions {
  query?: string;
  filter?: EntityFilter;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeRelationships?: boolean;
}