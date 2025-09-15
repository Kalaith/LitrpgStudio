import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '../stores/characterStore';
import type { Character, StoryReference, CharacterCrossReference } from '../types/character';

interface CharacterDashboardProps {
  character: Character;
}

interface TabConfig {
  id: string;
  label: string;
  icon: string;
}

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: '👤' },
  { id: 'story-presence', label: 'Story Presence', icon: '📖' },
  { id: 'relationships', label: 'Relationships', icon: '🤝' },
  { id: 'progression', label: 'Progression', icon: '📈' },
  { id: 'cross-references', label: 'References', icon: '🔗' }
];

export const CharacterDashboard: React.FC<CharacterDashboardProps> = ({ character }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { getCrossReferences, addCrossReference, removeCrossReference } = useCharacterStore();

  const crossReferences = useMemo(() =>
    getCrossReferences(character.id, 'character'),
    [character.id, getCrossReferences]
  );

  const storyAppearances = useMemo(() => {
    const appearances = new Map<string, StoryReference[]>();
    character.storyReferences.forEach(ref => {
      if (!appearances.has(ref.storyId)) {
        appearances.set(ref.storyId, []);
      }
      appearances.get(ref.storyId)!.push(ref);
    });
    return appearances;
  }, [character.storyReferences]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab character={character} />;
      case 'story-presence':
        return <StoryPresenceTab appearances={storyAppearances} />;
      case 'relationships':
        return <RelationshipsTab character={character} />;
      case 'progression':
        return <ProgressionTab character={character} />;
      case 'cross-references':
        return <CrossReferencesTab
          crossReferences={crossReferences}
          characterId={character.id}
          onAddReference={addCrossReference}
          onRemoveReference={removeCrossReference}
        />;
      default:
        return <OverviewTab character={character} />;
    }
  };

  return (
    <div className="character-dashboard bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Character Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
          {character.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {character.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Level {character.level} {character.race} {character.class}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
            {character.storyReferences.length} story mentions
          </span>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
            {crossReferences.length} cross-references
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
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

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="min-h-[400px]"
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ character: Character }> = ({ character }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Basic Stats */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stats</h3>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(character.stats).map(([stat, value]) => (
          <div key={stat} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {stat.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {typeof value === 'number' ? value : 0}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Character Details */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Details</h3>
      <div className="space-y-3">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Experience</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {character.experience} XP
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Skills</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {character.skills.length} skills
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Equipment</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {character.equipment.filter(item => item.equipped).length} equipped
          </div>
        </div>
      </div>
    </div>

    {/* Backstory */}
    {character.backstory && (
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Backstory</h3>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {character.backstory}
          </p>
        </div>
      </div>
    )}
  </div>
);

// Story Presence Tab Component
const StoryPresenceTab: React.FC<{ appearances: Map<string, StoryReference[]> }> = ({ appearances }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Story Appearances</h3>
    {appearances.size === 0 ? (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No story appearances recorded
      </div>
    ) : (
      <div className="space-y-4">
        {Array.from(appearances.entries()).map(([storyId, references]) => (
          <div key={storyId} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Story: {storyId}
            </h4>
            <div className="grid gap-3">
              {references.map((ref, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      ref.importanceLevel === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      ref.importanceLevel === 'major' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      ref.importanceLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {ref.importanceLevel}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {ref.mentionType}
                    </span>
                    {ref.chapterNumber && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Chapter {ref.chapterNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {ref.context}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Relationships Tab Component
const RelationshipsTab: React.FC<{ character: Character }> = ({ character }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Relationships</h3>
    {character.relationships.length === 0 ? (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No relationships defined
      </div>
    ) : (
      <div className="grid gap-4">
        {character.relationships.map((relationship, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                relationship.type === 'ally' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                relationship.type === 'enemy' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                relationship.type === 'romantic' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                relationship.type === 'family' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }`}>
                {relationship.type}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded ${
                      i < relationship.strength ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  {relationship.strength}/10
                </span>
              </div>
            </div>
            {relationship.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {relationship.description}
              </p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

// Progression Tab Component
const ProgressionTab: React.FC<{ character: Character }> = ({ character }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Level Progression</h3>
    {character.progression.length === 0 ? (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No progression data available
      </div>
    ) : (
      <div className="space-y-4">
        {character.progression.map((level, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Level {level.level}
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Experience Required: {level.experienceRequired}
            </div>
            {level.skillsUnlocked.length > 0 && (
              <div className="mb-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Skills Unlocked:
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {level.skillsUnlocked.map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

// Cross References Tab Component
const CrossReferencesTab: React.FC<{
  crossReferences: CharacterCrossReference[];
  characterId: string;
  onAddReference: (ref: Omit<CharacterCrossReference, 'id'>) => void;
  onRemoveReference: (id: string) => void;
}> = ({ crossReferences, onRemoveReference }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cross References</h3>
      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
        Add Reference
      </button>
    </div>

    {crossReferences.length === 0 ? (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No cross-references found
      </div>
    ) : (
      <div className="space-y-4">
        {crossReferences.map((ref) => (
          <div key={ref.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                  {ref.sourceType} → {ref.targetType}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {ref.relationshipType}
                </span>
              </div>
              <button
                onClick={() => onRemoveReference(ref.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Strength:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded ${
                      i < ref.strength ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  {ref.strength}/10
                </span>
              </div>
            </div>
            {ref.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {ref.description}
              </p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default CharacterDashboard;