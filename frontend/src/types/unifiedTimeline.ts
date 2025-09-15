// Unified Timeline System - Consolidates all timeline implementations
import type { EntityReference } from './entityRegistry';

export type TimelineEventType =
  | 'story_event'      // Main story events
  | 'character_arc'    // Character development moments
  | 'world_change'     // World state changes
  | 'series_event'     // Cross-series events
  | 'writing_milestone' // Writing progress markers
  | 'plot_point'       // Key plot developments
  | 'chapter_boundary' // Chapter start/end markers
  | 'flashback'        // Flashback events
  | 'foreshadowing'    // Foreshadowing elements
  | 'custom';          // User-defined events

export type TimelineScope =
  | 'story'           // Single story timeline
  | 'series'          // Multi-book series timeline
  | 'character'       // Character-specific timeline
  | 'world'           // World history timeline
  | 'writing'         // Writing process timeline
  | 'global';         // All events combined

export interface TimelineEvent {
  id: string;
  name: string;
  description: string;
  type: TimelineEventType;
  scope: TimelineScope;

  // Temporal Information
  timestamp: TimelineTimestamp;
  duration?: TimelineDuration;

  // Entity Relationships
  involvedEntities: EntityReference[];
  primaryEntity?: EntityReference; // Main focus entity

  // Story Context
  storyContext?: {
    storyId: string;
    chapterId?: string;
    sceneId?: string;
    wordPosition?: number; // Position in text where this happens
  };

  // Character Context
  characterContext?: {
    characterId: string;
    characterLevel?: number;
    characterLocation?: string;
    emotionalState?: string;
    relationshipChanges?: CharacterRelationshipChange[];
  };

  // World Context
  worldContext?: {
    location?: string;
    weather?: string;
    timeOfDay?: string;
    season?: string;
    politicalContext?: string;
    worldStateChanges?: WorldStateChange[];
  };

  // Plot Information
  plotImpact?: {
    importance: 1 | 2 | 3 | 4 | 5; // 1=minor, 5=major
    plotThreads: string[]; // Which plot threads this affects
    consequences: string[]; // What happens as a result
    foreshadowing?: string[]; // What this foreshadows
    callbacks?: string[]; // What this calls back to
  };

  // Visual and Metadata
  color?: string;
  icon?: string;
  tags: string[];
  notes?: string;

  // Relationships to other events
  dependencies?: EventDependency[];
  conflicts?: EventConflict[];

  // Status and Validation
  status: 'draft' | 'confirmed' | 'published' | 'archived';
  isCanon: boolean;
  validationIssues?: ValidationIssue[];

  // Audit Information
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface TimelineTimestamp {
  // Absolute timeline position
  absoluteTime?: Date; // Real-world date if applicable

  // Relative story time
  storyDay?: number; // Day since story began
  storyChapter?: number; // Chapter number
  storyScene?: number; // Scene within chapter

  // Series time (for multi-book series)
  seriesBook?: number; // Which book in series
  seriesDay?: number; // Day since series began

  // World time (in-world dating system)
  worldYear?: number;
  worldMonth?: number;
  worldDay?: number;
  worldAge?: string; // "Age of Magic", etc.

  // Flexible time description
  timeDescription?: string; // "During the great war", "childhood", etc.

  // Uncertainty and approximation
  isApproximate: boolean;
  uncertaintyRange?: number; // +/- days of uncertainty
}

export interface TimelineDuration {
  days?: number;
  hours?: number;
  minutes?: number;
  approximate: boolean;
  description?: string; // "A few hours", "several days"
}

export interface CharacterRelationshipChange {
  characterId: string;
  relationshipType: string;
  oldValue?: string | number;
  newValue: string | number;
  description: string;
}

export interface WorldStateChange {
  aspect: string; // "political", "geographical", "magical"
  location?: string;
  oldState?: string;
  newState: string;
  description: string;
  permanence: 'temporary' | 'permanent' | 'unknown';
}

export interface EventDependency {
  eventId: string;
  dependencyType: 'must_happen_before' | 'must_happen_after' | 'must_happen_during' | 'cannot_happen_with';
  description?: string;
}

export interface EventConflict {
  eventId: string;
  conflictType: 'timeline_conflict' | 'character_conflict' | 'world_state_conflict' | 'plot_conflict';
  description: string;
  severity: 'minor' | 'major' | 'critical';
  suggestedResolution?: string;
}

export interface ValidationIssue {
  type: 'timeline_inconsistency' | 'character_impossibility' | 'world_contradiction' | 'plot_hole';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  suggestion?: string;
  relatedEvents?: string[];
}

// Timeline View Configuration
export interface TimelineView {
  id: string;
  name: string;
  description: string;

