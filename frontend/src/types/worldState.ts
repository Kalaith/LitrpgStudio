export interface WorldState {
  id: string;
  storyId: string;
  chapterId?: string;
  chapterNumber: number;
  timestamp: Date;
  state: {
    characters: CharacterState[];
    locations: LocationState[];
    items: ItemState[];
    events: EventState[];
    worldProperties: WorldProperty[];
  };
  changeLog: StateChange[];
  consistencyChecks: ConsistencyResult[];
}

export interface CharacterState {
  characterId: string;
  name: string;
  level: number;
  experience: number;
  stats: Record<string, number>;
  location?: string;
  status: CharacterStatus;
  inventory: string[];
  relationships: Record<string, number>;
  flags: Record<string, boolean>;
}

export interface LocationState {
  locationId: string;
  name: string;
  currentOccupants: string[];
  properties: Record<string, unknown>;
  accessibleFrom: string[];
  timeOfDay?: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';
  weather?: string;
  flags: Record<string, boolean>;
}

export interface ItemState {
  itemId: string;
  name: string;
  location: 'character' | 'location' | 'destroyed' | 'lost';
  ownerId?: string;
  locationId?: string;
  properties: Record<string, unknown>;
  flags: Record<string, boolean>;
}

export interface EventState {
  eventId: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';
  startChapter?: number;
  endChapter?: number;
  participants: string[];
  consequences: string[];
  flags: Record<string, boolean>;
}

export interface WorldProperty {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  lastChanged: Date;
  changeReason: string;
}

export interface StateChange {
  id: string;
  timestamp: Date;
  chapterNumber: number;
  changeType: 'character' | 'location' | 'item' | 'event' | 'property';
  targetId: string;
  property: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
  automatic: boolean;
}

export interface ConsistencyResult {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'character' | 'location' | 'item' | 'timeline' | 'logic';
  description: string;
  details: string;
  affectedElements: string[];
  suggestedFix?: string;
  autoFixable: boolean;
  severity: 1 | 2 | 3 | 4 | 5; // 1 = minor, 5 = critical
  detectedAt: Date;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  priority: number;
  condition: (worldState: WorldState, previousState?: WorldState) => boolean;
  message: string;
  suggestedFix?: string;
  autoFix?: (worldState: WorldState) => WorldState;
}

export type CharacterStatus =
  | 'alive'
  | 'injured'
  | 'unconscious'
  | 'dead'
  | 'missing'
  | 'captured'
  | 'sleeping'
  | 'traveling'
  | 'busy'
  | 'available';

export interface WorldStateSnapshot {
  worldState: WorldState;
  storyTitle: string;
  chapterTitle: string;
  createdAt: Date;
  description: string;
  tags: string[];
}