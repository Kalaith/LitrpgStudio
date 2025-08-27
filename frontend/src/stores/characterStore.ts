import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Character, CharacterTemplate, Skill, Item } from '../types';

interface CharacterState {
  characters: Character[];
  currentCharacter: Character | null;
  templates: CharacterTemplate[];
}

interface CharacterActions {
  createCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (characterId: string) => void;
  setCurrentCharacter: (character: Character | null) => void;
  
  // Character progression
  levelUpCharacter: (characterId: string) => void;
  addSkillToCharacter: (characterId: string, skill: Skill) => void;
  updateCharacterSkill: (characterId: string, skillId: string, updates: Partial<Skill>) => void;
  addItemToCharacter: (characterId: string, item: Item) => void;
  removeItemFromCharacter: (characterId: string, itemId: string) => void;
  equipItem: (characterId: string, itemId: string) => void;
  unequipItem: (characterId: string, itemId: string) => void;
  
  // Templates
  saveAsTemplate: (character: Character, templateName: string) => void;
  createFromTemplate: (templateId: string, characterName: string) => void;
  
  // Utility
  clearAll: () => void;
}

type CharacterStore = CharacterState & CharacterActions;

const generateId = () => crypto.randomUUID();

const calculateDerivedStats = (stats: Character['stats']): Character['stats'] => {
  return {
    ...stats,
    hitPoints: Math.max(1, stats.constitution * 10 + stats.level * 5),
    manaPoints: Math.max(0, stats.intelligence * 8 + stats.level * 3),
    armorClass: 10 + Math.floor((stats.dexterity - 10) / 2),
  };
};

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
      // State
      characters: [],
      currentCharacter: null,
      templates: [],

      // Actions
      createCharacter: (characterData) =>
        set((state) => {
          const newCharacter: Character = {
            ...characterData,
            id: generateId(),
            stats: calculateDerivedStats(characterData.stats),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return {
            characters: [...state.characters, newCharacter],
            currentCharacter: newCharacter,
          };
        }),

      updateCharacter: (characterId, updates) =>
        set((state) => {
          const updatedCharacters = state.characters.map(c =>
            c.id === characterId
              ? {
                  ...c,
                  ...updates,
                  stats: updates.stats ? calculateDerivedStats({ ...c.stats, ...updates.stats }) : c.stats,
                  updatedAt: new Date(),
                }
              : c
          );
          return {
            characters: updatedCharacters,
            currentCharacter:
              state.currentCharacter?.id === characterId
                ? updatedCharacters.find(c => c.id === characterId) || null
                : state.currentCharacter,
          };
        }),

      deleteCharacter: (characterId) =>
        set((state) => ({
          characters: state.characters.filter(c => c.id !== characterId),
          currentCharacter: state.currentCharacter?.id === characterId ? null : state.currentCharacter,
        })),

      setCurrentCharacter: (character) => set({ currentCharacter: character }),

      levelUpCharacter: (characterId) =>
        set((state) => {
          const character = state.characters.find(c => c.id === characterId);
          if (!character) return state;

          const newLevel = character.level + 1;
          const statIncrease = Math.floor(newLevel / 4); // Stat increase every 4 levels

          const updatedCharacter: Character = {
            ...character,
            level: newLevel,
            experience: character.experience + 1000, // Could be configurable
            stats: calculateDerivedStats({
              ...character.stats,
              strength: character.stats.strength + (newLevel % 4 === 0 ? 1 : 0),
              constitution: character.stats.constitution + (newLevel % 4 === 1 ? 1 : 0),
              intelligence: character.stats.intelligence + (newLevel % 4 === 2 ? 1 : 0),
              dexterity: character.stats.dexterity + (newLevel % 4 === 3 ? 1 : 0),
            }),
            updatedAt: new Date(),
          };

          return {
            characters: state.characters.map(c =>
              c.id === characterId ? updatedCharacter : c
            ),
            currentCharacter: state.currentCharacter?.id === characterId ? updatedCharacter : state.currentCharacter,
          };
        }),

      addSkillToCharacter: (characterId, skill) =>
        set((state) => {
          const character = state.characters.find(c => c.id === characterId);
          if (!character) return state;

          const updatedCharacter: Character = {
            ...character,
            skills: [...character.skills, { ...skill, id: generateId() }],
            updatedAt: new Date(),
          };

          return {
            characters: state.characters.map(c =>
              c.id === characterId ? updatedCharacter : c
            ),
            currentCharacter: state.currentCharacter?.id === characterId ? updatedCharacter : state.currentCharacter,
          };
        }),

      updateCharacterSkill: (characterId, skillId, updates) =>
        set((state) => {
          const character = state.characters.find(c => c.id === characterId);
          if (!character) return state;

          const updatedCharacter: Character = {
            ...character,
            skills: character.skills.map(s =>
              s.id === skillId ? { ...s, ...updates } : s
            ),
            updatedAt: new Date(),
          };

          return {
            characters: state.characters.map(c =>
              c.id === characterId ? updatedCharacter : c
            ),
            currentCharacter: state.currentCharacter?.id === characterId ? updatedCharacter : state.currentCharacter,
          };
        }),

      addItemToCharacter: (characterId, item) =>
        set((state) => {
          const character = state.characters.find(c => c.id === characterId);
          if (!character) return state;

          const updatedCharacter: Character = {
            ...character,
            equipment: [...character.equipment, { ...item, id: generateId(), equipped: false }],
            updatedAt: new Date(),
          };

          return {
            characters: state.characters.map(c =>
              c.id === characterId ? updatedCharacter : c
            ),
            currentCharacter: state.currentCharacter?.id === characterId ? updatedCharacter : state.currentCharacter,
          };
        }),

      removeItemFromCharacter: (characterId, itemId) =>
        set((state) => {
          const character = state.characters.find(c => c.id === characterId);
          if (!character) return state;

          const updatedCharacter: Character = {
            ...character,
            equipment: character.equipment.filter(i => i.id !== itemId),
            updatedAt: new Date(),
          };

          return {
            characters: state.characters.map(c =>
              c.id === characterId ? updatedCharacter : c
            ),
            currentCharacter: state.currentCharacter?.id === characterId ? updatedCharacter : state.currentCharacter,
          };
        }),

      equipItem: (characterId, itemId) =>
        set((state) => {
          const character = state.characters.find(c => c.id === characterId);
          if (!character) return state;

          const updatedCharacter: Character = {
            ...character,
            equipment: character.equipment.map(i =>
              i.id === itemId ? { ...i, equipped: true } : i
            ),
            updatedAt: new Date(),
          };

          return {
            characters: state.characters.map(c =>
              c.id === characterId ? updatedCharacter : c
            ),
            currentCharacter: state.currentCharacter?.id === characterId ? updatedCharacter : state.currentCharacter,
          };
        }),

      unequipItem: (characterId, itemId) =>
        set((state) => {
          const character = state.characters.find(c => c.id === characterId);
          if (!character) return state;

          const updatedCharacter: Character = {
            ...character,
            equipment: character.equipment.map(i =>
              i.id === itemId ? { ...i, equipped: false } : i
            ),
            updatedAt: new Date(),
          };

          return {
            characters: state.characters.map(c =>
              c.id === characterId ? updatedCharacter : c
            ),
            currentCharacter: state.currentCharacter?.id === characterId ? updatedCharacter : state.currentCharacter,
          };
        }),

      saveAsTemplate: (character, templateName) =>
        set((state) => {
          const template: CharacterTemplate = {
            id: generateId(),
            name: templateName,
            description: `Template based on ${character.name}`,
            baseStats: character.stats,
            startingSkills: character.skills,
            startingEquipment: character.equipment.filter(i => !i.equipped),
            backgroundStory: character.backstory,
          };
          return {
            templates: [...state.templates, template],
          };
        }),

      createFromTemplate: (templateId, characterName) =>
        set((state) => {
          const template = state.templates.find(t => t.id === templateId);
          if (!template) return state;

          const newCharacter: Character = {
            id: generateId(),
            name: characterName,
            class: 'Adventurer',
            race: 'Human',
            level: 1,
            experience: 0,
            stats: template.baseStats,
            skills: template.startingSkills.map(s => ({ ...s, id: generateId() })),
            equipment: template.startingEquipment.map(i => ({ ...i, id: generateId(), equipped: false })),
            backstory: template.backgroundStory,
            appearance: '',
            personality: [],
            progression: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          return {
            characters: [...state.characters, newCharacter],
            currentCharacter: newCharacter,
          };
        }),

      clearAll: () =>
        set({
          characters: [],
          currentCharacter: null,
          templates: [],
        }),
    }),
    {
      name: 'litrpg-character-storage',
      partialize: (state) => ({
        characters: state.characters,
        templates: state.templates,
      }),
    }
  )
);