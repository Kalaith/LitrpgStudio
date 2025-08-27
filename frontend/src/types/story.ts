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