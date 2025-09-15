import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Series,
  Book,
  SharedElements,
  CharacterArc,
  PlotThread,
  SeriesTimelineEvent,
  WorldRule,
  MagicSystem,
  SharedLocation,
  SharedFaction,
  SeriesTerminology,
  SeriesAnalytics,
  BookAppearance,
  CharacterDevelopment,
  CrossBookRelationship
} from '../types/series';
import type { Character } from '../types/character';

interface SeriesState {
  series: Series[];
  currentSeries: Series | null;
  currentBook: Book | null;
  analytics: Map<string, SeriesAnalytics>;
}

interface SeriesActions {
  // Series Management
  createSeries: (seriesData: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>) => Series;
  updateSeries: (seriesId: string, updates: Partial<Series>) => void;
  deleteSeries: (seriesId: string) => void;
  setCurrentSeries: (series: Series | null) => void;

  // Book Management
  addBookToSeries: (seriesId: string, bookData: Omit<Book, 'id' | 'seriesId' | 'createdAt' | 'updatedAt'>) => Book;
  updateBook: (bookId: string, updates: Partial<Book>) => void;
  deleteBook: (bookId: string) => void;
  reorderBooks: (seriesId: string, bookIds: string[]) => void;
  setCurrentBook: (book: Book | null) => void;

  // Character Management
  addCharacterToSeries: (seriesId: string, character: Character, appearance: BookAppearance) => void;
  updateCharacterInSeries: (seriesId: string, characterId: string, updates: Partial<SharedElements['characters'][0]>) => void;
  removeCharacterFromSeries: (seriesId: string, characterId: string) => void;
  addCharacterAppearance: (seriesId: string, characterId: string, appearance: BookAppearance) => void;
  updateCharacterDevelopment: (seriesId: string, characterId: string, bookNumber: number, development: CharacterDevelopment) => void;
  addCharacterRelationship: (seriesId: string, characterId: string, relationship: CrossBookRelationship) => void;

  // World Building
  addWorldRule: (seriesId: string, rule: Omit<WorldRule, 'id'>) => void;
  updateWorldRule: (seriesId: string, ruleId: string, updates: Partial<WorldRule>) => void;
  removeWorldRule: (seriesId: string, ruleId: string) => void;

  addMagicSystem: (seriesId: string, system: Omit<MagicSystem, 'id'>) => void;
  updateMagicSystem: (seriesId: string, systemId: string, updates: Partial<MagicSystem>) => void;
  removeMagicSystem: (seriesId: string, systemId: string) => void;

  addLocation: (seriesId: string, location: Omit<SharedLocation, 'id'>) => void;
  updateLocation: (seriesId: string, locationId: string, updates: Partial<SharedLocation>) => void;
  removeLocation: (seriesId: string, locationId: string) => void;

  addFaction: (seriesId: string, faction: Omit<SharedFaction, 'id'>) => void;
  updateFaction: (seriesId: string, factionId: string, updates: Partial<SharedFaction>) => void;
  removeFaction: (seriesId: string, factionId: string) => void;

  // Timeline Management
  addTimelineEvent: (seriesId: string, event: Omit<SeriesTimelineEvent, 'id'>) => void;
  updateTimelineEvent: (seriesId: string, eventId: string, updates: Partial<SeriesTimelineEvent>) => void;
  removeTimelineEvent: (seriesId: string, eventId: string) => void;

  // Terminology
  addTerm: (seriesId: string, term: Omit<SeriesTerminology, 'id'>) => void;
  updateTerm: (seriesId: string, termId: string, updates: Partial<SeriesTerminology>) => void;
  removeTerm: (seriesId: string, termId: string) => void;

  // Plot Threads
  addPlotThread: (bookId: string, thread: Omit<PlotThread, 'id'>) => void;
  updatePlotThread: (bookId: string, threadId: string, updates: Partial<PlotThread>) => void;
  removePlotThread: (bookId: string, threadId: string) => void;

  // Character Arcs
  addCharacterArc: (bookId: string, arc: Omit<CharacterArc, 'id'>) => void;
  updateCharacterArc: (bookId: string, arcId: string, updates: Partial<CharacterArc>) => void;
  removeCharacterArc: (bookId: string, arcId: string) => void;

  // Analytics
  generateSeriesAnalytics: (seriesId: string) => SeriesAnalytics;
  getSeriesAnalytics: (seriesId: string) => SeriesAnalytics | null;

