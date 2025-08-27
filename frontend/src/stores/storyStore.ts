import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Story, Chapter, StoryEvent, StoryTemplate, CharacterProgressionEvent } from '../types';

interface StoryState {
  stories: Story[];
  currentStory: Story | null;
  templates: StoryTemplate[];
  writingSession: WritingSession | null;
}

interface WritingSession {
  storyId: string;
  chapterId?: string;
  startTime: Date;
  wordTarget: number;
  wordsWritten: number;
}

interface StoryActions {
  // Story Management
  createStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStory: (storyId: string, updates: Partial<Story>) => void;
  deleteStory: (storyId: string) => void;
  setCurrentStory: (story: Story | null) => void;
  
  // Chapter Management
  addChapter: (storyId: string, chapter: Omit<Chapter, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => void;
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  deleteChapter: (chapterId: string) => void;
  reorderChapters: (storyId: string, chapterIds: string[]) => void;
  
  // Story Events
  addStoryEvent: (storyId: string, event: Omit<StoryEvent, 'id'>) => void;
  updateStoryEvent: (eventId: string, updates: Partial<StoryEvent>) => void;
  deleteStoryEvent: (eventId: string) => void;
  
  // Character Progression
  addCharacterProgression: (chapterId: string, progression: CharacterProgressionEvent) => void;
  
  // Writing Sessions
  startWritingSession: (storyId: string, chapterId?: string, wordTarget?: number) => void;
  endWritingSession: () => void;
  updateSessionProgress: (wordsWritten: number) => void;
  
  // Templates
  saveAsTemplate: (story: Story, templateName: string) => void;
  createFromTemplate: (templateId: string, storyTitle: string) => void;
  
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

      // Story Actions
      createStory: (storyData) =>
        set((state) => {
          const newStory: Story = {
            ...storyData,
            id: generateId(),
            wordCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return {
            stories: [...state.stories, newStory],
            currentStory: newStory,
          };
        }),

      updateStory: (storyId, updates) =>
        set((state) => {
          const updatedStories = state.stories.map(s =>
            s.id === storyId
              ? { ...s, ...updates, updatedAt: new Date() }
              : s
          );
          return {
            stories: updatedStories,
            currentStory:
              state.currentStory?.id === storyId
                ? updatedStories.find(s => s.id === storyId) || null
                : state.currentStory,
          };
        }),

      deleteStory: (storyId) =>
        set((state) => ({
          stories: state.stories.filter(s => s.id !== storyId),
          currentStory: state.currentStory?.id === storyId ? null : state.currentStory,
          writingSession: state.writingSession?.storyId === storyId ? null : state.writingSession,
        })),

      setCurrentStory: (story) => set({ currentStory: story }),

      // Chapter Actions
      addChapter: (storyId, chapterData) =>
        set((state) => {
          const story = state.stories.find(s => s.id === storyId);
          if (!story) return state;

          const newChapter: Chapter = {
            ...chapterData,
            id: generateId(),
            storyId,
            characterProgression: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const updatedStory: Story = {
            ...story,
            chapters: [...story.chapters, newChapter],
            updatedAt: new Date(),
          };

          return {
            stories: state.stories.map(s =>
              s.id === storyId ? updatedStory : s
            ),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
          };
        }),

      updateChapter: (chapterId, updates) =>
        set((state) => {
          const storyWithChapter = state.stories.find(s =>
            s.chapters.some(c => c.id === chapterId)
          );
          if (!storyWithChapter) return state;

          const updatedChapters = storyWithChapter.chapters.map(c =>
            c.id === chapterId
              ? {
                  ...c,
                  ...updates,
                  wordCount: updates.content ? updates.content.split(/\s+/).length : c.wordCount,
                  updatedAt: new Date(),
                }
              : c
          );

          const updatedStory: Story = {
            ...storyWithChapter,
            chapters: updatedChapters,
            wordCount: updatedChapters.reduce((total, c) => total + c.wordCount, 0),
            updatedAt: new Date(),
          };

          return {
            stories: state.stories.map(s =>
              s.id === storyWithChapter.id ? updatedStory : s
            ),
            currentStory: state.currentStory?.id === storyWithChapter.id ? updatedStory : state.currentStory,
          };
        }),

      deleteChapter: (chapterId) =>
        set((state) => {
          const storyWithChapter = state.stories.find(s =>
            s.chapters.some(c => c.id === chapterId)
          );
          if (!storyWithChapter) return state;

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
            stories: state.stories.map(s =>
              s.id === storyWithChapter.id ? updatedStory : s
            ),
            currentStory: state.currentStory?.id === storyWithChapter.id ? updatedStory : state.currentStory,
          };
        }),

      reorderChapters: (storyId, chapterIds) =>
        set((state) => {
          const story = state.stories.find(s => s.id === storyId);
          if (!story) return state;

          const reorderedChapters = chapterIds
            .map(id => story.chapters.find(c => c.id === id))
            .filter(Boolean)
            .map((chapter, index) => ({ ...chapter!, order: index + 1 }));

          const updatedStory: Story = {
            ...story,
            chapters: reorderedChapters,
            updatedAt: new Date(),
          };

          return {
            stories: state.stories.map(s =>
              s.id === storyId ? updatedStory : s
            ),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
          };
        }),

      // Story Events
      addStoryEvent: (storyId, eventData) =>
        set((state) => {
          const story = state.stories.find(s => s.id === storyId);
          if (!story) return state;

          const newEvent: StoryEvent = {
            ...eventData,
            id: generateId(),
          };

          const updatedStory: Story = {
            ...story,
            timeline: [...story.timeline, newEvent],
            updatedAt: new Date(),
          };

          return {
            stories: state.stories.map(s =>
              s.id === storyId ? updatedStory : s
            ),
            currentStory: state.currentStory?.id === storyId ? updatedStory : state.currentStory,
          };
        }),

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

      // Character Progression
      addCharacterProgression: (chapterId, progression) =>
        set((state) => {
          const storyWithChapter = state.stories.find(s =>
            s.chapters.some(c => c.id === chapterId)
          );
          if (!storyWithChapter) return state;

          const updatedChapters = storyWithChapter.chapters.map(c =>
            c.id === chapterId
              ? {
                  ...c,
                  characterProgression: [...c.characterProgression, progression],
                  updatedAt: new Date(),
                }
              : c
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
          };
        }),

      // Writing Sessions
      startWritingSession: (storyId, chapterId, wordTarget = 500) =>
        set({
          writingSession: {
            storyId,
            chapterId,
            startTime: new Date(),
            wordTarget,
            wordsWritten: 0,
          },
        }),

      endWritingSession: () => set({ writingSession: null }),

      updateSessionProgress: (wordsWritten) =>
        set((state) =>
          state.writingSession
            ? {
                writingSession: {
                  ...state.writingSession,
                  wordsWritten,
                },
              }
            : state
        ),

      // Templates
      saveAsTemplate: (story, templateName) =>
        set((state) => {
          const template: StoryTemplate = {
            id: generateId(),
            name: templateName,
            description: story.description,
            genre: story.genre,
            outline: story.chapters.map(c => c.title),
            suggestedLength: story.targetWordCount || story.wordCount,
            characterTemplates: [story.mainCharacter.id], // Would need character template IDs
          };
          return {
            templates: [...state.templates, template],
          };
        }),

      createFromTemplate: (templateId, storyTitle) =>
        set((state) => {
          const template = state.templates.find(t => t.id === templateId);
          if (!template) return state;

          // This would need to be expanded with actual character creation
          const newStory: Story = {
            id: generateId(),
            title: storyTitle,
            genre: template.genre,
            description: template.description,
            mainCharacter: {} as any, // Would need to create from character template
            supportingCharacters: [],
            chapters: template.outline.map((title, index) => ({
              id: generateId(),
              storyId: generateId(), // Will be set correctly below
              title,
              content: '',
              order: index + 1,
              wordCount: 0,
              notes: '',
              characterProgression: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            worldBuilding: {
              name: '',
              description: '',
            },
            timeline: [],
            status: 'draft',
            wordCount: 0,
            targetWordCount: template.suggestedLength,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Fix storyId references in chapters
          newStory.chapters = newStory.chapters.map(c => ({
            ...c,
            storyId: newStory.id,
          }));

          return {
            stories: [...state.stories, newStory],
            currentStory: newStory,
          };
        }),

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