import type { Character } from './character';

export interface Story {
  id: string;
  title: string;
  genre: StoryGenre;
  description: string;
  mainCharacter: Character;
  supportingCharacters: Character[];
  chapters: Chapter[];
  worldBuilding: WorldDetails;
  timeline: StoryEvent[];
  status: StoryStatus;
  wordCount: number;
  targetWordCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type StoryGenre = 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'cyberpunk' | 'steampunk';
export type StoryStatus = 'draft' | 'in_progress' | 'completed' | 'published' | 'archived';

export interface Chapter {
  id: string;
  storyId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  notes: string;
  characterProgression: CharacterProgressionEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorldDetails {
  name: string;
  description: string;
  magicSystem?: string;
  technology?: string;
  politics?: string;
  geography?: string;
  cultures?: string[];
  languages?: string[];
  religions?: string[];
  locations: Location[];
  maps: WorldMap[];
  timeline: WorldTimelineEvent[];
  factions: Faction[];
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description: string;
  parentLocationId?: string; // For hierarchical locations
  coordinates?: { x: number; y: number };
  size: LocationSize;
  population?: number;
  government?: string;
  economy?: string;
  culture?: string;
  defenses?: string;
  notableFeatures: string[];
  connections: LocationConnection[];
  resources?: Resource[];
  createdAt: Date;
  updatedAt: Date;
}

export type LocationType = 'continent' | 'kingdom' | 'city' | 'town' | 'village' | 'dungeon' | 'landmark' | 'wilderness';
export type LocationSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gigantic';

export interface LocationConnection {
  locationId: string;
  type: 'road' | 'river' | 'sea_route' | 'teleport' | 'portal' | 'passage';
  distance?: number;
  travelTime?: string;
  description?: string;
}

export interface Resource {
  name: string;
  type: 'mineral' | 'agricultural' | 'magical' | 'trade_good';
  abundance: 'scarce' | 'limited' | 'common' | 'abundant';
  description?: string;
}

export interface WorldMap {
  id: string;
  name: string;
  type: 'world' | 'region' | 'city' | 'building' | 'dungeon';
  imageUrl?: string;
  scale: string;
  locations: MapLocation[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MapLocation {
  locationId: string;
  x: number;
  y: number;
  label: string;
  markerType: 'city' | 'town' | 'dungeon' | 'landmark' | 'poi';
}

export interface WorldTimelineEvent {
  id: string;
  title: string;
  date: string; // In-world date system
  era?: string;
  type: 'historical' | 'political' | 'natural' | 'magical' | 'war' | 'discovery';
  description: string;
  consequences?: string[];
  locationsAffected: string[];
  factionsInvolved: string[];
}

export interface Faction {
  id: string;
  name: string;
  type: 'government' | 'guild' | 'religion' | 'military' | 'criminal' | 'merchant' | 'academic';
  description: string;
  goals: string[];
  methods: string[];
  resources: string[];
  territory: string[];
  allies: string[];
  enemies: string[];
  leaders: FactionLeader[];
  influence: number; // 1-100 scale
  status: 'growing' | 'stable' | 'declining' | 'disbanded';
  createdAt: Date;
  updatedAt: Date;
}

export interface FactionLeader {
  characterId?: string;
  name: string;
  title: string;
  description: string;
}

export interface StoryEvent {
  id: string;
  title: string;
  description: string;
  date: string; // In-story timeline
  chapter?: string;
  charactersInvolved: string[];
  importance: EventImportance;
}

export type EventImportance = 'minor' | 'moderate' | 'major' | 'critical';

export interface CharacterProgressionEvent {
  characterId: string;
  type: 'level_up' | 'skill_gain' | 'item_acquired' | 'stat_change';
  details: string;
  before?: any;
  after?: any;
}

export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  genre: StoryGenre;
  outline: string[];
  suggestedLength: number;
  characterTemplates: string[];
}