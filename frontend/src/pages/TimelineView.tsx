import { useState, useEffect } from 'react';

interface Character {
  id: string;
  name: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  datetime: string; // ISO string for proper sorting
  characters: { id: string; name: string }[];
  type: 'plot' | 'character' | 'world';
}

interface TimelineViewProps {
  isCreating?: boolean;
  onCreateComplete?: () => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  isCreating = false,
  onCreateComplete
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isCreatingLocal, setIsCreatingLocal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  // Load events and characters from localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('timeline-events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }

    const savedCharacters = localStorage.getItem('characters');
    if (savedCharacters) {
      const chars = JSON.parse(savedCharacters);
      setCharacters(chars.map((c: any) => ({ id: c.id, name: c.name })));
    }
  }, []);

  // Update local creating state when prop changes
  useEffect(() => {
    if (isCreating) {
      setIsCreatingLocal(true);
    }
  }, [isCreating]);

  const handleSaveEvent = (event: TimelineEvent) => {
    let updatedEvents;
    if (editingEvent) {
      updatedEvents = events.map(e => e.id === event.id ? event : e);
    } else {
      updatedEvents = [...events, { ...event, id: crypto.randomUUID() }];
    }
    
    setEvents(updatedEvents);
    localStorage.setItem('timeline-events', JSON.stringify(updatedEvents));
    setEditingEvent(null);
    setIsCreatingLocal(false);
    onCreateComplete?.();
  };

  const handleDeleteEvent = (id: string) => {
    const updatedEvents = events.filter(e => e.id !== id);
    setEvents(updatedEvents);
    localStorage.setItem('timeline-events', JSON.stringify(updatedEvents));
  };

  // Sort events by date, oldest to newest
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Story Timeline</h2>
        <button className="btn-primary" onClick={() => setIsCreatingLocal(true)}>
          + Add Event
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-6">
          {sortedEvents.map(event => (
            <div 
              key={event.id}
              className="flex gap-4 items-start border-l-4 border-primary-600 pl-4 relative group"
            >
              <div className="absolute -left-2 top-0 w-4 h-4 bg-primary-600 rounded-full" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      onClick={() => {
                        setEditingEvent(event);
                        setIsCreatingLocal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {new Date(event.datetime).toLocaleString()}
                </div>
                <p className="text-gray-700 dark:text-gray-300">{event.description}</p>
                {event.characters.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {event.characters.map(character => (
                      <span 
                        key={character.id}
                        className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                      >
                        {character.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {event.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(isCreatingLocal || editingEvent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-semibold mb-4">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            <EventForm
              initialEvent={editingEvent}
              characters={characters}
              onSave={handleSaveEvent}
              onCancel={() => {
                setIsCreatingLocal(false);
                setEditingEvent(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface EventFormProps {
  initialEvent?: TimelineEvent | null;
  characters: Character[];
  onSave: (event: TimelineEvent) => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({
  initialEvent,
  characters,
  onSave,
  onCancel
}) => {
  const [event, setEvent] = useState<TimelineEvent>({
    id: initialEvent?.id || '',
    title: initialEvent?.title || '',
    description: initialEvent?.description || '',
    datetime: initialEvent?.datetime || new Date().toISOString().slice(0, 16),
    characters: initialEvent?.characters || [],
    type: initialEvent?.type || 'plot'
  });

  const [selectedCharacterId, setSelectedCharacterId] = useState('');

  const handleAddCharacter = () => {
    if (!selectedCharacterId) return;
    const character = characters.find(c => c.id === selectedCharacterId);
    if (!character) return;
    
    if (!event.characters.some(c => c.id === character.id)) {
      setEvent({
        ...event,
        characters: [...event.characters, { id: character.id, name: character.name }]
      });
    }
    setSelectedCharacterId('');
  };

  const handleRemoveCharacter = (characterId: string) => {
    setEvent({
      ...event,
      characters: event.characters.filter(c => c.id !== characterId)
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          className="input"
          value={event.title}
          onChange={e => setEvent({ ...event, title: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Date and Time</label>
        <input
          type="datetime-local"
          className="input"
          value={event.datetime.slice(0, 16)}
          onChange={e => setEvent({ ...event, datetime: new Date(e.target.value).toISOString() })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          className="input min-h-[100px]"
          value={event.description}
          onChange={e => setEvent({ ...event, description: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Type</label>
        <select
          className="input"
          value={event.type}
          onChange={e => setEvent({ ...event, type: e.target.value as TimelineEvent['type'] })}
        >
          <option value="plot">Plot Event</option>
          <option value="character">Character Event</option>
          <option value="world">World Event</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Characters Involved</label>
        <div className="flex gap-2">
          <select
            className="input flex-1"
            value={selectedCharacterId}
            onChange={e => setSelectedCharacterId(e.target.value)}
          >
            <option value="">Select Character</option>
            {characters.map(character => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
          <button 
            className="btn-secondary px-4" 
            onClick={handleAddCharacter}
            disabled={!selectedCharacterId}
          >
            Add
          </button>
        </div>
        {event.characters.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {event.characters.map(character => (
              <span 
                key={character.id}
                className="inline-flex items-center gap-1 text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
              >
                {character.name}
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveCharacter(character.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button 
          className="btn-primary"
          onClick={() => onSave(event)}
          disabled={!event.title || !event.datetime}
        >
          {initialEvent ? 'Update' : 'Create'} Event
        </button>
      </div>
    </div>
  );
};

export default TimelineView;
