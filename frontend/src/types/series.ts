import type { Character } from './character';
import type { Story } from './story';

export interface Series {
  id: string;
  name: string;
  description: string;
  genre: string;
  status: SeriesStatus;
  books: Book[];
  sharedElements: SharedElements;
  metadata: SeriesMetadata;
  // Legacy compatibility fields used by adapter-driven flows.
  tags?: string[];
  worldBible?: {
    locations: string[];
    cultures: string[];
    magicSystems: string[];
    timeline: string[];
    rules: string[];
  };
  characterArcs?: string[];
  overarchingPlot?: string;
  themes?: string[];
  consistency?: {
    characterContinuity: string[];
    worldStateContinuity: string[];
    plotContinuity: string[];
    lastCheck: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type SeriesStatus = 'planning' | 'writing' | 'published' | 'completed' | 'on_hold';

export interface Book {
  id: string;
  seriesId: string;
  // Legacy compatibility alias in some hooks/components.
  storyId?: string;
  bookNumber: number;
  title: string;
  subtitle?: string;
  status: BookStatus;
  targetWordCount?: number;
  currentWordCount: number;
  stories: Story[];
  characterArcs: CharacterArc[];
  plotThreads: PlotThread[];
  timelineEvents: SeriesTimelineEvent[];
  publishedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type BookStatus = 'planning' | 'outlining' | 'writing' | 'editing' | 'published';

export interface SharedElements {
  characters: SharedCharacter[];
  worldBuilding: SharedWorldBuilding;
  magicSystems: MagicSystem[];
  locations: SharedLocation[];
  factions: SharedFaction[];
  terminology: SeriesTerminology[];
}

export interface SharedCharacter {
  characterId: string;
  character: Character;
  appearances: BookAppearance[];
  developmentArc: CharacterDevelopment[];
  relationships: CrossBookRelationship[];
}

export interface BookAppearance {
  bookId: string;
  bookNumber: number;
  role: 'main' | 'supporting' | 'minor' | 'cameo';
  chapters: number[];
  significance: 'critical' | 'important' | 'moderate' | 'minor';
}

export interface CharacterDevelopment {
  bookNumber: number;
  startingLevel: number;
  endingLevel: number;
  skillsGained: string[];
  personalityChanges: string[];
  relationshipChanges: string[];
  majorEvents: string[];
}

export interface CrossBookRelationship {
  targetCharacterId: string;
  relationship: string;
  strength: number;
  history: RelationshipHistory[];
}

export interface RelationshipHistory {
  bookNumber: number;
  event: string;
  strengthChange: number;
  description: string;
}

export interface SharedWorldBuilding {
  timeline: SeriesTimelineEvent[];
  worldRules: WorldRule[];
  cultures: Culture[];
  languages: Language[];
  religions: Religion[];
  economics: EconomicSystem[];
}

export interface SeriesTimelineEvent {
  id: string;
  name: string;
  description: string;
  date: string;
  bookNumber?: number;
  importance: 'legendary' | 'major' | 'moderate' | 'minor';
  type: 'historical' | 'political' | 'magical' | 'natural' | 'cultural';
  consequences: string[];
  references: TimelineReference[];
}

export interface TimelineReference {
  bookNumber: number;
  chapters: number[];
  context: string;
}

export interface WorldRule {
  id: string;
  category: 'magic' | 'physics' | 'social' | 'economic' | 'political';
  name: string;
  description: string;
  exceptions: string[];
  establishedInBook: number;
  references: BookReference[];
}

export interface BookReference {
  bookNumber: number;
  context: string;
  page?: number;
  importance: 'establishes' | 'reinforces' | 'challenges' | 'breaks';
}

export interface MagicSystem {
  id: string;
  name: string;
  type: 'hard' | 'soft' | 'hybrid';
  description: string;
  rules: MagicRule[];
  limitations: string[];
  costs: string[];
  practitioners: string[];
  evolution: MagicEvolution[];
}

export interface MagicRule {
  id: string;
  rule: string;
  explanation: string;
  examples: string[];
  exceptions: string[];
}

export interface MagicEvolution {
  bookNumber: number;
  changes: string[];
  newRules: string[];
  removedRules: string[];
  context: string;
}

export interface SharedLocation {
  id: string;
  name: string;
  type: 'continent' | 'kingdom' | 'city' | 'landmark' | 'dungeon';
  description: string;
  significance: string;
  appearances: LocationAppearance[];
  changes: LocationChange[];
}

export interface LocationAppearance {
  bookNumber: number;
  chapters: number[];
  role: 'setting' | 'mentioned' | 'reference';
  description: string;
}

export interface LocationChange {
  bookNumber: number;
  change: string;
  reason: string;
  impact: string;
}

export interface SharedFaction {
  id: string;
  name: string;
  type: 'government' | 'guild' | 'religion' | 'military' | 'criminal';
  description: string;
  goals: string[];
  evolution: FactionEvolution[];
  relationships: FactionRelationship[];
}

export interface FactionEvolution {
  bookNumber: number;
  changes: string[];
  newGoals: string[];
  powerShifts: string[];
  memberChanges: string[];
}

export interface FactionRelationship {
  targetFactionId: string;
  relationship: 'allied' | 'neutral' | 'rival' | 'enemy';
  strength: number;
  history: FactionHistory[];
}

export interface FactionHistory {
  bookNumber: number;
  event: string;
  relationshipChange: number;
  description: string;
}

export interface Culture {
  id: string;
  name: string;
  description: string;
  values: string[];
  traditions: string[];
  taboos: string[];
  locations: string[];
  evolution: CultureEvolution[];
}

export interface CultureEvolution {
  bookNumber: number;
  changes: string[];
  newTraditions: string[];
  lostTraditions: string[];
  context: string;
}

export interface Language {
  id: string;
  name: string;
  type: 'common' | 'ancient' | 'magical' | 'racial';
  speakers: string[];
  characteristics: string[];
  evolution: LanguageEvolution[];
}

export interface LanguageEvolution {
  bookNumber: number;
  changes: string[];
  newWords: SeriesTerminology[];
  context: string;
}

export interface Religion {
  id: string;
  name: string;
  type: 'monotheistic' | 'polytheistic' | 'pantheistic' | 'animistic';
  deities: Deity[];
  beliefs: string[];
  practices: string[];
  followers: string[];
  evolution: ReligionEvolution[];
}

export interface Deity {
  id: string;
  name: string;
  domain: string[];
  description: string;
  symbols: string[];
  followers: string[];
}

export interface ReligionEvolution {
  bookNumber: number;
  changes: string[];
  newBeliefs: string[];
  schisms: string[];
  context: string;
}

export interface EconomicSystem {
  id: string;
  name: string;
  type: 'feudal' | 'mercantile' | 'magical' | 'barter' | 'modern';
  currency: Currency[];
  tradeMethods: string[];
  majorCommodities: string[];
  evolution: EconomicEvolution[];
}

export interface Currency {
  id: string;
  name: string;
  value: number;
  material: string;
  appearance: string;
}

export interface EconomicEvolution {
  bookNumber: number;
  changes: string[];
  newCurrencies: Currency[];
  marketShifts: string[];
  context: string;
}

export interface SeriesTerminology {
  id: string;
  term: string;
  definition: string;
  category: 'magic' | 'technology' | 'culture' | 'politics' | 'geography';
  firstMentioned: number;
  importance: 'critical' | 'important' | 'moderate' | 'minor';
  aliases: string[];
  usage: TermUsage[];
}

export interface TermUsage {
  bookNumber: number;
  context: string;
  evolution?: string;
}

export interface CharacterArc {
  id: string;
  characterId: string;
  bookNumber: number;
  arcType: 'growth' | 'fall' | 'redemption' | 'transformation' | 'static';
  startingPoint: string;
  endingPoint: string;
  keyEvents: ArcEvent[];
  themes: string[];
}

export interface ArcEvent {
  id: string;
  name: string;
  description: string;
  chapter?: number;
  impact: 'minor' | 'moderate' | 'major' | 'climactic';
  consequences: string[];
}

export interface PlotThread {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'subplot' | 'character' | 'worldbuilding';
  status: 'introduced' | 'developing' | 'climax' | 'resolved' | 'abandoned';
  books: PlotThreadAppearance[];
  resolution?: string;
}

export interface PlotThreadAppearance {
  bookNumber: number;
  status: 'introduced' | 'developed' | 'advanced' | 'resolved';
  chapters: number[];
  significance: string;
}

export interface SeriesMetadata {
  author: string;
  publisher?: string;
  isbn?: string[];
  genres: string[];
  themes: string[];
  targetAudience: string;
  marketCategory: string;
  seriesLength: number;
  estimatedCompletion?: Date;
  marketingTags: string[];
  // Legacy compatibility analytics metadata fields.
  totalWordCount?: number;
  estimatedBooks?: number;
  publishingPlan?: string;
  marketingNotes?: string;
}

export interface SeriesAnalytics {
  seriesId: string;
  totalWordCount: number;
  averageBookLength: number;
  completionRate: number;
  characterCount: number;
  locationCount: number;
  plotThreadCount: number;
  consistencyScore: number;
  readabilityScore: number;
  pacing: PacingAnalysis;
  characterDevelopment: CharacterAnalysis[];
  worldBuildingDepth: WorldBuildingAnalysis;
}

export interface PacingAnalysis {
  overallPace: 'fast' | 'moderate' | 'slow' | 'variable';
  actionScenes: number;
  dialogueScenes: number;
  descriptionScenes: number;
  paceByBook: BookPacing[];
}

export interface BookPacing {
  bookNumber: number;
  pace: 'fast' | 'moderate' | 'slow';
  tensionCurve: number[];
}

export interface CharacterAnalysis {
  characterId: string;
  screenTime: number;
  developmentArc: number;
  relationshipComplexity: number;
  importanceScore: number;
}

export interface WorldBuildingAnalysis {
  depth: number;
  consistency: number;
  complexity: number;
  originality: number;
  integration: number;
}
