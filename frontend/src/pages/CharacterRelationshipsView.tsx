import { useState } from 'react';
import { useStoryStore } from '../stores/storyStore';
import { useCharacterStore } from '../stores/characterStore';
import CharacterRelationshipMap from '../components/CharacterRelationshipMap';
import { Character, CharacterRelationship } from '../types';
import { motion } from 'framer-motion';

export default function CharacterRelationshipsView() {
  const { currentStory } = useStoryStore();
  const { characters } = useCharacterStore();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showAddRelationship, setShowAddRelationship] = useState(false);

  const getAllCharacters = () => {
    if (!currentStory) return characters;

    // Combine story characters with global characters
    const storyCharacters = [currentStory.mainCharacter, ...currentStory.supportingCharacters];
    const uniqueCharacters = new Map<string, Character>();

    [...storyCharacters, ...characters].forEach(char => {
      if (char && !uniqueCharacters.has(char.id)) {
        uniqueCharacters.set(char.id, char);
      }
    });

    return Array.from(uniqueCharacters.values());
  };

  const allCharacters = getAllCharacters();

  const getRelationships = () => {
    const relationships: Array<{
      sourceId: string;
      targetId: string;
      type: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family';
      strength: number;
    }> = [];

    allCharacters.forEach(character => {
      if (character.relationships) {
        character.relationships.forEach(rel => {
          relationships.push({
            sourceId: character.id,
            targetId: rel.characterId,
            type: rel.type,
            strength: rel.strength
          });
        });
      }
    });

    return relationships;
  };

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacter(character);
  };

  const getRelatedCharacters = (character: Character) => {
    if (!character.relationships) return [];

    return character.relationships.map(rel => {
      const relatedChar = allCharacters.find(c => c.id === rel.characterId);
      return relatedChar ? { character: relatedChar, relationship: rel } : null;
    }).filter(Boolean) as Array<{ character: Character; relationship: CharacterRelationship }>;
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Character Relationships</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize and manage character connections in your story
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {allCharacters.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No characters found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create some characters first to see their relationships
            </p>
            <button className="btn-primary">
              Create Character
            </button>
          </div>
        ) : (
          <div className="flex gap-6">
            <div className="flex-1">
              <CharacterRelationshipMap
                characters={allCharacters}
                relationships={getRelationships()}
                onNodeClick={handleCharacterClick}
              />
            </div>
          </div>
        )}
      </div>

      {selectedCharacter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">{selectedCharacter.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Level {selectedCharacter.level} {selectedCharacter.class}
              </p>
            </div>
            <button
              onClick={() => setShowAddRelationship(!showAddRelationship)}
              className="btn-secondary"
            >
              Add Relationship
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Character Details</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Race:</strong> {selectedCharacter.race}</p>
                <p><strong>Experience:</strong> {selectedCharacter.experience}</p>
                <p><strong>Skills:</strong> {selectedCharacter.skills.length} total</p>
                <p><strong>Equipment:</strong> {selectedCharacter.equipment.length} items</p>
              </div>

              {selectedCharacter.backstory && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Backstory</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedCharacter.backstory}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3">Relationships ({getRelatedCharacters(selectedCharacter).length})</h4>
              <div className="space-y-3">
                {getRelatedCharacters(selectedCharacter).length === 0 ? (
                  <p className="text-gray-500 text-sm">No relationships defined</p>
                ) : (
                  getRelatedCharacters(selectedCharacter).map(({ character, relationship }) => (
                    <div
                      key={character.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`
                            w-3 h-3 rounded-full
                            ${relationship.type === 'ally' ? 'bg-green-500' :
                              relationship.type === 'enemy' ? 'bg-red-500' :
                              relationship.type === 'romantic' ? 'bg-pink-500' :
                              relationship.type === 'family' ? 'bg-purple-500' :
                              'bg-gray-500'}
                          `} />
                        </div>
                        <div>
                          <p className="font-medium">{character.name}</p>
                          <p className="text-xs text-gray-500">
                            {relationship.type} • Strength: {relationship.strength}/10
                          </p>
                        </div>
                      </div>
                      <button className="text-xs text-blue-600 hover:text-blue-800">
                        Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {showAddRelationship && selectedCharacter && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Add Relationship for {selectedCharacter.name}
            </h3>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Character</label>
                <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded">
                  <option value="">Select a character...</option>
                  {allCharacters
                    .filter(c => c.id !== selectedCharacter.id)
                    .map(character => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Relationship Type</label>
                <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded">
                  <option value="ally">Ally</option>
                  <option value="enemy">Enemy</option>
                  <option value="neutral">Neutral</option>
                  <option value="romantic">Romantic</option>
                  <option value="family">Family</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Strength (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  defaultValue="5"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  rows={3}
                  placeholder="Describe their relationship..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddRelationship(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Relationship
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}