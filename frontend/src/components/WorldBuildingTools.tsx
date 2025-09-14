import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Location, Faction, WorldMap, WorldTimelineEvent } from '../types/story';

interface WorldBuildingToolsProps {
  worldDetails: any;
  onUpdate: (updates: any) => void;
}

type ActiveTab = 'locations' | 'factions' | 'maps' | 'timeline' | 'overview';

export default function WorldBuildingTools({ worldDetails, onUpdate }: WorldBuildingToolsProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const locations = worldDetails?.locations || [];
  const factions = worldDetails?.factions || [];
  const maps = worldDetails?.maps || [];
  const timeline = worldDetails?.timeline || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🌍' },
    { id: 'locations', label: 'Locations', icon: '🏰', count: locations.length },
    { id: 'factions', label: 'Factions', icon: '⚔️', count: factions.length },
    { id: 'maps', label: 'Maps', icon: '🗺️', count: maps.length },
    { id: 'timeline', label: 'Timeline', icon: '⏰', count: timeline.length },
  ];

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">World Name</label>
          <input
            type="text"
            value={worldDetails?.name || ''}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
            placeholder="Enter world name..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={worldDetails?.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-24"
            placeholder="Describe your world..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Magic System</label>
          <textarea
            value={worldDetails?.magicSystem || ''}
            onChange={(e) => onUpdate({ magicSystem: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-20"
            placeholder="How does magic work in your world?"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Technology Level</label>
          <select
            value={worldDetails?.technology || ''}
            onChange={(e) => onUpdate({ technology: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
          >
            <option value="">Select technology level...</option>
            <option value="stone-age">Stone Age</option>
            <option value="bronze-age">Bronze Age</option>
            <option value="iron-age">Iron Age</option>
            <option value="medieval">Medieval</option>
            <option value="renaissance">Renaissance</option>
            <option value="industrial">Industrial</option>
            <option value="modern">Modern</option>
            <option value="futuristic">Futuristic</option>
            <option value="mixed">Mixed/Varied</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Political Structure</label>
          <textarea
            value={worldDetails?.politics || ''}
            onChange={(e) => onUpdate({ politics: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-20"
            placeholder="Describe the political landscape..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Geography</label>
          <textarea
            value={worldDetails?.geography || ''}
            onChange={(e) => onUpdate({ geography: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-20"
            placeholder="Describe the physical world..."
          />
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-xl font-bold">{locations.length}</div>
            <div className="text-xs text-gray-600">Locations</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-xl font-bold">{factions.length}</div>
            <div className="text-xs text-gray-600">Factions</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-xl font-bold">{maps.length}</div>
            <div className="text-xs text-gray-600">Maps</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-xl font-bold">{timeline.length}</div>
            <div className="text-xs text-gray-600">Events</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocationsTab = () => (
    <div className="flex gap-6">
      <div className="w-1/3">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Locations</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary text-sm"
          >
            Add Location
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {locations.map((location: Location) => (
            <div
              key={location.id}
              onClick={() => setSelectedLocation(location)}
              className={`
                p-3 border rounded cursor-pointer transition-colors
                ${selectedLocation?.id === location.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="font-medium">{location.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {location.type} • {location.size}
              </div>
              {location.population && (
                <div className="text-xs text-gray-500">
                  Pop: {location.population.toLocaleString()}
                </div>
              )}
            </div>
          ))}

          {locations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No locations created yet
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        {selectedLocation ? (
          <LocationDetails
            location={selectedLocation}
            onUpdate={(updates) => {
              // Update location logic
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Select a location to view details
          </div>
        )}
      </div>
    </div>
  );

  const renderFactionsTab = () => (
    <div className="flex gap-6">
      <div className="w-1/3">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Factions</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary text-sm"
          >
            Add Faction
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {factions.map((faction: Faction) => (
            <div
              key={faction.id}
              onClick={() => setSelectedFaction(faction)}
              className={`
                p-3 border rounded cursor-pointer transition-colors
                ${selectedFaction?.id === faction.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="font-medium">{faction.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {faction.type} • Influence: {faction.influence}/100
              </div>
              <div className="text-xs text-gray-500 capitalize">{faction.status}</div>
            </div>
          ))}

          {factions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No factions created yet
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        {selectedFaction ? (
          <FactionDetails
            faction={selectedFaction}
            onUpdate={(updates) => {
              // Update faction logic
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Select a faction to view details
          </div>
        )}
      </div>
    </div>
  );

  const renderTimelineTab = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">World Timeline</h3>
        <button className="btn-primary text-sm">Add Event</button>
      </div>

      <div className="space-y-4">
        {timeline.map((event: WorldTimelineEvent) => (
          <div
            key={event.id}
            className="border border-gray-300 dark:border-gray-600 rounded p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{event.title}</h4>
              <span className="text-sm text-gray-500">{event.date}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {event.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className={`
                px-2 py-1 text-xs rounded-full
                ${event.type === 'war' ? 'bg-red-100 text-red-800' :
                  event.type === 'discovery' ? 'bg-blue-100 text-blue-800' :
                  event.type === 'political' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'}
              `}>
                {event.type}
              </span>
              {event.era && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                  {event.era}
                </span>
              )}
            </div>
          </div>
        ))}

        {timeline.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No timeline events created yet
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-600">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="bg-gray-200 dark:bg-gray-600 text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
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
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'locations' && renderLocationsTab()}
            {activeTab === 'factions' && renderFactionsTab()}
            {activeTab === 'timeline' && renderTimelineTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper components
function LocationDetails({ location, onUpdate }: { location: Location; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{location.name}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <input
            type="text"
            value={location.type}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Size</label>
          <input
            type="text"
            value={location.size}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
            readOnly
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={location.description}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-24"
          readOnly
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Population</label>
          <input
            type="number"
            value={location.population || ''}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Government</label>
          <input
            type="text"
            value={location.government || ''}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
            readOnly
          />
        </div>
      </div>

      {location.notableFeatures && location.notableFeatures.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Notable Features</label>
          <div className="flex flex-wrap gap-2">
            {location.notableFeatures.map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FactionDetails({ faction, onUpdate }: { faction: Faction; onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{faction.name}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <input
            type="text"
            value={faction.type}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <input
            type="text"
            value={faction.status}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
            readOnly
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={faction.description}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded h-24"
          readOnly
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Influence: {faction.influence}/100</label>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${faction.influence}%` }}
          />
        </div>
      </div>

      {faction.goals && faction.goals.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Goals</label>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {faction.goals.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}