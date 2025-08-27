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
  createdAt: Date;
  updatedAt: Date;
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