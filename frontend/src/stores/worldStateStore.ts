import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WorldState,
  CharacterState,
  LocationState,
  ItemState,
  EventState,
  WorldProperty,
  StateChange,
  ConsistencyResult,
  ValidationRule,
  WorldStateSnapshot,
  CharacterStatus
} from '../types/worldState';

interface WorldStateStoreState {
  worldStates: Map<string, WorldState[]>; // storyId -> WorldState[]
  currentWorldState: WorldState | null;
  validationRules: ValidationRule[];
  snapshots: WorldStateSnapshot[];
}

interface WorldStateStoreActions {
  // World State Management
  createWorldState: (storyId: string, chapterId?: string, chapterNumber?: number) => WorldState;
  updateWorldState: (worldStateId: string, updates: Partial<WorldState>) => void;
  getWorldStateHistory: (storyId: string) => WorldState[];
  getCurrentWorldState: (storyId: string) => WorldState | null;
  setCurrentWorldState: (worldState: WorldState) => void;
  revertToWorldState: (worldStateId: string) => void;

  // Character State Management
  updateCharacterState: (worldStateId: string, characterId: string, updates: Partial<CharacterState>) => void;
  setCharacterLocation: (worldStateId: string, characterId: string, locationId: string) => void;
  setCharacterStatus: (worldStateId: string, characterId: string, status: CharacterStatus) => void;
  addCharacterFlag: (worldStateId: string, characterId: string, flag: string, value: boolean) => void;
  updateCharacterRelationship: (worldStateId: string, characterId: string, targetId: string, strength: number) => void;

  // Location State Management
  updateLocationState: (worldStateId: string, locationId: string, updates: Partial<LocationState>) => void;
  addLocationOccupant: (worldStateId: string, locationId: string, characterId: string) => void;
  removeLocationOccupant: (worldStateId: string, locationId: string, characterId: string) => void;
  setLocationProperty: (worldStateId: string, locationId: string, property: string, value: unknown) => void;

  // Item State Management
  updateItemState: (worldStateId: string, itemId: string, updates: Partial<ItemState>) => void;
  transferItem: (worldStateId: string, itemId: string, toCharacterId?: string, toLocationId?: string) => void;
  destroyItem: (worldStateId: string, itemId: string, reason: string) => void;

  // Event State Management
  updateEventState: (worldStateId: string, eventId: string, updates: Partial<EventState>) => void;
  addEventParticipant: (worldStateId: string, eventId: string, characterId: string) => void;
  completeEvent: (worldStateId: string, eventId: string, consequences: string[]) => void;

  // World Properties
  setWorldProperty: (worldStateId: string, key: string, value: unknown, reason: string) => void;
  getWorldProperty: (worldStateId: string, key: string) => unknown;
  removeWorldProperty: (worldStateId: string, key: string, reason: string) => void;

  // Validation & Consistency
  addValidationRule: (rule: ValidationRule) => void;
  removeValidationRule: (ruleId: string) => void;
  updateValidationRule: (ruleId: string, updates: Partial<ValidationRule>) => void;
  runConsistencyCheck: (worldStateId: string, previousWorldStateId?: string) => ConsistencyResult[];
  resolveConsistencyIssue: (worldStateId: string, issueId: string, resolution: string) => void;

  // Snapshots
  createSnapshot: (worldStateId: string, description: string, tags?: string[]) => void;
  restoreFromSnapshot: (snapshotId: string) => void;
  deleteSnapshot: (snapshotId: string) => void;

  // Utilities
  cloneWorldState: (worldStateId: string) => WorldState;
  compareWorldStates: (stateId1: string, stateId2: string) => StateChange[];
  exportWorldState: (worldStateId: string) => string;
  importWorldState: (data: string) => WorldState;
  clearAll: () => void;
}

type WorldStateStore = WorldStateStoreState & WorldStateStoreActions;

const generateId = () => crypto.randomUUID();

