import { STORAGE_KEYS } from '../constants';

export abstract class BaseDataService<T> {
  protected storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  protected getStorageData(): T[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error loading data from ${this.storageKey}:`, error);
      return [];
    }
  }

  protected setStorageData(data: T[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving data to ${this.storageKey}:`, error);
      throw new Error('Failed to save data');
    }
  }

  abstract create(item: Omit<T, 'id'>): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract update(id: string, updates: Partial<T>): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;
}

export interface StoredEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export class GenericDataService<T extends StoredEntity> extends BaseDataService<T> {
  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date().toISOString();
    const newItem: T = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    } as T;

    const data = this.getStorageData();
    data.push(newItem);
    this.setStorageData(data);

    return newItem;
  }

  async findById(id: string): Promise<T | null> {
    const data = this.getStorageData();
    return data.find(item => item.id === id) || null;
  }

  async findAll(): Promise<T[]> {
    return this.getStorageData();
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const data = this.getStorageData();
    const index = data.findIndex(item => item.id === id);

    if (index === -1) return null;

    const updatedItem: T = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    data[index] = updatedItem;
    this.setStorageData(data);

    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    const data = this.getStorageData();
    const filteredData = data.filter(item => item.id !== id);

    if (filteredData.length === data.length) return false;

    this.setStorageData(filteredData);
    return true;
  }

  async findWhere(predicate: (item: T) => boolean): Promise<T[]> {
    const data = this.getStorageData();
    return data.filter(predicate);
  }

  async count(): Promise<number> {
    return this.getStorageData().length;
  }

  async clear(): Promise<void> {
    this.setStorageData([]);
  }

  async exists(id: string): Promise<boolean> {
    const data = this.getStorageData();
    return data.some(item => item.id === id);
  }
}

// Specific service instances
export interface CharacterEntity extends StoredEntity {
  name: string;
  class: string;
  race: string;
  level: number;
  skillPoints: number;
  stats: Record<string, number>;
}

export interface ItemEntity extends StoredEntity {
  name: string;
  type: string;
  rarity: string;
  level: number;
  description: string;
  stats: Array<{ name: string; value: number; type: 'flat' | 'percentage' }>;
}

export interface StoryEntity extends StoredEntity {
  title: string;
  description: string;
  genre: string;
  status: 'draft' | 'published' | 'archived';
  wordCount: number;
  chapters: Array<{
    id: string;
    title: string;
    content: string;
    wordCount: number;
  }>;
}

// Service instances
export const characterService = new GenericDataService<CharacterEntity>(STORAGE_KEYS.CHARACTER_DATA);
export const itemService = new GenericDataService<ItemEntity>('items');
export const storyService = new GenericDataService<StoryEntity>(STORAGE_KEYS.STORY_DATA);

// Utility functions for data operations
export class DataOperations {
  static async importData<T extends StoredEntity>(
    service: GenericDataService<T>,
    data: T[]
  ): Promise<void> {
    await service.clear();

    for (const item of data) {
      await service.create(item as Omit<T, 'id' | 'createdAt' | 'updatedAt'>);
    }
  }

  static async exportData<T extends StoredEntity>(
    service: GenericDataService<T>
  ): Promise<T[]> {
    return await service.findAll();
  }

  static async backupData(): Promise<Record<string, unknown[]>> {
    return {
      characters: await characterService.findAll(),
      items: await itemService.findAll(),
      stories: await storyService.findAll()
    };
  }

  static async restoreData(backup: Record<string, unknown[]>): Promise<void> {
    if (backup.characters) {
      await DataOperations.importData(characterService, backup.characters as CharacterEntity[]);
    }
    if (backup.items) {
      await DataOperations.importData(itemService, backup.items as ItemEntity[]);
    }
    if (backup.stories) {
      await DataOperations.importData(storyService, backup.stories as StoryEntity[]);
    }
  }
}