  // Cross-Book Consistency
  checkConsistency: (seriesId: string) => ConsistencyIssue[];
  validateCharacterProgression: (seriesId: string, characterId: string) => ProgressionValidation;

  // Utilities
  exportSeries: (seriesId: string) => string;
  importSeries: (data: string) => Series;
  clearAll: () => void;
}

interface ConsistencyIssue {
  id: string;
  type: 'character' | 'worldbuilding' | 'plot' | 'timeline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  books: number[];
  suggestion?: string;
}

interface ProgressionValidation {
  valid: boolean;
  issues: string[];
  suggestions: string[];
  levelProgression: { book: number; level: number }[];
}

type SeriesStore = SeriesState & SeriesActions;

const generateId = () => crypto.randomUUID();

export const useSeriesStore = create<SeriesStore>()(
  persist(
    (set, get) => ({
      // State
      series: [],
      currentSeries: null,
      currentBook: null,
      analytics: new Map(),

      // Series Management
      createSeries: (seriesData) => {
        const newSeries: Series = {
          ...seriesData,
          id: generateId(),
          books: [],
          sharedElements: {
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
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set((state) => ({
          series: [...state.series, newSeries],
          currentSeries: newSeries
        }));

        return newSeries;
      },

      updateSeries: (seriesId, updates) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId ? { ...s, ...updates, updatedAt: new Date() } : s
          ),
          currentSeries: state.currentSeries?.id === seriesId
            ? { ...state.currentSeries, ...updates, updatedAt: new Date() }
            : state.currentSeries
        })),

      deleteSeries: (seriesId) =>
        set((state) => ({
          series: state.series.filter(s => s.id !== seriesId),
          currentSeries: state.currentSeries?.id === seriesId ? null : state.currentSeries,
          analytics: new Map([...state.analytics].filter(([id]) => id !== seriesId))
        })),

      setCurrentSeries: (series) => set({ currentSeries: series }),

      // Book Management
      addBookToSeries: (seriesId, bookData) => {
        const newBook: Book = {
          ...bookData,
          id: generateId(),
          seriesId,
          currentWordCount: 0,
          stories: [],
          characterArcs: [],
          plotThreads: [],
          timelineEvents: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  books: [...s.books, newBook].sort((a, b) => a.bookNumber - b.bookNumber),
                  updatedAt: new Date()
                }
              : s
          ),
          currentSeries: state.currentSeries?.id === seriesId
            ? {
                ...state.currentSeries,
                books: [...state.currentSeries.books, newBook].sort((a, b) => a.bookNumber - b.bookNumber),
                updatedAt: new Date()
              }
            : state.currentSeries
        }));

        return newBook;
      },

      updateBook: (bookId, updates) =>
        set((state) => ({
          series: state.series.map(s => ({
            ...s,
            books: s.books.map(b =>
              b.id === bookId ? { ...b, ...updates, updatedAt: new Date() } : b
            )
          })),
          currentBook: state.currentBook?.id === bookId
            ? { ...state.currentBook, ...updates, updatedAt: new Date() }
            : state.currentBook
        })),

      deleteBook: (bookId) =>
        set((state) => ({
          series: state.series.map(s => ({
            ...s,
            books: s.books.filter(b => b.id !== bookId)
          })),
          currentBook: state.currentBook?.id === bookId ? null : state.currentBook
        })),

      reorderBooks: (seriesId, bookIds) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  books: bookIds.map((id, index) => {
                    const book = s.books.find(b => b.id === id);
                    return book ? { ...book, bookNumber: index + 1 } : book!;
                  }).filter(Boolean),
                  updatedAt: new Date()
                }
              : s
          )
        })),

      setCurrentBook: (book) => set({ currentBook: book }),

      // Character Management
      addCharacterToSeries: (seriesId, character, appearance) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    characters: [
                      ...s.sharedElements.characters,
                      {
                        characterId: character.id,
                        character,
                        appearances: [appearance],
                        developmentArc: [],
                        relationships: []
                      }
                    ]
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      updateCharacterInSeries: (seriesId, characterId, updates) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    characters: s.sharedElements.characters.map(sc =>
                      sc.characterId === characterId ? { ...sc, ...updates } : sc
                    )
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      removeCharacterFromSeries: (seriesId, characterId) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    characters: s.sharedElements.characters.filter(sc => sc.characterId !== characterId)
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      addCharacterAppearance: (seriesId, characterId, appearance) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    characters: s.sharedElements.characters.map(sc =>
                      sc.characterId === characterId
                        ? { ...sc, appearances: [...sc.appearances, appearance] }
                        : sc
                    )
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      updateCharacterDevelopment: (seriesId, characterId, bookNumber, development) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    characters: s.sharedElements.characters.map(sc =>
                      sc.characterId === characterId
                        ? {
                            ...sc,
                            developmentArc: [
                              ...sc.developmentArc.filter(d => d.bookNumber !== bookNumber),
                              development
                            ].sort((a, b) => a.bookNumber - b.bookNumber)
                          }
                        : sc
                    )
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      addCharacterRelationship: (seriesId, characterId, relationship) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    characters: s.sharedElements.characters.map(sc =>
                      sc.characterId === characterId
                        ? { ...sc, relationships: [...sc.relationships, relationship] }
                        : sc
                    )
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      // World Building
      addWorldRule: (seriesId, rule) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    worldBuilding: {
                      ...s.sharedElements.worldBuilding,
                      worldRules: [...s.sharedElements.worldBuilding.worldRules, { ...rule, id: generateId() }]
                    }
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      updateWorldRule: (seriesId, ruleId, updates) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    worldBuilding: {
                      ...s.sharedElements.worldBuilding,
                      worldRules: s.sharedElements.worldBuilding.worldRules.map(r =>
                        r.id === ruleId ? { ...r, ...updates } : r
                      )
                    }
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      removeWorldRule: (seriesId, ruleId) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    worldBuilding: {
                      ...s.sharedElements.worldBuilding,
                      worldRules: s.sharedElements.worldBuilding.worldRules.filter(r => r.id !== ruleId)
                    }
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      addMagicSystem: (seriesId, system) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    magicSystems: [...s.sharedElements.magicSystems, { ...system, id: generateId() }]
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      updateMagicSystem: (seriesId, systemId, updates) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    magicSystems: s.sharedElements.magicSystems.map(ms =>
                      ms.id === systemId ? { ...ms, ...updates } : ms
                    )
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      removeMagicSystem: (seriesId, systemId) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    magicSystems: s.sharedElements.magicSystems.filter(ms => ms.id !== systemId)
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      addLocation: (seriesId, location) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    locations: [...s.sharedElements.locations, { ...location, id: generateId() }]
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      updateLocation: (seriesId, locationId, updates) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    locations: s.sharedElements.locations.map(l =>
                      l.id === locationId ? { ...l, ...updates } : l
                    )
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      removeLocation: (seriesId, locationId) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    locations: s.sharedElements.locations.filter(l => l.id !== locationId)
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      addFaction: (seriesId, faction) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    factions: [...s.sharedElements.factions, { ...faction, id: generateId() }]
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      updateFaction: (seriesId, factionId, updates) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    factions: s.sharedElements.factions.map(f =>
                      f.id === factionId ? { ...f, ...updates } : f
                    )
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      removeFaction: (seriesId, factionId) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    factions: s.sharedElements.factions.filter(f => f.id !== factionId)
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      // Timeline Management
      addTimelineEvent: (seriesId, event) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    worldBuilding: {
                      ...s.sharedElements.worldBuilding,
                      timeline: [...s.sharedElements.worldBuilding.timeline, { ...event, id: generateId() }]
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    }
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      updateTimelineEvent: (seriesId, eventId, updates) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    worldBuilding: {
                      ...s.sharedElements.worldBuilding,
                      timeline: s.sharedElements.worldBuilding.timeline.map(e =>
                        e.id === eventId ? { ...e, ...updates } : e
                      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    }
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      removeTimelineEvent: (seriesId, eventId) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    worldBuilding: {
                      ...s.sharedElements.worldBuilding,
                      timeline: s.sharedElements.worldBuilding.timeline.filter(e => e.id !== eventId)
                    }
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      // Terminology
      addTerm: (seriesId, term) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    terminology: [...s.sharedElements.terminology, { ...term, id: generateId() }]
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      updateTerm: (seriesId, termId, updates) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    terminology: s.sharedElements.terminology.map(t =>
                      t.id === termId ? { ...t, ...updates } : t
                    )
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      removeTerm: (seriesId, termId) =>
        set((state) => ({
          series: state.series.map(s =>
            s.id === seriesId
              ? {
                  ...s,
                  sharedElements: {
                    ...s.sharedElements,
                    terminology: s.sharedElements.terminology.filter(t => t.id !== termId)
                  },
                  updatedAt: new Date()
                }
              : s
          )
        })),

      // Plot Threads
      addPlotThread: (bookId, thread) =>
        set((state) => ({
          series: state.series.map(s => ({
            ...s,
            books: s.books.map(b =>
              b.id === bookId
                ? { ...b, plotThreads: [...b.plotThreads, { ...thread, id: generateId() }] }
                : b
            )
          }))
        })),

      updatePlotThread: (bookId, threadId, updates) =>
        set((state) => ({
          series: state.series.map(s => ({
            ...s,
            books: s.books.map(b =>
              b.id === bookId
                ? {
                    ...b,
                    plotThreads: b.plotThreads.map(pt =>
                      pt.id === threadId ? { ...pt, ...updates } : pt
                    )
                  }
                : b
            )
          }))
        })),

      removePlotThread: (bookId, threadId) =>
        set((state) => ({
          series: state.series.map(s => ({
            ...s,
            books: s.books.map(b =>
              b.id === bookId
                ? { ...b, plotThreads: b.plotThreads.filter(pt => pt.id !== threadId) }
                : b
            )
          }))
        })),

      // Character Arcs
      addCharacterArc: (bookId, arc) =>
        set((state) => ({
          series: state.series.map(s => ({
            ...s,
            books: s.books.map(b =>
              b.id === bookId
                ? { ...b, characterArcs: [...b.characterArcs, { ...arc, id: generateId() }] }
                : b
            )
          }))
        })),

      updateCharacterArc: (bookId, arcId, updates) =>
        set((state) => ({
          series: state.series.map(s => ({
            ...s,
            books: s.books.map(b =>
              b.id === bookId
                ? {
                    ...b,
                    characterArcs: b.characterArcs.map(ca =>
                      ca.id === arcId ? { ...ca, ...updates } : ca
                    )
                  }
                : b
            )
          }))
        })),

      removeCharacterArc: (bookId, arcId) =>
        set((state) => ({
          series: state.series.map(s => ({
            ...s,
            books: s.books.map(b =>
              b.id === bookId
                ? { ...b, characterArcs: b.characterArcs.filter(ca => ca.id !== arcId) }
                : b
            )
          }))
        })),

      // Analytics
      generateSeriesAnalytics: (seriesId) => {
        const state = get();
        const series = state.series.find(s => s.id === seriesId);
        if (!series) throw new Error('Series not found');

        const analytics: SeriesAnalytics = {
          seriesId,
          totalWordCount: series.books.reduce((sum, book) => sum + book.currentWordCount, 0),
          averageBookLength: series.books.length > 0
            ? series.books.reduce((sum, book) => sum + book.currentWordCount, 0) / series.books.length
            : 0,
          completionRate: series.books.length > 0
            ? series.books.filter(book => book.status === 'published').length / series.books.length
            : 0,
          characterCount: series.sharedElements.characters.length,
          locationCount: series.sharedElements.locations.length,
          plotThreadCount: series.books.reduce((sum, book) => sum + book.plotThreads.length, 0),
          consistencyScore: 85, // Placeholder - would need real consistency analysis
          readabilityScore: 75, // Placeholder - would need real readability analysis
          pacing: {
            overallPace: 'moderate',
            actionScenes: 0,
            dialogueScenes: 0,
            descriptionScenes: 0,
            paceByBook: []
          },
          characterDevelopment: series.sharedElements.characters.map(char => ({
            characterId: char.characterId,
            screenTime: char.appearances.length,
            developmentArc: char.developmentArc.length,
            relationshipComplexity: char.relationships.length,
            importanceScore: char.appearances.reduce((sum, app) => {
              const score = app.role === 'main' ? 5 : app.role === 'supporting' ? 3 : app.role === 'minor' ? 1 : 0.5;
              return sum + score;
            }, 0)
          })),
          worldBuildingDepth: {
            depth: series.sharedElements.worldBuilding.worldRules.length * 0.1,
            consistency: 0.8,
            complexity: (series.sharedElements.magicSystems.length + series.sharedElements.factions.length) * 0.1,
            originality: 0.7,
            integration: 0.8
          }
        };

        set((state) => ({
          analytics: new Map(state.analytics.set(seriesId, analytics))
        }));

        return analytics;
      },

      getSeriesAnalytics: (seriesId) => {
        const state = get();
        return state.analytics.get(seriesId) || null;
      },

      // Cross-Book Consistency
      checkConsistency: (seriesId) => {
        const state = get();
        const series = state.series.find(s => s.id === seriesId);
        if (!series) return [];

        const issues: ConsistencyIssue[] = [];

        // Check character level progression consistency
        series.sharedElements.characters.forEach(character => {
          const developments = character.developmentArc.sort((a, b) => a.bookNumber - b.bookNumber);
          for (let i = 1; i < developments.length; i++) {
            if (developments[i].startingLevel < developments[i - 1].endingLevel) {
              issues.push({
                id: generateId(),
                type: 'character',
                severity: 'high',
                description: `${character.character.name} has inconsistent level progression between books ${developments[i - 1].bookNumber} and ${developments[i].bookNumber}`,
                books: [developments[i - 1].bookNumber, developments[i].bookNumber],
                suggestion: 'Review character level progression and ensure consistency across books'
              });
            }
          }
        });

        // Check world rule consistency
        series.sharedElements.worldBuilding.worldRules.forEach(rule => {
          const contradictoryRefs = rule.references.filter(ref => ref.importance === 'breaks');
          if (contradictoryRefs.length > 0 && !rule.exceptions.length) {
            issues.push({
              id: generateId(),
              type: 'worldbuilding',
              severity: 'high',
              description: `World rule "${rule.name}" is broken in some books but has no documented exceptions`,
              books: contradictoryRefs.map(ref => ref.bookNumber),
              suggestion: 'Add exceptions to the world rule or fix the contradictions'
            });
          }
        });

        return issues;
      },

      validateCharacterProgression: (seriesId, characterId) => {
        const state = get();
        const series = state.series.find(s => s.id === seriesId);
        const character = series?.sharedElements.characters.find(c => c.characterId === characterId);

        if (!character) {
          return {
            valid: false,
            issues: ['Character not found in series'],
            suggestions: [],
            levelProgression: []
          };
        }

        const issues: string[] = [];
        const suggestions: string[] = [];
        const levelProgression = character.developmentArc
          .sort((a, b) => a.bookNumber - b.bookNumber)
          .map(dev => ({ book: dev.bookNumber, level: dev.endingLevel }));

        // Check for level regression
        for (let i = 1; i < levelProgression.length; i++) {
          if (levelProgression[i].level < levelProgression[i - 1].level) {
            issues.push(`Level decreases from book ${levelProgression[i - 1].book} to ${levelProgression[i].book}`);
            suggestions.push('Ensure character levels only increase or stay the same across books');
          }
        }

        // Check for unrealistic level jumps
        for (let i = 1; i < levelProgression.length; i++) {
          const levelGain = levelProgression[i].level - levelProgression[i - 1].level;
          if (levelGain > 20) {
            issues.push(`Large level jump (+${levelGain}) between books ${levelProgression[i - 1].book} and ${levelProgression[i].book}`);
            suggestions.push('Consider more gradual level progression between books');
          }
        }

        return {
          valid: issues.length === 0,
          issues,
          suggestions,
          levelProgression
        };
      },

      // Utilities
      exportSeries: (seriesId) => {
        const state = get();
        const series = state.series.find(s => s.id === seriesId);
        if (!series) throw new Error('Series not found');
        return JSON.stringify(series, null, 2);
      },

      importSeries: (data) => {
        try {
          const series = JSON.parse(data) as Series;
          set((state) => ({
            series: [...state.series, series]
          }));
          return series;
        } catch (error) {
          throw new Error('Invalid series data');
        }
      },

      clearAll: () =>
        set({
          series: [],
          currentSeries: null,
          currentBook: null,
          analytics: new Map()
        })
    }),
    {
      name: 'litrpg-series-storage',
      partialize: (state) => ({
        series: state.series,
        analytics: Array.from(state.analytics.entries())
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert Array back to Map after deserialization
          state.analytics = new Map(state.analytics as [string, SeriesAnalytics][]);
        }
      }
    }
  )
);