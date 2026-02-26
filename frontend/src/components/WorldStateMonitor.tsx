import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorldStateStore } from '../stores/worldStateStore';
import { useCharacterStore } from '../stores/characterStore';
import type { Character } from '../types/character';
import type { WorldState, ConsistencyResult } from '../types/worldState';

interface WorldStateMonitorProps {
  storyId: string;
  chapterNumber?: number;
}

type MonitorTab = 'overview' | 'characters' | 'locations' | 'events' | 'consistency';

export const WorldStateMonitor: React.FC<WorldStateMonitorProps> = ({
  storyId,
  chapterNumber
}) => {
  const [activeTab, setActiveTab] = useState<MonitorTab>('overview');
  const [autoCheck, setAutoCheck] = useState(true);

  const {
    getCurrentWorldState,
    getWorldStateHistory,
    runConsistencyCheck,
    createWorldState
  } = useWorldStateStore();

  const { characters } = useCharacterStore();

  const currentWorldState = getCurrentWorldState(storyId);
  const worldStateHistory = getWorldStateHistory(storyId);

  const consistencyResults = useMemo(() => {
    if (!currentWorldState || !autoCheck) return [];
    const previousState = worldStateHistory[worldStateHistory.length - 2];
    return runConsistencyCheck(currentWorldState.id, previousState?.id);
  }, [currentWorldState, worldStateHistory, autoCheck, runConsistencyCheck]);

  const criticalIssues = consistencyResults.filter(r => r.severity >= 4);
  const warnings = consistencyResults.filter(r => r.severity >= 2 && r.severity < 4);

  // Initialize world state if it doesn't exist
  useEffect(() => {
    if (!currentWorldState && storyId) {
      createWorldState(storyId, undefined, chapterNumber);
    }
  }, [storyId, currentWorldState, createWorldState, chapterNumber]);

  const handleCreateSnapshot = () => {
    if (currentWorldState) {
      const description = `Chapter ${currentWorldState.chapterNumber} snapshot`;
      useWorldStateStore.getState().createSnapshot(currentWorldState.id, description);
    }
  };

  const renderTabContent = () => {
    if (!currentWorldState) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Initializing world state...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewTab worldState={currentWorldState} />;
      case 'characters':
        return <CharactersTab worldState={currentWorldState} characters={characters} />;
      case 'locations':
        return <LocationsTab worldState={currentWorldState} />;
      case 'events':
        return <EventsTab worldState={currentWorldState} />;
      case 'consistency':
        return <ConsistencyTab results={consistencyResults} />;
      default:
        return null;
    }
  };

  return (
    <div className="world-state-monitor bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              World State Monitor
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Chapter {currentWorldState?.chapterNumber || chapterNumber || 1}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              {criticalIssues.length > 0 && (
                <div className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-sm font-medium">{criticalIssues.length} critical</span>
                </div>
              )}
              {warnings.length > 0 && (
                <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span className="text-sm font-medium">{warnings.length} warnings</span>
                </div>
              )}
              {criticalIssues.length === 0 && warnings.length === 0 && (
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm font-medium">Consistent</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={autoCheck}
                  onChange={(e) => setAutoCheck(e.target.checked)}
                  className="rounded"
                />
                Auto-check
              </label>
              <button
                onClick={handleCreateSnapshot}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                disabled={!currentWorldState}
              >
                Snapshot
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '🌍' },
            { id: 'characters', label: 'Characters', icon: '👥' },
            { id: 'locations', label: 'Locations', icon: '📍' },
            { id: 'events', label: 'Events', icon: '📅' },
            { id: 'consistency', label: 'Consistency', icon: '✓' }
          ].map((tab: { id: MonitorTab; label: string; icon: string }) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{ worldState: WorldState }> = ({ worldState }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {worldState.state.characters.length}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Characters</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {worldState.state.locations.length}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Locations</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {worldState.state.events.length}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Events</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {worldState.changeLog.length}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Changes</div>
      </div>
    </div>

    {/* Recent Changes */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Changes</h3>
      <div className="space-y-3">
        {worldState.changeLog.slice(-5).reverse().map(change => (
          <div key={change.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                {change.changeType}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Chapter {change.chapterNumber}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {change.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{change.reason}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Characters Tab
const CharactersTab: React.FC<{
  worldState: WorldState;
  characters: Character[];
}> = ({ worldState, characters }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Character States</h3>
    <div className="grid gap-4">
      {worldState.state.characters.map(charState => {
        const character = characters.find(c => c.id === charState.characterId);
        return (
          <div key={charState.characterId} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {character?.name || charState.name}
              </h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                charState.status === 'alive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                charState.status === 'injured' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                charState.status === 'dead' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }`}>
                {charState.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Level</div>
                <div className="font-medium text-gray-900 dark:text-white">{charState.level}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Experience</div>
                <div className="font-medium text-gray-900 dark:text-white">{charState.experience}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Location</div>
                <div className="font-medium text-gray-900 dark:text-white">{charState.location || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Items</div>
                <div className="font-medium text-gray-900 dark:text-white">{charState.inventory.length}</div>
              </div>
            </div>

            {Object.keys(charState.flags).length > 0 && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Flags</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(charState.flags).map(([flag, value]) => (
                    <span key={flag} className={`px-2 py-1 rounded text-xs ${
                      value ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// Locations Tab
const LocationsTab: React.FC<{ worldState: WorldState }> = ({ worldState }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Location States</h3>
    <div className="grid gap-4">
      {worldState.state.locations.map(location => (
        <div key={location.locationId} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{location.name}</h4>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Occupants</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {location.currentOccupants.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Time of Day</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {location.timeOfDay || 'Unknown'}
              </div>
            </div>
          </div>

          {location.currentOccupants.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Current Occupants</div>
              <div className="flex flex-wrap gap-1">
                {location.currentOccupants.map(occupant => (
                  <span key={occupant} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                    {occupant}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Events Tab
const EventsTab: React.FC<{ worldState: WorldState }> = ({ worldState }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Story Events</h3>
    <div className="grid gap-4">
      {worldState.state.events.map(event => (
        <div key={event.eventId} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{event.name}</h4>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              event.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              event.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              event.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {event.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Participants</div>
              <div className="font-medium text-gray-900 dark:text-white">{event.participants.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Chapter Range</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {event.startChapter ? `${event.startChapter}${event.endChapter ? `-${event.endChapter}` : '+'}` : 'TBD'}
              </div>
            </div>
          </div>

          {event.consequences.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Consequences</div>
              <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                {event.consequences.map((consequence, index) => (
                  <li key={index}>{consequence}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Consistency Tab
const ConsistencyTab: React.FC<{ results: ConsistencyResult[] }> = ({ results }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consistency Check Results</h3>

    {results.length === 0 ? (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No consistency issues detected
      </div>
    ) : (
      <div className="space-y-3">
        {results.map(result => (
          <div key={result.id} className={`p-4 rounded-lg border-l-4 ${
            result.severity >= 4 ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
            result.severity >= 2 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
            'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">{result.description}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                result.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                result.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {result.type}
              </span>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{result.details}</p>

            {result.suggestedFix && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Suggested fix:</strong> {result.suggestedFix}
              </div>
            )}

            {result.autoFixable && (
              <button className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors">
                Auto-fix
              </button>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default WorldStateMonitor;
