import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Story, Chapter, StoryEvent, StoryTemplate, CharacterProgressionEvent } from '../types/story';
import { storiesApi, chaptersApi, writingSessionsApi } from '../api/stories';

interface StoryState {
  stories: Story[];
  currentStory: Story | null;
  templates: StoryTemplate[];
  writingSession: WritingSession | null;
  loading: boolean;
  error: string | null;
}

interface WritingSession {
  storyId: string;
  chapterId?: string;
  startTime: Date;
  wordTarget: number;
  wordsWritten: number;
}

interface StoryActions {
  // Loading state management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async API actions
  fetchStories: () => Promise<void>;
  fetchStoryById: (id: string) => Promise<void>;
  fetchTemplates: () => Promise<void>;

  // Story Management (async)
  createStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Story>;
  updateStory: (storyId: string, updates: Partial<Story>) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  setCurrentStory: (story: Story | null) => void;

  // Chapter Management (async)
  addChapter: (storyId: string, chapter: Omit<Chapter, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => Promise<Chapter>;
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  reorderChapters: (storyId: string, chapterIds: string[]) => Promise<void>;
  
  // Story Events (async)
  addStoryEvent: (storyId: string, event: Omit<StoryEvent, 'id'>) => Promise<void>;
  updateStoryEvent: (eventId: string, updates: Partial<StoryEvent>) => void;
  deleteStoryEvent: (eventId: string) => void;

  // Character Progression (async)
  addCharacterProgression: (chapterId: string, progression: CharacterProgressionEvent) => Promise<void>;

  // Writing Sessions (async)
  startWritingSession: (storyId: string, chapterId?: string, wordTarget?: number) => Promise<void>;
  endWritingSession: () => Promise<void>;
  updateSessionProgress: (wordsWritten: number) => Promise<void>;

  // Templates (async)
  saveAsTemplate: (story: Story, templateName: string) => Promise<void>;
  createFromTemplate: (templateId: string, storyTitle: string) => Promise<Story>;
  
  // Utility
  calculateWordCount: (storyId: string) => number;
  clearAll: () => void;
}

type StoryStore = StoryState & StoryActions;

const generateId = () => crypto.randomUUID();

export const useStoryStore = create<StoryStore>()(
  persist(
    (set, get) => ({
      // State
      stories: [],
      currentStory: null,
      templates: [],
      writingSession: null,
      loading: false,
      error: null,

      // Loading state management
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),

      // Async API actions
      fetchStories: async () => {
        set({ loading: true, error: null });
        try {
          const response = await storiesApi.getAll();
          if (response.success && response.data) {
            set({ stories: response.data });
          } else {
            set({ error: response.error || 'Failed to fetch stories' });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch stories' });
        } finally {
          set({ loading: false });
        }
      },

      fetchStoryById: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const response = await storiesApi.getById(id);
          if (response.success && response.data) {
            set({ currentStory: response.data });
          } else {
            set({ error: response.error || 'Failed to fetch story' });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch story' });
        } finally {
          set({ loading: false });
        }
      },

      fetchTemplates: async () => {
        set({ loading: true, error: null });
        try {
          const response = await storiesApi.getTemplates();
          if (response.success && response.data) {
            set({ templates: response.data });
          } else {
            set({ error: response.error || 'Failed to fetch templates' });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch templates' });
        } finally {
          set({ loading: false });
        }
      },

      // Story Actions (async)
      createStory: async (storyData) => {
        set({ loading: true, error: null });
        try {
          const response = await storiesApi.create(storyData);
          if (response.success && response.data) {
            const newStory = response.data;
            set((state) => ({
              stories: [...state.stories, newStory],
              currentStory: newStory,
              loading: false
            }));
            return newStory;
          } else {
            set({ error: response.error || 'Failed to create story', loading: false });
            throw new Error(response.error || 'Failed to create story');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create story';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      updateStory: async (storyId, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await storiesApi.update(storyId, updates);
          if (response.success && response.data) {
            const updatedStory = response.data;
            set((state) => ({
              stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
              currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
              loading: false
            }));
          } else {
            set({ error: response.error || 'Failed to update story', loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update story';
          set({ error: errorMessage, loading: false });
        }
      },

      deleteStory: async (storyId) => {
        set({ loading: true, error: null });
        try {
          const response = await storiesApi.delete(storyId);
          if (response.success) {
            set((state) => ({
              stories: state.stories.filter(s => s.id !== storyId),
              currentStory: state.currentStory?.id === storyId ? null : state.currentStory,
              writingSession: state.writingSession?.storyId === storyId ? null : state.writingSession,
              loading: false
            }));
          } else {
            set({ error: response.error || 'Failed to delete story', loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete story';
          set({ error: errorMessage, loading: false });
        }
      },

      setCurrentStory: (story) => set({ currentStory: story }),

      // Chapter Actions (async)
      addChapter: async (storyId, chapterData) => {
        set({ loading: true, error: null });
        try {
          const response = await chaptersApi.create(storyId, chapterData);
          if (response.success && response.data) {
            const newChapter = response.data;
            set((state) => {
              const story = state.stories.find(s => s.id === storyId);
              if (!story) return { loading: false };

              const updatedStory: Story = {
                ...story,
                chapters: [...story.chapters, newChapter],
                updatedAt: new Date(),
              };

              return {
                stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
                currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
                loading: false
              };
            });
            return newChapter;
          } else {
            set({ error: response.error || 'Failed to create chapter', loading: false });
            throw new Error(response.error || 'Failed to create chapter');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create chapter';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      updateChapter: async (chapterId, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await chaptersApi.update(chapterId, updates);
          if (response.success && response.data) {
            const updatedChapter = response.data;
            set((state) => {
              const storyWithChapter = state.stories.find(s =>
                s.chapters.some(c => c.id === chapterId)
              );
              if (!storyWithChapter) return { loading: false };

              const updatedChapters = storyWithChapter.chapters.map(c =>
                c.id === chapterId ? updatedChapter : c
              );

              const updatedStory: Story = {
                ...storyWithChapter,
                chapters: updatedChapters,
                wordCount: updatedChapters.reduce((total, c) => total + c.wordCount, 0),
                updatedAt: new Date(),
              };

              return {
                stories: state.stories.map(s => s.id === storyWithChapter.id ? updatedStory : s),
                currentStory: state.currentStory?.id === storyWithChapter.id ? updatedStory : state.currentStory,
                loading: false
              };
            });
          } else {
            set({ error: response.error || 'Failed to update chapter', loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update chapter';
          set({ error: errorMessage, loading: false });
        }
      },

      deleteChapter: async (chapterId) => {
        set({ loading: true, error: null });
        try {
          const response = await chaptersApi.delete(chapterId);
          if (response.success) {
            set((state) => {
              const storyWithChapter = state.stories.find(s =>
                s.chapters.some(c => c.id === chapterId)
              );
              if (!storyWithChapter) return { loading: false };

              const updatedChapters = storyWithChapter.chapters
                .filter(c => c.id !== chapterId)
                .map((c, index) => ({ ...c, order: index + 1 }));

              const updatedStory: Story = {
                ...storyWithChapter,
                chapters: updatedChapters,
                wordCount: updatedChapters.reduce((total, c) => total + c.wordCount, 0),
                updatedAt: new Date(),
              };

              return {
                stories: state.stories.map(s => s.id === storyWithChapter.id ? updatedStory : s),
                currentStory: state.currentStory?.id === storyWithChapter.id ? updatedStory : state.currentStory,
                loading: false
              };
            });
          } else {
            set({ error: response.error || 'Failed to delete chapter', loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete chapter';
          set({ error: errorMessage, loading: false });
        }
      },

      reorderChapters: async (storyId, chapterIds) => {
        set({ loading: true, error: null });
        try {
          const response = await chaptersApi.reorder(storyId, chapterIds);
          if (response.success && response.data) {
            const reorderedChapters = response.data;
            set((state) => {
              const story = state.stories.find(s => s.id === storyId);
              if (!story) return { loading: false };

              const updatedStory: Story = {
                ...story,
                chapters: reorderedChapters,
                updatedAt: new Date(),
              };

              return {
                stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
                currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
                loading: false
              };
            });
          } else {
            set({ error: response.error || 'Failed to reorder chapters', loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to reorder chapters';
          set({ error: errorMessage, loading: false });
        }
      },

      // Story Events (async)
      addStoryEvent: async (storyId, eventData) => {
        set({ loading: true, error: null });
        try {
          const response = await storiesApi.addEvent(storyId, eventData);
          if (response.success && response.data) {
            const updatedStory = response.data;
            set((state) => ({
              stories: state.stories.map(s => s.id === storyId ? updatedStory : s),
              currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
              loading: false
            }));
          } else {
            set({ error: response.error || 'Failed to add story event', loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add story event';
          set({ error: errorMessage, loading: false });
        }
      },

      updateStoryEvent: (eventId, updates) =>
        set((state) => {
          const storyWithEvent = state.stories.find(s =>
            s.timeline.some(e => e.id === eventId)
          );
          if (!storyWithEvent) return state;

          const updatedTimeline = storyWithEvent.timeline.map(e =>
            e.id === eventId ? { ...e, ...updates } : e
          );

          const updatedStory: Story = {
            ...storyWithEvent,
            timeline: updatedTimeline,
            updatedAt: new Date(),
          };

          return {
            stories: state.stories.map(s =>
              s.id === storyWithEvent.id ? updatedStory : s
            ),
            currentStory: state.currentStory?.id === storyWithEvent.id ? updatedStory : state.currentStory,
          };
        }),

      deleteStoryEvent: (eventId) =>
        set((state) => {
          const storyWithEvent = state.stories.find(s =>
            s.timeline.some(e => e.id === eventId)
          );
          if (!storyWithEvent) return state;

          const updatedStory: Story = {
            ...storyWithEvent,
            timeline: storyWithEvent.timeline.filter(e => e.id !== eventId),
            updatedAt: new Date(),
          };

          return {
            stories: state.stories.map(s =>
              s.id === storyWithEvent.id ? updatedStory : s
            ),
            currentStory: state.currentStory?.id === storyWithEvent.id ? updatedStory : state.currentStory,
          };
        }),

      // Character Progression (async)
      addCharacterProgression: async (chapterId, progression) => {
        set({ loading: true, error: null });
        try {
          const response = await chaptersApi.addCharacterProgression(chapterId, progression);
          if (response.success && response.data) {
            const updatedChapter = response.data;
            set((state) => {
              const storyWithChapter = state.stories.find(s =>
                s.chapters.some(c => c.id === chapterId)
              );
              if (!storyWithChapter) return { loading: false };

              const updatedChapters = storyWithChapter.chapters.map(c =>
                c.id === chapterId ? updatedChapter : c
              );

              const updatedStory: Story = {
                ...storyWithChapter,
                chapters: updatedChapters,
                updatedAt: new Date(),
              };

              return {
                stories: state.stories.map(s =>
                  s.id === storyWithChapter.id ? updatedStory : s
                ),
                currentStory: state.currentStory?.id === storyWithChapter.id ? updatedStory : state.currentStory,
                loading: false
              };
            });
          } else {
            set({ error: response.error || 'Failed to add character progression', loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add character progression';
          set({ error: errorMessage, loading: false });
        }
      },

      // Writing Sessions (async)
      startWritingSession: async (storyId, chapterId, wordTarget = 500) => {
        set({ loading: true, error: null });
        try {
          const response = await writingSessionsApi.start(storyId, chapterId, wordTarget);
          if (response.success) {
            set({
              writingSession: {
                storyId,
                chapterId,
                startTime: new Date(),
                wordTarget,
                wordsWritten: 0,
              },
              loading: false
            });
          } else {
            set({ error: response.error || 'Failed to start writing session', loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to start writing session';
          set({ error: errorMessage, loading: false });
        }
      },

      endWritingSession: async () => {
        set({ loading: true, error: null });
        try {
          const response = await writingSessionsApi.end();
          if (response.success) {
            set({ writingSession: null, loading: false });
          } else {
            set({ error: response.error || 'Failed to end writing session', loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to end writing session';
          set({ error: errorMessage, loading: false });
        }
      },

      updateSessionProgress: async (wordsWritten) => {
        set({ loading: true, error: null });
        try {
          const response = await writingSessionsApi.updateProgress(wordsWritten);
          if (response.success) {
            set((state) =>
              state.writingSession
                ? {
                    writingSession: {
                      ...state.writingSession,
                      wordsWritten,
                    },
                    loading: false
                  }
                : { loading: false }
            );
          } else {
            set({ error: response.error || 'Failed to update session progress', loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update session progress';
          set({ error: errorMessage, loading: false });
        }
      },

      // Templates (async)
      saveAsTemplate: async (story, templateName) => {
        set({ loading: true, error: null });
        try {
          const templateData: Omit<StoryTemplate, 'id'> = {
            name: templateName,
            description: story.description,
            genre: story.genre,
            outline: story.chapters.map(c => c.title),
            suggestedLength: story.targetWordCount || story.wordCount,
            characterTemplates: [story.mainCharacter.id],
          };
          const response = await storiesApi.saveAsTemplate(templateData);
          if (response.success && response.data) {
            const newTemplate = response.data;
            set((state) => ({
              templates: [...state.templates, newTemplate],
              loading: false
            }));
          } else {
            set({ error: response.error || 'Failed to save template', loading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to save template';
          set({ error: errorMessage, loading: false });
        }
      },

      createFromTemplate: async (templateId, storyTitle) => {
        set({ loading: true, error: null });
        try {
          const response = await storiesApi.createFromTemplate(templateId, storyTitle);
          if (response.success && response.data) {
            const newStory = response.data;
            set((state) => ({
              stories: [...state.stories, newStory],
              currentStory: newStory,
              loading: false
            }));
            return newStory;
          } else {
            set({ error: response.error || 'Failed to create story from template', loading: false });
            throw new Error(response.error || 'Failed to create story from template');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create story from template';
          set({ error: errorMessage, loading: false });
          throw error;
        }
      },

      // Utility
      calculateWordCount: (storyId) => {
        const story = get().stories.find(s => s.id === storyId);
        return story ? story.chapters.reduce((total, c) => total + c.wordCount, 0) : 0;
      },

      clearAll: () =>
        set({
          stories: [],
          currentStory: null,
          templates: [],
          writingSession: null,
        }),
    }),
    {
      name: 'litrpg-story-storage',
      partialize: (state) => ({
        stories: state.stories,
        templates: state.templates,
      }),
    }
  )
);