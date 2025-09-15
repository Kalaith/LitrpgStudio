export interface Character {
  id: string;
  name: string;
  class: string;
  race: string;
  level: number;
  experience: number;
  stats: CharacterStats;
  skills: Skill[];
  equipment: Item[];
  backstory: string;
  appearance: string;
  personality: string[];
  progression: LevelProgression[];
  relationships: CharacterRelationship[];
  storyReferences: StoryReference[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryReference {
  storyId: string;
  chapterId?: string;
  mentionType: 'main_character' | 'supporting' | 'mentioned' | 'appears';
  context: string;
  chapterNumber?: number;
  sceneDescription?: string;
  importanceLevel: 'background' | 'minor' | 'moderate' | 'major' | 'critical';
}

export interface CharacterCrossReference {
  id: string;
  sourceType: 'character' | 'location' | 'item' | 'event';
  sourceId: string;
  targetType: 'character' | 'location' | 'item' | 'event' | 'chapter';
  targetId: string;
  relationshipType: string;
  description?: string;
  strength: number; // 1-10 scale
}

export interface CharacterRelationship {
  characterId: string;
  type: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family';
  strength: number; // 1-10 scale
  description?: string;
  history?: string;
}

export interface CharacterStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  // Derived stats
  hitPoints: number;
  manaPoints: number;
  armorClass: number;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  experience: number;
  description: string;
  category: SkillCategory;
}

export type SkillCategory = 'Combat' | 'Magic' | 'Crafting' | 'Social' | 'Utility' | 'Passive';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  stats?: Partial<CharacterStats>;
  description: string;
  value: number;
  equipped: boolean;
}

export type ItemType = 'Weapon' | 'Armor' | 'Accessory' | 'Consumable' | 'Material' | 'Quest';
export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Artifact';

export interface LevelProgression {
  level: number;
  experienceRequired: number;
  statsGained: Partial<CharacterStats>;
  skillsUnlocked: string[];
  featuresUnlocked: string[];
}

export interface CharacterTemplate {
  id: string;
  name: string;
  description: string;
  baseStats: CharacterStats;
  startingSkills: Skill[];
  startingEquipment: Item[];
  backgroundStory: string;
}