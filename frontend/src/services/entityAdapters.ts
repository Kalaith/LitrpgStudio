// Entity Adapters - Bridge existing data types to unified entity registry
import type {
  BaseEntity,
  EntityAdapter,
  EntityType,
  EntityValidationResult,
  EntityValidationError,
  EntityValidationWarning
} from '../types/entityRegistry';
import type { Character } from '../types/character';
import type { Story, Chapter } from '../types/story';
import type { Series } from '../types/series';
import type { ResearchSource, SourceType } from '../types/research';
import type { LootTable } from '../types/lootTable';

type MetadataRecord = Record<string, unknown>;

// Character Adapter
export class CharacterAdapter implements EntityAdapter<Character> {
  fromEntity(entity: BaseEntity): Character {
    const metadata = entity.metadata as Partial<Character> & MetadataRecord;
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      level: metadata.level || 1,
      class: metadata.class || 'Adventurer',
      race: metadata.race || 'Human',
      stats: metadata.stats || {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hitPoints: 100,
        manaPoints: 50,
        armorClass: 10
      },
      skills: metadata.skills || [],
      equipment: metadata.inventory || metadata.equipment || [],
      inventory: metadata.inventory || metadata.equipment || [],
      location: metadata.location || '',
      experience: metadata.experience || 0,
      backstory: metadata.backstory || '',
      personality: Array.isArray(metadata.personality)
        ? metadata.personality
        : (metadata.personality ? [String(metadata.personality)] : []),
      goals: metadata.goals || [],
      relationships: metadata.relationships || [],
      appearance: metadata.appearance || '',
      notes: metadata.notes || '',
      tags: entity.tags,
      progression: metadata.progression || [],
      storyReferences: metadata.storyReferences || [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  toEntity(character: Character): BaseEntity {
    return {
      id: character.id,
      name: character.name,
      type: 'character' as EntityType,
      description: character.description || '',
      tags: character.tags || [],
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
      metadata: {
        level: character.level,
        experience: character.experience,
        class: character.class,
        race: character.race,
        stats: character.stats,
        skills: character.skills,
        inventory: character.inventory || character.equipment,
        location: character.location,
        backstory: character.backstory,
        personality: character.personality,
        goals: character.goals,
        relationships: character.relationships,
        appearance: character.appearance,
        notes: character.notes,
        storyReferences: character.storyReferences
      }
    };
  }

  validateEntity(entity: BaseEntity): EntityValidationResult {
    const errors: EntityValidationError[] = [];
    const warnings: EntityValidationWarning[] = [];

    if (!entity.name?.trim()) {
      errors.push({
        entityId: entity.id,
        field: 'name',
        message: 'Character name is required',
        severity: 'error' as const
      });
    }

    const metadata = entity.metadata as Partial<Character> & MetadataRecord;
    if (typeof metadata.level === 'number' && (metadata.level < 1 || metadata.level > 100)) {
      warnings.push({
        entityId: entity.id,
        message: 'Character level should be between 1 and 100',
        suggestion: 'Adjust character level to a reasonable range'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Story Adapter
export class StoryAdapter implements EntityAdapter<Story> {
  fromEntity(entity: BaseEntity): Story {
    const metadata = entity.metadata as Partial<Story> & MetadataRecord;
    const placeholderCharacter: Character = {
      id: `${entity.id}-character`,
      name: 'Unknown',
      class: 'Adventurer',
      race: 'Human',
      level: 1,
      experience: 0,
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hitPoints: 100,
        manaPoints: 50,
        armorClass: 10
      },
      skills: [],
      equipment: [],
      backstory: '',
      appearance: '',
      personality: [],
      progression: [],
      relationships: [],
      storyReferences: [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };

    return {
      id: entity.id,
      title: entity.name,
      description: entity.description || '',
      genre: metadata.genre || 'fantasy',
      status: metadata.status || 'draft',
      wordCount: metadata.wordCount || 0,
      targetWordCount: metadata.targetWordCount || 50000,
      mainCharacter: metadata.mainCharacter || placeholderCharacter,
      supportingCharacters: metadata.supportingCharacters || [],
      worldBuilding: metadata.worldBuilding || {
        name: '',
        description: '',
        locations: [],
        maps: [],
        timeline: [],
        factions: []
      },
      timeline: metadata.timeline || [],
      chapters: metadata.chapters || [],
      characters: metadata.characters || [],
      worldBuildingNotes: metadata.worldBuildingNotes || '',
      plotOutline: metadata.plotOutline || '',
      themes: metadata.themes || [],
      tags: entity.tags,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      lastModified: metadata.lastModified || entity.updatedAt,
      author: metadata.author || 'Unknown'
    };
  }

  toEntity(story: Story): BaseEntity {
    return {
      id: story.id,
      name: story.title,
      type: 'story' as EntityType,
      description: story.description,
      tags: story.tags || [],
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      metadata: {
        genre: story.genre,
        status: story.status,
        wordCount: story.wordCount,
        targetWordCount: story.targetWordCount,
        mainCharacter: story.mainCharacter,
        supportingCharacters: story.supportingCharacters,
        worldBuilding: story.worldBuilding,
        timeline: story.timeline,
        chapters: story.chapters,
        characters: story.characters,
        worldBuildingNotes: story.worldBuildingNotes,
        plotOutline: story.plotOutline,
        themes: story.themes,
        lastModified: story.lastModified,
        author: story.author
      }
    };
  }

  validateEntity(entity: BaseEntity): EntityValidationResult {
    const errors: EntityValidationError[] = [];
    const warnings: EntityValidationWarning[] = [];

    if (!entity.name?.trim()) {
      errors.push({
        entityId: entity.id,
        field: 'name',
        message: 'Story title is required',
        severity: 'error' as const
      });
    }

    const metadata = entity.metadata as Partial<Story> & MetadataRecord;
    if (typeof metadata.wordCount === 'number' && metadata.wordCount < 0) {
      errors.push({
        entityId: entity.id,
        field: 'wordCount',
        message: 'Word count cannot be negative',
        severity: 'error' as const
      });
    }

    if (metadata.targetWordCount && metadata.targetWordCount < 1000) {
      warnings.push({
        entityId: entity.id,
        message: 'Target word count seems very low',
        suggestion: 'Consider setting a higher target word count'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Chapter Adapter
export class ChapterAdapter implements EntityAdapter<Chapter> {
  fromEntity(entity: BaseEntity): Chapter {
    const metadata = entity.metadata as Partial<Chapter> & MetadataRecord;
    return {
      id: entity.id,
      storyId: metadata.storyId || '',
      title: entity.name,
      content: metadata.content || '',
      summary: entity.description || '',
      wordCount: metadata.wordCount || 0,
      status: metadata.status || 'draft',
      order: metadata.order || 0,
      characterProgression: metadata.characterProgression || [],
      scenes: metadata.scenes || [],
      characters: metadata.characters || [],
      locations: metadata.locations || [],
      plotPoints: metadata.plotPoints || [],
      notes: metadata.notes || '',
      tags: entity.tags,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  toEntity(chapter: Chapter): BaseEntity {
    return {
      id: chapter.id,
      name: chapter.title,
      type: 'chapter' as EntityType,
      description: chapter.summary || '',
      tags: chapter.tags || [],
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
      metadata: {
        storyId: chapter.storyId,
        content: chapter.content,
        wordCount: chapter.wordCount,
        status: chapter.status,
        order: chapter.order,
        characterProgression: chapter.characterProgression,
        scenes: chapter.scenes,
        characters: chapter.characters,
        locations: chapter.locations,
        plotPoints: chapter.plotPoints,
        notes: chapter.notes
      }
    };
  }

  validateEntity(entity: BaseEntity): EntityValidationResult {
    const errors: EntityValidationError[] = [];
    const warnings: EntityValidationWarning[] = [];

    if (!entity.name?.trim()) {
      errors.push({
        entityId: entity.id,
        field: 'name',
        message: 'Chapter title is required',
        severity: 'error' as const
      });
    }

    const metadata = entity.metadata as Partial<Chapter> & MetadataRecord;
    if (typeof metadata.order === 'number' && metadata.order < 0) {
      errors.push({
        entityId: entity.id,
        field: 'order',
        message: 'Chapter order cannot be negative',
        severity: 'error' as const
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Series Adapter
export class SeriesAdapter implements EntityAdapter<Series> {
  fromEntity(entity: BaseEntity): Series {
    const metadata = entity.metadata as Partial<Series> & MetadataRecord;
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      genre: metadata.genre || 'Fantasy',
      status: metadata.status || 'planning',
      books: metadata.books || [],
      sharedElements: metadata.sharedElements || {
        characters: [],
        worldBuilding: {
          timeline: [],
          worldRules: [],
          cultures: [],
          languages: [],
          religions: [],
          economics: []
        },
        magicSystems: [],
        locations: [],
        factions: [],
        terminology: []
      },
      worldBible: metadata.worldBible || {
        locations: [],
        cultures: [],
        magicSystems: [],
        timeline: [],
        rules: []
      },
      characterArcs: metadata.characterArcs || [],
      overarchingPlot: metadata.overarchingPlot || '',
      themes: metadata.themes || [],
      consistency: metadata.consistency || {
        characterContinuity: [],
        worldStateContinuity: [],
        plotContinuity: [],
        lastCheck: new Date()
      },
      metadata: (metadata.seriesMetadata as Series['metadata']) || {
        author: '',
        genres: [],
        themes: [],
        targetAudience: '',
        marketCategory: '',
        seriesLength: 0,
        marketingTags: [],
        totalWordCount: 0,
        estimatedBooks: 0,
        publishingPlan: '',
        marketingNotes: ''
      },
      tags: entity.tags,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  toEntity(series: Series): BaseEntity {
    return {
      id: series.id,
      name: series.name,
      type: 'series' as EntityType,
      description: series.description,
      tags: series.tags || [],
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
      metadata: {
        genre: series.genre,
        status: series.status,
        books: series.books,
        worldBible: series.worldBible,
        characterArcs: series.characterArcs,
        overarchingPlot: series.overarchingPlot,
        themes: series.themes,
        consistency: series.consistency,
        seriesMetadata: series.metadata
      }
    };
  }

  validateEntity(entity: BaseEntity): EntityValidationResult {
    const errors: EntityValidationError[] = [];
    const warnings: EntityValidationWarning[] = [];

    if (!entity.name?.trim()) {
      errors.push({
        entityId: entity.id,
        field: 'name',
        message: 'Series name is required',
        severity: 'error' as const
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Research Source Adapter
export class ResearchAdapter implements EntityAdapter<ResearchSource> {
  fromEntity(entity: BaseEntity): ResearchSource {
    const metadata = entity.metadata as Partial<ResearchSource> & MetadataRecord;
    return {
      id: entity.id,
      title: entity.name,
      type: (metadata.sourceType as SourceType) || 'article',
      content: metadata.content || {
        summary: entity.description || '',
        keyPoints: [],
        excerpts: [],
        media: [],
        structure: { headings: [], sections: [], references: [], figures: [], tables: [] },
        readingTime: 0,
        wordCount: 0,
        language: 'en',
        quality: {
          credibility: 5,
          accuracy: 5,
          relevance: 5,
          completeness: 5,
          freshness: 5,
          overallScore: 5,
          issues: []
        }
      },
      metadata: (metadata.sourceMetadata as ResearchSource['metadata']) || {
        author: [],
        accessDate: new Date(),
        format: 'unknown'
      },
      annotations: metadata.annotations || [],
      links: metadata.links || [],
      citations: metadata.citations || [],
      attachments: metadata.attachments || [],
      tags: entity.tags,
      collections: metadata.collections || [],
      favorited: metadata.favorited || false,
      archived: metadata.archived || false,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      lastAccessed: metadata.lastAccessed || entity.updatedAt
    };
  }

  toEntity(source: ResearchSource): BaseEntity {
    return {
      id: source.id,
      name: source.title,
      type: 'research' as EntityType,
      description: source.content.summary,
      tags: source.tags,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
      metadata: {
        sourceType: source.type,
        content: source.content,
        sourceMetadata: source.metadata,
        annotations: source.annotations,
        links: source.links,
        citations: source.citations,
        attachments: source.attachments,
        collections: source.collections,
        favorited: source.favorited,
        archived: source.archived,
        lastAccessed: source.lastAccessed
      }
    };
  }

  validateEntity(entity: BaseEntity): EntityValidationResult {
    const errors: EntityValidationError[] = [];
    const warnings: EntityValidationWarning[] = [];

    if (!entity.name?.trim()) {
      errors.push({
        entityId: entity.id,
        field: 'name',
        message: 'Research source title is required',
        severity: 'error' as const
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Loot Table Adapter
export class LootTableAdapter implements EntityAdapter<LootTable> {
  fromEntity(entity: BaseEntity): LootTable {
    const metadata = entity.metadata as Partial<LootTable> & MetadataRecord;
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      category: metadata.category || 'monster',
      type: (metadata.tableType as LootTable['type']) || metadata.type || 'simple',
      entries: metadata.entries || [],
      conditions: metadata.conditions || [],
      modifiers: metadata.modifiers || [],
      metadata: (metadata.lootMetadata as LootTable['metadata']) || {
        version: '1.0',
        author: '',
        tags: entity.tags,
        difficulty: 'normal',
        recommendedLevel: { min: 1, max: 10, optimal: 5 },
        balanceScore: 5,
        totalWeight: 0,
        expectedValue: {
          averageGoldValue: 0,
          averageItemCount: 0,
          rarityDistribution: {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            legendary: 0,
            artifact: 0,
            unique: 0
          },
          typeDistribution: {}
        },
        testResults: []
      },
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  toEntity(lootTable: LootTable): BaseEntity {
    return {
      id: lootTable.id,
      name: lootTable.name,
      type: 'lootTable' as EntityType,
      description: lootTable.description,
      tags: lootTable.metadata.tags,
      createdAt: lootTable.createdAt,
      updatedAt: lootTable.updatedAt,
      metadata: {
        category: lootTable.category,
        tableType: lootTable.type,
        entries: lootTable.entries,
        conditions: lootTable.conditions,
        modifiers: lootTable.modifiers,
        lootMetadata: lootTable.metadata
      }
    };
  }

  validateEntity(entity: BaseEntity): EntityValidationResult {
    const errors: EntityValidationError[] = [];
    const warnings: EntityValidationWarning[] = [];

    if (!entity.name?.trim()) {
      errors.push({
        entityId: entity.id,
        field: 'name',
        message: 'Loot table name is required',
        severity: 'error' as const
      });
    }

    const metadata = entity.metadata as Partial<LootTable> & MetadataRecord;
    if (!metadata.entries || metadata.entries.length === 0) {
      warnings.push({
        entityId: entity.id,
        message: 'Loot table has no entries',
        suggestion: 'Add loot entries to make this table functional'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Adapter Registry
export class AdapterRegistry {
  private adapters = new Map<EntityType, EntityAdapter<unknown>>();

  constructor() {
    this.adapters.set('character', new CharacterAdapter());
    this.adapters.set('story', new StoryAdapter());
    this.adapters.set('chapter', new ChapterAdapter());
    this.adapters.set('series', new SeriesAdapter());
    this.adapters.set('research', new ResearchAdapter());
    this.adapters.set('lootTable', new LootTableAdapter());
  }

  getAdapter<T>(type: EntityType): EntityAdapter<T> | undefined {
    return this.adapters.get(type) as EntityAdapter<T> | undefined;
  }

  registerAdapter<T>(type: EntityType, adapter: EntityAdapter<T>) {
    this.adapters.set(type, adapter);
  }

  fromEntity<T>(entity: BaseEntity): T | undefined {
    const adapter = this.getAdapter<T>(entity.type);
    return adapter ? adapter.fromEntity(entity) : undefined;
  }

  toEntity<T>(item: T, type: EntityType): BaseEntity | undefined {
    const adapter = this.getAdapter<T>(type);
    return adapter ? adapter.toEntity(item) : undefined;
  }

  validateEntity(entity: BaseEntity): EntityValidationResult {
    const adapter = this.getAdapter(entity.type);
    if (!adapter) {
      return {
        isValid: false,
        errors: [{
          entityId: entity.id,
          field: 'type',
          message: `No adapter found for entity type: ${entity.type}`,
          severity: 'error'
        }],
        warnings: []
      };
    }
    return adapter.validateEntity(entity);
  }
}

// Export singleton instance
export const adapterRegistry = new AdapterRegistry();
