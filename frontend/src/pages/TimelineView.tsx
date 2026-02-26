import { useState } from 'react';
import { useStoryStore } from '../stores/storyStore';
import { useCharacterStore } from '../stores/characterStore';
import InteractiveTimeline from '../components/InteractiveTimeline';
import type { StoryEvent } from '../types/story';
import type { Character } from '../types/character';
import { motion, AnimatePresence } from 'framer-motion';

const TimelineView: React.FC = () => {
  const { currentStory, addStoryEvent, updateStoryEvent } = useStoryStore();
  const { characters } = useCharacterStore();
  const [viewMode, setViewMode] = useState<'interactive' | 'list'>('interactive');

  if (!currentStory) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No story selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please select or create a story to view its timeline
          </p>
          <button className="btn-primary">
            Create New Story
          </button>
        </div>
      </div>
    );
  }

  const getAllCharacters = () => {
    const storyCharacters = [currentStory.mainCharacter, ...currentStory.supportingCharacters];
    const uniqueCharacters = new Map();

    [...storyCharacters, ...characters].forEach(char => {
      if (char && !uniqueCharacters.has(char.id)) {
        uniqueCharacters.set(char.id, char);
      }
    });

    return Array.from(uniqueCharacters.values());
  };

  const handleEventClick = (event: StoryEvent) => {
    // Handle event click - could open a detail modal
    console.log('Event clicked:', event);
  };

  const handleEventUpdate = (eventId: string, updates: Partial<StoryEvent>) => {
    updateStoryEvent(eventId, updates);
  };

  const handleAddEvent = (event: Omit<StoryEvent, 'id'>) => {
    if (currentStory) {
      addStoryEvent(currentStory.id, event);
    }
  };

  const allCharacters = getAllCharacters();
  const events = currentStory.timeline || [];

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Story Timeline</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track events and character arcs in "{currentStory.title}"
            </p>
          </div>

          <div className="flex items-center space-x-4">
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
                    Add events to track your story's progression
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