export const useWorldStateStore = create<WorldStateStore>()(
  persist(
    (set, get) => ({
      // State
      worldStates: new Map(),
      currentWorldState: null,
      validationRules: [],
      snapshots: [],

      // World State Management
      createWorldState: (storyId, chapterId, chapterNumber = 1) => {
        const newWorldState: WorldState = {
          id: generateId(),
          storyId,
          chapterId,
          chapterNumber,
          timestamp: new Date(),
          state: {
            characters: [],
            locations: [],
            items: [],
            events: [],
            worldProperties: []
          },
          changeLog: [],
          consistencyChecks: []
        };

        set((state) => {
          const storyStates = state.worldStates.get(storyId) || [];
          const updatedWorldStates = new Map(state.worldStates);
          updatedWorldStates.set(storyId, [...storyStates, newWorldState]);

          return {
            worldStates: updatedWorldStates,
            currentWorldState: newWorldState
          };
        });

        return newWorldState;
      },

      updateWorldState: (worldStateId, updates) =>
        set((state) => {
          const updatedWorldStates = new Map(state.worldStates);

          for (const [storyId, storyStates] of updatedWorldStates) {
            const stateIndex = storyStates.findIndex(ws => ws.id === worldStateId);
            if (stateIndex !== -1) {
              const updatedStates = [...storyStates];
              updatedStates[stateIndex] = {
                ...updatedStates[stateIndex],
                ...updates,
                timestamp: new Date()
              };
              updatedWorldStates.set(storyId, updatedStates);

              return {
                worldStates: updatedWorldStates,
                currentWorldState: state.currentWorldState?.id === worldStateId
                  ? updatedStates[stateIndex]
                  : state.currentWorldState
              };
            }
          }
          return state;
        }),

      getWorldStateHistory: (storyId) => {
        const state = get();
        return state.worldStates.get(storyId) || [];
      },

      getCurrentWorldState: (storyId) => {
        const state = get();
        const storyStates = state.worldStates.get(storyId) || [];
        return storyStates[storyStates.length - 1] || null;
      },

      setCurrentWorldState: (worldState) =>
        set({ currentWorldState: worldState }),

      revertToWorldState: (worldStateId) => {
        const state = get();
        for (const storyStates of state.worldStates.values()) {
          const targetState = storyStates.find(ws => ws.id === worldStateId);
          if (targetState) {
            const newState = get().cloneWorldState(worldStateId);
            newState.id = generateId();
            newState.timestamp = new Date();

            const updatedWorldStates = new Map(state.worldStates);
            const currentStoryStates = updatedWorldStates.get(targetState.storyId) || [];
            updatedWorldStates.set(targetState.storyId, [...currentStoryStates, newState]);

            set({
              worldStates: updatedWorldStates,
              currentWorldState: newState
            });
            break;
          }
        }
      },

      // Character State Management
      updateCharacterState: (worldStateId, characterId, updates) => {
        const state = get();
        state.updateWorldState(worldStateId, {});

        set((currentState) => {
          const updatedWorldStates = new Map(currentState.worldStates);

          for (const [storyId, storyStates] of updatedWorldStates) {
            const stateIndex = storyStates.findIndex(ws => ws.id === worldStateId);
            if (stateIndex !== -1) {
              const worldState = storyStates[stateIndex];
              const characterIndex = worldState.state.characters.findIndex(c => c.characterId === characterId);

              if (characterIndex !== -1) {
                const updatedStates = [...storyStates];
                const updatedCharacters = [...worldState.state.characters];
                const oldCharacterState = updatedCharacters[characterIndex];

                updatedCharacters[characterIndex] = {
                  ...oldCharacterState,
                  ...updates
                };

                // Log the change
                const change: StateChange = {
                  id: generateId(),
                  timestamp: new Date(),
                  chapterNumber: worldState.chapterNumber,
                  changeType: 'character',
                  targetId: characterId,
                  property: 'state',
                  oldValue: oldCharacterState,
                  newValue: updatedCharacters[characterIndex],
                  reason: 'Character state update',
                  automatic: false
                };

                updatedStates[stateIndex] = {
                  ...worldState,
                  state: {
                    ...worldState.state,
                    characters: updatedCharacters
                  },
                  changeLog: [...worldState.changeLog, change],
                  timestamp: new Date()
                };

                updatedWorldStates.set(storyId, updatedStates);
                break;
              }
            }
          }

          return { worldStates: updatedWorldStates };
        });
      },

      setCharacterLocation: (worldStateId, characterId, locationId) => {
        get().updateCharacterState(worldStateId, characterId, { location: locationId });

        // Update location occupancy
        set((state) => {
          const updatedWorldStates = new Map(state.worldStates);

          for (const [storyId, storyStates] of updatedWorldStates) {
            const stateIndex = storyStates.findIndex(ws => ws.id === worldStateId);
            if (stateIndex !== -1) {
              const worldState = storyStates[stateIndex];
              const updatedStates = [...storyStates];
              const updatedLocations = worldState.state.locations.map(location => {
                // Remove character from all locations
                const currentOccupants = location.currentOccupants.filter(id => id !== characterId);

                // Add character to new location
                if (location.locationId === locationId) {
                  return {
                    ...location,
                    currentOccupants: [...currentOccupants, characterId]
                  };
                } else {
                  return {
                    ...location,
                    currentOccupants
                  };
                }
              });

              updatedStates[stateIndex] = {
                ...worldState,
                state: {
                  ...worldState.state,
                  locations: updatedLocations
                }
              };

              updatedWorldStates.set(storyId, updatedStates);
              break;
            }
          }

          return { worldStates: updatedWorldStates };
        });
      },

      setCharacterStatus: (worldStateId, characterId, status) =>
        get().updateCharacterState(worldStateId, characterId, { status }),

      addCharacterFlag: (worldStateId, characterId, flag, value) => {
        const state = get();
        for (const storyStates of state.worldStates.values()) {
          const worldState = storyStates.find(ws => ws.id === worldStateId);
          if (worldState) {
            const character = worldState.state.characters.find(c => c.characterId === characterId);
            if (character) {
              const updatedFlags = { ...character.flags, [flag]: value };
              state.updateCharacterState(worldStateId, characterId, { flags: updatedFlags });
              break;
            }
          }
        }
      },

      updateCharacterRelationship: (worldStateId, characterId, targetId, strength) => {
        const state = get();
        for (const storyStates of state.worldStates.values()) {
          const worldState = storyStates.find(ws => ws.id === worldStateId);
          if (worldState) {
            const character = worldState.state.characters.find(c => c.characterId === characterId);
            if (character) {
              const updatedRelationships = { ...character.relationships, [targetId]: strength };
              state.updateCharacterState(worldStateId, characterId, { relationships: updatedRelationships });
              break;
            }
          }
        }
      },

      // Location State Management
      updateLocationState: (worldStateId, locationId, updates) => {
        set((state) => {
          const updatedWorldStates = new Map(state.worldStates);

          for (const [storyId, storyStates] of updatedWorldStates) {
            const stateIndex = storyStates.findIndex(ws => ws.id === worldStateId);
            if (stateIndex !== -1) {
              const worldState = storyStates[stateIndex];
              const locationIndex = worldState.state.locations.findIndex(l => l.locationId === locationId);

              if (locationIndex !== -1) {
                const updatedStates = [...storyStates];
                const updatedLocations = [...worldState.state.locations];

                updatedLocations[locationIndex] = {
                  ...updatedLocations[locationIndex],
                  ...updates
                };

                updatedStates[stateIndex] = {
                  ...worldState,
                  state: {
                    ...worldState.state,
                    locations: updatedLocations
                  },
                  timestamp: new Date()
                };

                updatedWorldStates.set(storyId, updatedStates);
                break;
              }
            }
          }

          return { worldStates: updatedWorldStates };
        });
      },

      addLocationOccupant: (worldStateId, locationId, characterId) => {
        const state = get();
        for (const storyStates of state.worldStates.values()) {
          const worldState = storyStates.find(ws => ws.id === worldStateId);
          if (worldState) {
            const location = worldState.state.locations.find(l => l.locationId === locationId);
            if (location && !location.currentOccupants.includes(characterId)) {
              const updatedOccupants = [...location.currentOccupants, characterId];
              state.updateLocationState(worldStateId, locationId, { currentOccupants: updatedOccupants });
              break;
            }
          }
        }
      },

      removeLocationOccupant: (worldStateId, locationId, characterId) => {
        const state = get();
        for (const storyStates of state.worldStates.values()) {
          const worldState = storyStates.find(ws => ws.id === worldStateId);
          if (worldState) {
            const location = worldState.state.locations.find(l => l.locationId === locationId);
            if (location) {
              const updatedOccupants = location.currentOccupants.filter(id => id !== characterId);
              state.updateLocationState(worldStateId, locationId, { currentOccupants: updatedOccupants });
              break;
            }
          }
        }
      },

      setLocationProperty: (worldStateId, locationId, property, value) => {
        const state = get();
        for (const storyStates of state.worldStates.values()) {
          const worldState = storyStates.find(ws => ws.id === worldStateId);
          if (worldState) {
            const location = worldState.state.locations.find(l => l.locationId === locationId);
            if (location) {
              const updatedProperties = { ...location.properties, [property]: value };
              state.updateLocationState(worldStateId, locationId, { properties: updatedProperties });
              break;
            }
          }
        }
      },

      // Item State Management
      updateItemState: (worldStateId, itemId, updates) => {
        set((state) => {
          const updatedWorldStates = new Map(state.worldStates);

          for (const [storyId, storyStates] of updatedWorldStates) {
            const stateIndex = storyStates.findIndex(ws => ws.id === worldStateId);
            if (stateIndex !== -1) {
              const worldState = storyStates[stateIndex];
              const itemIndex = worldState.state.items.findIndex(i => i.itemId === itemId);

              if (itemIndex !== -1) {
                const updatedStates = [...storyStates];
                const updatedItems = [...worldState.state.items];

                updatedItems[itemIndex] = {
                  ...updatedItems[itemIndex],
                  ...updates
                };

                updatedStates[stateIndex] = {
                  ...worldState,
                  state: {
                    ...worldState.state,
                    items: updatedItems
                  },
                  timestamp: new Date()
                };

                updatedWorldStates.set(storyId, updatedStates);
                break;
              }
            }
          }

          return { worldStates: updatedWorldStates };
        });
      },

      transferItem: (worldStateId, itemId, toCharacterId, toLocationId) => {
        if (toCharacterId && toLocationId) {
          console.error('Item cannot be transferred to both character and location');
          return;
        }

        const updates: Partial<ItemState> = toCharacterId
          ? { location: 'character', ownerId: toCharacterId, locationId: undefined }
          : { location: 'location', ownerId: undefined, locationId: toLocationId };

        get().updateItemState(worldStateId, itemId, updates);
      },

      destroyItem: (worldStateId, itemId, _reason) =>
        get().updateItemState(worldStateId, itemId, {
          location: 'destroyed',
          ownerId: undefined,
          locationId: undefined
        }),

      // Event State Management
      updateEventState: (worldStateId, eventId, updates) => {
        set((state) => {
          const updatedWorldStates = new Map(state.worldStates);

          for (const [storyId, storyStates] of updatedWorldStates) {
            const stateIndex = storyStates.findIndex(ws => ws.id === worldStateId);
            if (stateIndex !== -1) {
              const worldState = storyStates[stateIndex];
              const eventIndex = worldState.state.events.findIndex(e => e.eventId === eventId);

              if (eventIndex !== -1) {
                const updatedStates = [...storyStates];
                const updatedEvents = [...worldState.state.events];

                updatedEvents[eventIndex] = {
                  ...updatedEvents[eventIndex],
                  ...updates
                };

                updatedStates[stateIndex] = {
                  ...worldState,
                  state: {
                    ...worldState.state,
                    events: updatedEvents
                  },
                  timestamp: new Date()
                };

                updatedWorldStates.set(storyId, updatedStates);
                break;
              }
            }
          }

          return { worldStates: updatedWorldStates };
        });
      },

      addEventParticipant: (worldStateId, eventId, characterId) => {
        const state = get();
        for (const storyStates of state.worldStates.values()) {
          const worldState = storyStates.find(ws => ws.id === worldStateId);
          if (worldState) {
            const event = worldState.state.events.find(e => e.eventId === eventId);
            if (event && !event.participants.includes(characterId)) {
              const updatedParticipants = [...event.participants, characterId];
              state.updateEventState(worldStateId, eventId, { participants: updatedParticipants });
              break;
            }
          }
        }
      },

      completeEvent: (worldStateId, eventId, consequences) =>
        get().updateEventState(worldStateId, eventId, {
          status: 'completed',
          consequences,
          endChapter: get().worldStates.get('')?.find(ws => ws.id === worldStateId)?.chapterNumber
        }),

      // World Properties
      setWorldProperty: (worldStateId, key, value, reason) => {
        set((state) => {
          const updatedWorldStates = new Map(state.worldStates);

          for (const [storyId, storyStates] of updatedWorldStates) {
            const stateIndex = storyStates.findIndex(ws => ws.id === worldStateId);
            if (stateIndex !== -1) {
              const worldState = storyStates[stateIndex];
              const updatedStates = [...storyStates];

              const existingPropIndex = worldState.state.worldProperties.findIndex(p => p.key === key);
              const updatedProperties = [...worldState.state.worldProperties];

              const newProperty: WorldProperty = {
                key,
                value,
                type: (
                  typeof value === 'string' ||
                  typeof value === 'number' ||
                  typeof value === 'boolean'
                ) ? typeof value : 'object',
                description: reason,
                lastChanged: new Date(),
                changeReason: reason
              };

              if (existingPropIndex !== -1) {
                updatedProperties[existingPropIndex] = newProperty;
              } else {
                updatedProperties.push(newProperty);
              }

              updatedStates[stateIndex] = {
                ...worldState,
                state: {
                  ...worldState.state,
                  worldProperties: updatedProperties
                },
                timestamp: new Date()
              };

              updatedWorldStates.set(storyId, updatedStates);
              break;
            }
          }

          return { worldStates: updatedWorldStates };
        });
      },

      getWorldProperty: (worldStateId, key) => {
        const state = get();
        for (const storyStates of state.worldStates.values()) {
          const worldState = storyStates.find(ws => ws.id === worldStateId);
          if (worldState) {
            const property = worldState.state.worldProperties.find(p => p.key === key);
            return property?.value;
          }
        }
        return undefined;
      },

      removeWorldProperty: (worldStateId, key, _reason) => {
        set((state) => {
          const updatedWorldStates = new Map(state.worldStates);

          for (const [storyId, storyStates] of updatedWorldStates) {
            const stateIndex = storyStates.findIndex(ws => ws.id === worldStateId);
            if (stateIndex !== -1) {
              const worldState = storyStates[stateIndex];
              const updatedStates = [...storyStates];
              const updatedProperties = worldState.state.worldProperties.filter(p => p.key !== key);

              updatedStates[stateIndex] = {
                ...worldState,
                state: {
                  ...worldState.state,
                  worldProperties: updatedProperties
                },
                timestamp: new Date()
              };

              updatedWorldStates.set(storyId, updatedStates);
              break;
            }
          }

          return { worldStates: updatedWorldStates };
        });
      },

      // Validation & Consistency
      addValidationRule: (rule) =>
        set((state) => ({
          validationRules: [...state.validationRules, rule]
        })),

      removeValidationRule: (ruleId) =>
        set((state) => ({
          validationRules: state.validationRules.filter(rule => rule.id !== ruleId)
        })),

      updateValidationRule: (ruleId, updates) =>
        set((state) => ({
          validationRules: state.validationRules.map(rule =>
            rule.id === ruleId ? { ...rule, ...updates } : rule
          )
        })),

      runConsistencyCheck: (worldStateId, previousWorldStateId) => {
        const state = get();
        const results: ConsistencyResult[] = [];

        // Find the world state
        let targetWorldState: WorldState | null = null;
        let previousWorldState: WorldState | null = null;

        for (const storyStates of state.worldStates.values()) {
          if (!targetWorldState) {
            targetWorldState = storyStates.find(ws => ws.id === worldStateId) || null;
          }
          if (previousWorldStateId && !previousWorldState) {
            previousWorldState = storyStates.find(ws => ws.id === previousWorldStateId) || null;
          }
        }

        if (!targetWorldState) return results;

        // Run validation rules
        state.validationRules
          .filter(rule => rule.enabled)
          .sort((a, b) => b.priority - a.priority)
          .forEach(rule => {
            try {
              if (rule.condition(targetWorldState!, previousWorldState || undefined)) {
                results.push({
                  id: generateId(),
                  type: 'error',
                  category: (
                    ['character', 'location', 'item', 'timeline', 'logic'].includes(rule.category)
                      ? rule.category
                      : 'logic'
                  ) as ConsistencyResult['category'],
                  description: rule.name,
                  details: rule.message,
                  affectedElements: [],
                  suggestedFix: rule.suggestedFix,
                  autoFixable: !!rule.autoFix,
                  severity: 3,
                  detectedAt: new Date()
                });
              }
            } catch (error) {
              console.error(`Error running validation rule ${rule.id}:`, error);
            }
          });

        return results;
      },

      resolveConsistencyIssue: (worldStateId, issueId, resolution) => {
        // Implementation for resolving consistency issues
        console.log(`Resolving issue ${issueId} for world state ${worldStateId}: ${resolution}`);
      },

      // Snapshots
      createSnapshot: (worldStateId, description, tags = []) => {
        const state = get();
        for (const [storyId, storyStates] of state.worldStates) {
          const worldState = storyStates.find(ws => ws.id === worldStateId);
          if (worldState) {
            const snapshot: WorldStateSnapshot = {
              worldState: JSON.parse(JSON.stringify(worldState)), // Deep clone
              storyTitle: storyId, // Would need to lookup actual story title
              chapterTitle: worldState.chapterId || `Chapter ${worldState.chapterNumber}`,
              createdAt: new Date(),
              description,
              tags
            };

            set((currentState) => ({
              snapshots: [...currentState.snapshots, snapshot]
            }));
            break;
          }
        }
      },

      restoreFromSnapshot: (snapshotId) => {
        const state = get();
        const snapshot = state.snapshots.find(s => s.worldState.id === snapshotId);
        if (snapshot) {
          const restoredState = { ...snapshot.worldState, id: generateId(), timestamp: new Date() };

          const updatedWorldStates = new Map(state.worldStates);
          const storyStates = updatedWorldStates.get(restoredState.storyId) || [];
          updatedWorldStates.set(restoredState.storyId, [...storyStates, restoredState]);

          set({
            worldStates: updatedWorldStates,
            currentWorldState: restoredState
          });
        }
      },

      deleteSnapshot: (snapshotId) =>
        set((state) => ({
          snapshots: state.snapshots.filter(s => s.worldState.id !== snapshotId)
        })),

      // Utilities
      cloneWorldState: (worldStateId) => {
        const state = get();
        for (const storyStates of state.worldStates.values()) {
          const worldState = storyStates.find(ws => ws.id === worldStateId);
          if (worldState) {
            return JSON.parse(JSON.stringify(worldState));
          }
        }
        throw new Error(`World state ${worldStateId} not found`);
      },

      compareWorldStates: (_stateId1, _stateId2) => {
        // Implementation for comparing world states and returning changes
        return [];
      },

      exportWorldState: (worldStateId) => {
        const state = get();
        for (const storyStates of state.worldStates.values()) {
          const worldState = storyStates.find(ws => ws.id === worldStateId);
          if (worldState) {
            return JSON.stringify(worldState, null, 2);
          }
        }
        return '';
      },

      importWorldState: (data) => {
        try {
          return JSON.parse(data) as WorldState;
        } catch {
          throw new Error('Invalid world state data');
        }
      },

      clearAll: () =>
        set({
          worldStates: new Map(),
          currentWorldState: null,
          validationRules: [],
          snapshots: []
        })
    }),
    {
      name: 'litrpg-world-state-storage',
      partialize: (state) => ({
        // Convert Map to Array for serialization
        worldStates: Array.from(state.worldStates.entries()),
        validationRules: state.validationRules,
        snapshots: state.snapshots
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert Array back to Map after deserialization
          state.worldStates = new Map(state.worldStates as [string, WorldState[]][]);
        }
      }
    }
  )
);