  // Scope and Filtering
  scope: TimelineScope;
  entityFilter?: EntityReference[];
  typeFilter?: TimelineEventType[];
  tagFilter?: string[];
  timeRange?: {
    start: TimelineTimestamp;
    end: TimelineTimestamp;
  };

  // Display Configuration
  displayMode: 'linear' | 'branching' | 'circular' | 'gantt' | 'calendar';
  zoomLevel: 'years' | 'months' | 'days' | 'hours' | 'scenes';
  groupBy?: 'entity' | 'type' | 'story' | 'character' | 'none';
  sortBy: 'chronological' | 'importance' | 'entity' | 'custom';

  // Visual Configuration
  colorScheme: 'type' | 'entity' | 'importance' | 'story' | 'custom';
  showDependencies: boolean;
  showConflicts: boolean;
  showDetails: 'none' | 'minimal' | 'full';

  // Interactivity
  allowEditing: boolean;
  allowReordering: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Timeline Analysis Results
export interface TimelineAnalysis {
  totalEvents: number;
  timeSpan: {
    start: TimelineTimestamp;
    end: TimelineTimestamp;
    duration: TimelineDuration;
  };

  eventsByType: Record<TimelineEventType, number>;
  eventsByScope: Record<TimelineScope, number>;
  eventsByImportance: Record<number, number>;

  // Issue Detection
  conflicts: EventConflict[];
  gaps: TimelineGap[];
  inconsistencies: TimelineInconsistency[];

  // Statistics
  averageEventsPerChapter: number;
  mostActiveCharacter: EntityReference;
  mostChangedLocation: string;
  plotThreadCoverage: Record<string, number>;

  generatedAt: Date;
}

export interface TimelineGap {
  start: TimelineTimestamp;
  end: TimelineTimestamp;
  duration: TimelineDuration;
  severity: 'minor' | 'notable' | 'major';
  description: string;
  affectedEntities: EntityReference[];
  suggestions: string[];
}

export interface TimelineInconsistency {
  type: 'character_location' | 'character_ability' | 'world_state' | 'plot_logic' | 'temporal';
  description: string;
  severity: 'warning' | 'error' | 'critical';
  affectedEvents: string[];
  possibleResolutions: string[];
}

// Timeline Templates for common story structures
export interface TimelineTemplate {
  id: string;
  name: string;
  description: string;
  category: 'story_structure' | 'character_arc' | 'world_building' | 'genre_specific';

  // Template Events
  templateEvents: TemplateEvent[];

  // Configuration
  isFlexible: boolean; // Can events be reordered/modified?
  requiredEntities: EntityReference[];
  suggestedDuration: TimelineDuration;

  metadata: {
    author: string;
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    genre: string[];
  };
}

export interface TemplateEvent {
  name: string;
  description: string;
  type: TimelineEventType;
  relativePosition: number; // 0-100, position within template
  importance: 1 | 2 | 3 | 4 | 5;
  isOptional: boolean;
  dependencies?: string[]; // Names of other template events
  customizationOptions?: {
    nameEditable: boolean;
    typeEditable: boolean;
    positionFlexible: boolean;
  };
}

// Export Configuration
export interface TimelineExport {
  format: 'json' | 'csv' | 'pdf' | 'html' | 'markdown' | 'gantt_chart' | 'story_bible';
  view: TimelineView;
  includeRelationships: boolean;
  includeAnalysis: boolean;
  includeVisualizations: boolean;
  customTemplate?: string;
}

// Collaboration Features
export interface TimelineCollaboration {
  permissions: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
    canShare: string[];
  };

  comments: TimelineComment[];
  changeRequests: ChangeRequest[];
  approvals: Approval[];
}

export interface TimelineComment {
  id: string;
  eventId: string;
  author: string;
  content: string;
  type: 'comment' | 'suggestion' | 'question' | 'approval';
  createdAt: Date;
  resolved: boolean;
  replies?: TimelineComment[];
}

export interface ChangeRequest {
  id: string;
  eventId: string;
  requestedBy: string;
  changeType: 'modify' | 'delete' | 'move';
  proposedChanges: Partial<TimelineEvent>;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface Approval {
  id: string;
  eventId: string;
  approvedBy: string;
  approvalType: 'content' | 'timeline_position' | 'canon_status';
  notes?: string;
  createdAt: Date;
}