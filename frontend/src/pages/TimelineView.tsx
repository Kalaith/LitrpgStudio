import { useState, useEffect } from 'react';
import { useStoryStore } from '../stores/storyStore';
import { useSeriesStore } from '../stores/seriesStore';
import { useCharacterStore } from '../stores/characterStore';
import { storiesApi, chaptersApi } from '../api/stories';
import { apiClient } from '../api/client';
import InteractiveTimeline from '../components/InteractiveTimeline';
import type { StoryEvent } from '../types/story';
import type { Character } from '../types/character';
import { motion, AnimatePresence } from 'framer-motion';

// ── LLM helpers ──────────────────────────────────────────────────────────────

async function isLlmAvailable(): Promise<boolean> {
  try {
    const res = await apiClient.get('/llm/models');
    return res?.data !== undefined || (res as Record<string, unknown>)?.data !== undefined;
  } catch {
    return false;
  }
}

interface LlmTimelineEvent {
  title: string;
  description: string;
  date: string;
  chapter?: string;
  characters: string[];
  importance: 'minor' | 'moderate' | 'major' | 'critical';
}

// ── Component ────────────────────────────────────────────────────────────────

const TimelineView: React.FC = () => {
  const { stories, currentStory, setCurrentStory, fetchStories, fetchStoryById, addStoryEvent, updateStoryEvent } = useStoryStore();
  const { series, currentSeries, fetchSeries } = useSeriesStore();
  const { characters } = useCharacterStore();

  const [viewMode, setViewMode] = useState<'interactive' | 'list'>('interactive');
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [filterSeriesId, setFilterSeriesId] = useState<string>('');

  // LLM scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [scannedEvents, setScannedEvents] = useState<LlmTimelineEvent[]>([]);
  const [selectedScanned, setSelectedScanned] = useState<Set<number>>(new Set());
  const [scanDone, setScanDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch stories & series on mount
  useEffect(() => { fetchStories(); fetchSeries(); }, []);

  // Helper: check if a story belongs to a given series
  const storyBelongsToSeries = (storyId: string, seriesId: string) => {
    const ser = series.find(sr => sr.id === seriesId);
    return ser?.books?.some(b => b.storyId === storyId) ?? false;
  };

  // Auto-select series from persisted currentSeries, but only if currentStory is
  // actually in that series. If not (story has no series), default to "All Series".
  useEffect(() => {
    if (currentSeries?.id && currentStory?.id) {
      if (storyBelongsToSeries(currentStory.id, currentSeries.id)) {
        setFilterSeriesId(currentSeries.id);
      } else {
        setFilterSeriesId('');
      }
    } else if (currentSeries?.id && !currentStory) {
      setFilterSeriesId(currentSeries.id);
    }
  }, [currentSeries?.id, currentStory?.id, series]);

  // Compute filtered story list
  const storiesForTimeline = filterSeriesId
    ? stories.filter(s => storyBelongsToSeries(s.id, filterSeriesId))
    : stories;

  // Auto-select first story when the list changes
  useEffect(() => {
    if (!selectedStoryId && storiesForTimeline.length > 0) {
      const pick = currentStory?.id && storiesForTimeline.some(s => s.id === currentStory.id)
        ? currentStory.id
        : storiesForTimeline[0].id;
      setSelectedStoryId(pick);
    }
  }, [storiesForTimeline, selectedStoryId, currentStory?.id]);

  // When selectedStoryId changes, fetch the full story (with chapters) and set it as current
  useEffect(() => {
    if (selectedStoryId) {
      fetchStoryById(selectedStoryId);
    }
  }, [selectedStoryId]);

  // Derive the active story from the store once it's loaded
  const activeStory = stories.find(s => s.id === selectedStoryId) ?? currentStory;

  if (stories.length === 0) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No stories available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create a story first to view its timeline
          </p>
        </div>
      </div>
    );
  }

  const getAllCharacters = () => {
    const storyCharacters = activeStory
      ? [activeStory.mainCharacter, ...(activeStory.supportingCharacters || [])]
      : [];
    const uniqueCharacters = new Map();

    [...storyCharacters, ...characters].forEach(char => {
      if (char && !uniqueCharacters.has(char.id)) {
        uniqueCharacters.set(char.id, char);
      }
    });

    return Array.from(uniqueCharacters.values());
  };

  const handleEventClick = (event: StoryEvent) => {
    console.log('Event clicked:', event);
  };

  const handleEventUpdate = (eventId: string, updates: Partial<StoryEvent>) => {
    updateStoryEvent(eventId, updates);
  };

  const handleAddEvent = (event: Omit<StoryEvent, 'id'>) => {
    if (activeStory) {
      addStoryEvent(activeStory.id, event);
    }
  };

  // ── LLM Timeline Scan ─────────────────────────────────────────────────────

  const runTimelineScan = async () => {
    if (!selectedStoryId) return;
    setIsScanning(true);
    setScanDone(false);
    setScannedEvents([]);
    setSelectedScanned(new Set());
    setScanProgress('Checking LLM availability…');

    try {
      const llmReady = await isLlmAvailable();
      if (!llmReady) {
        setScanProgress('LLM not available — make sure LM Studio is running.');
        setIsScanning(false);
        return;
      }

      setScanProgress('Fetching chapters…');
      const chapRes = await chaptersApi.getByStoryId(selectedStoryId);
      if (!chapRes.success || !Array.isArray(chapRes.data) || chapRes.data.length === 0) {
        setScanProgress('No chapters found for this story.');
        setIsScanning(false);
        return;
      }

      const chapters = chapRes.data as unknown as { title: string; content: string; order: number }[];
      const MAX_CHUNK = 12000;
      const fullText = chapters
        .sort((a, b) => a.order - b.order)
        .map((c, i) => `=== Chapter ${i + 1}: ${c.title} ===\n${c.content}`)
        .join('\n\n---\n\n');

      const chunks: string[] = [];
      for (let i = 0; i < fullText.length; i += MAX_CHUNK) {
        chunks.push(fullText.slice(i, i + MAX_CHUNK));
      }

      const allEvents: LlmTimelineEvent[] = [];

      for (let ci = 0; ci < chunks.length; ci++) {
        setScanProgress(`Scanning chunk ${ci + 1} of ${chunks.length}…`);

        const res = await apiClient.post('/llm/chat', {
          model: 'local-model',
          messages: [
            {
              role: 'system',
              content: `You are a fiction-analysis assistant. Extract a chronological list of plot events / timeline entries from the provided text. For each event return a JSON object with: title (short label), description (1-2 sentences), date (in-story date or sequence marker like "Day 1", "Chapter 3 – morning"), chapter (chapter title if identifiable), characters (array of character names involved), importance ("minor", "moderate", "major", or "critical"). Return ONLY a JSON array of these objects — no explanation.`,
            },
            {
              role: 'user',
              content: `Extract timeline events from this fiction text:\n\n${chunks[ci]}`,
            },
          ],
          temperature: 0.15,
          max_tokens: 4096,
        });

        const content: string = (res as Record<string, unknown> & { choices?: Array<{ message?: { content?: string } }> })
          ?.choices?.[0]?.message?.content ?? '';

        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const parsed: LlmTimelineEvent[] = JSON.parse(jsonMatch[0]);
            for (const ev of parsed) {
              if (ev && typeof ev.title === 'string' && ev.title.trim()) {
                allEvents.push({
                  title: ev.title.trim(),
                  description: (ev.description ?? '').trim(),
                  date: (ev.date ?? '').trim(),
                  chapter: (ev.chapter ?? '').trim() || undefined,
                  characters: Array.isArray(ev.characters) ? ev.characters.filter(c => typeof c === 'string') : [],
                  importance: ['minor', 'moderate', 'major', 'critical'].includes(ev.importance) ? ev.importance : 'moderate',
                });
              }
            }
          } catch { /* skip unparseable chunk */ }
        }
      }

      setScannedEvents(allEvents);
      setSelectedScanned(new Set(allEvents.map((_, i) => i)));
      setScanDone(true);
      setScanProgress(`Found ${allEvents.length} events.`);
    } catch (err) {
      setScanProgress(`Scan failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const saveSelectedEvents = async () => {
    if (!activeStory || selectedScanned.size === 0) return;
    setIsSaving(true);
    let saved = 0;
    for (const idx of Array.from(selectedScanned).sort((a, b) => a - b)) {
      const ev = scannedEvents[idx];
      if (!ev) continue;
      try {
        await addStoryEvent(activeStory.id, {
          title: ev.title,
          description: ev.description,
          date: ev.date || new Date().toISOString(),
          chapter: ev.chapter,
          charactersInvolved: ev.characters,
          importance: ev.importance,
        });
        saved++;
      } catch { /* continue saving others */ }
    }
    setIsSaving(false);
    setScanDone(false);
    setScannedEvents([]);
    setSelectedScanned(new Set());
    setScanProgress(`Saved ${saved} events to timeline.`);
    // Re-fetch story to refresh timeline
    fetchStoryById(activeStory.id);
  };

  const allCharacters = getAllCharacters();
  const events = activeStory?.timeline || [];

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Story Timeline</h2>
            {activeStory && (
              <p className="text-gray-600 dark:text-gray-400">
                Track events and character arcs in &ldquo;{activeStory.title}&rdquo;
              </p>
            )}
          </div>

          <div className="flex items-center space-x-4 flex-wrap gap-2">
            {/* Series filter */}
            <select
              value={filterSeriesId}
              onChange={e => { setFilterSeriesId(e.target.value); setSelectedStoryId(''); }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              <option value="">All Series</option>
              {series.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Story picker */}
            <select
              value={selectedStoryId}
              onChange={e => setSelectedStoryId(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              <option value="">Select a story…</option>
              {storiesForTimeline.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode('interactive')}
                className={`
                  px-3 py-2 text-sm
                  ${viewMode === 'interactive'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                Interactive
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`
                  px-3 py-2 text-sm
                  ${viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LLM Scan Section */}
      {activeStory && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                AI Timeline Extraction
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Scan story chapters with AI to discover plot events
              </p>
            </div>
            <button
              onClick={runTimelineScan}
              disabled={isScanning || !selectedStoryId}
              className="px-4 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? 'Scanning…' : '✨ Scan for Events'}
            </button>
          </div>

          {scanProgress && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{scanProgress}</p>
          )}

          {scanDone && scannedEvents.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedScanned.size} of {scannedEvents.length} events selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedScanned(new Set(scannedEvents.map((_, i) => i)))}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >Select All</button>
                  <button
                    onClick={() => setSelectedScanned(new Set())}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >Deselect All</button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-600 rounded-md p-2">
                {scannedEvents.map((ev, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedScanned.has(idx) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedScanned.has(idx)}
                      onChange={() => {
                        const next = new Set(selectedScanned);
                        next.has(idx) ? next.delete(idx) : next.add(idx);
                        setSelectedScanned(next);
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{ev.title}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${
                          ev.importance === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                          ev.importance === 'major' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' :
                          ev.importance === 'moderate' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                        }`}>{ev.importance}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{ev.description}</p>
                      {ev.date && <span className="text-xs text-gray-400">{ev.date}</span>}
                      {ev.characters.length > 0 && (
                        <span className="text-xs text-gray-400 ml-2">— {ev.characters.join(', ')}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={saveSelectedEvents}
                  disabled={isSaving || selectedScanned.size === 0}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving…' : `Add ${selectedScanned.size} Events to Timeline`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeStory ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <AnimatePresence mode="wait">
            {viewMode === 'interactive' ? (
              <motion.div
                key="interactive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                {events.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No timeline events yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Add events manually or use AI scan to discover them
                    </p>
                    <button
                      onClick={() => handleAddEvent({
                        title: 'New Event',
                        description: 'Event description',
                        date: new Date().toISOString(),
                        charactersInvolved: [],
                        importance: 'moderate'
                      })}
                      className="btn-primary"
                    >
                      Add First Event
                    </button>
                  </div>
                ) : (
                  <InteractiveTimeline
                    events={events}
                    characters={allCharacters}
                    onEventClick={handleEventClick}
                    onEventUpdate={handleEventUpdate}
                    onAddEvent={handleAddEvent}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                <ListView
                  events={events}
                  characters={allCharacters}
                  onEventUpdate={handleEventUpdate}
                  onAddEvent={handleAddEvent}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select a story
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a story from the dropdown above to view its timeline
          </p>
        </div>
      )}
    </div>
  );
};

// List View Component
interface ListViewProps {
  events: StoryEvent[];
  characters: Character[];
  onEventUpdate: (eventId: string, updates: Partial<StoryEvent>) => void;
  onAddEvent: (event: Omit<StoryEvent, 'id'>) => void;
}

function ListView({ events, characters, onEventUpdate, onAddEvent }: ListViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<StoryEvent | null>(null);

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getCharacterName = (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    return character?.name || 'Unknown Character';
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No timeline events yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Add events to track your story's progression
        </p>
        <button
          onClick={() => onAddEvent({
            title: 'New Event',
            description: 'Event description',
            date: new Date().toISOString(),
            charactersInvolved: [],
            importance: 'moderate'
          })}
          className="btn-primary"
        >
          Add First Event
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Timeline Events ({events.length})</h3>
        <button
          onClick={() => onAddEvent({
            title: 'New Event',
            description: 'Event description',
            date: new Date().toISOString(),
            charactersInvolved: [],
            importance: 'moderate'
          })}
          className="btn-primary text-sm"
        >
          Add Event
        </button>
      </div>

      <div className="space-y-4">
        {sortedEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer
              transition-all hover:shadow-md
              ${selectedEvent?.id === event.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
            `}
            onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold">{event.title}</h4>
                  <span className={`
                    px-2 py-1 text-xs rounded-full font-medium
                    ${event.importance === 'critical' ? 'bg-red-100 text-red-800' :
                      event.importance === 'major' ? 'bg-orange-100 text-orange-800' :
                      event.importance === 'moderate' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'}
                  `}>
                    {event.importance}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  {event.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  {event.charactersInvolved.length > 0 && (
                    <span>
                      Characters: {event.charactersInvolved.map(getCharacterName).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Edit event
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
              </div>
            </div>

            {selectedEvent?.id === event.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      value={event.date.split('T')[0]}
                      onChange={(e) => onEventUpdate(event.id, { date: e.target.value })}
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Importance</label>
                    <select
                      value={event.importance}
                      onChange={(e) => onEventUpdate(event.id, { importance: e.target.value as StoryEvent['importance'] })}
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded"
                    >
                      <option value="minor">Minor</option>
                      <option value="moderate">Moderate</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={event.description}
                    onChange={(e) => onEventUpdate(event.id, { description: e.target.value })}
                    rows={3}
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded"
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default TimelineView;
