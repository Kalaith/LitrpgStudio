import { useState, useEffect } from 'react';
import CharacterForm from '../CharacterForm';

interface CharacterSkill {
  name: string;
  level: number;
  description: string;
}

interface CharacterAbility {
  name: string;
  description: string;
  cooldown?: number;
}

interface Character {
  id: string;
  name: string;
  level: number;
  class: string;
  stats: {
    [key: string]: number;
  };
  skills: CharacterSkill[];
  abilities: CharacterAbility[];
}

interface CharacterManagerProps {
  isCreating?: boolean;
  onCreateComplete?: () => void;
}

const CharacterManager: React.FC<CharacterManagerProps> = ({
  isCreating = false,
  onCreateComplete
}) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isCreatingLocal, setIsCreatingLocal] = useState(false);

  // Update local creating state when prop changes
  useEffect(() => {
    if (isCreating) {
      setIsCreatingLocal(true);
    }
  }, [isCreating]);

  useEffect(() => {
    const savedCharacters = localStorage.getItem('characters');
    if (savedCharacters) {
      setCharacters(JSON.parse(savedCharacters));
    }
  }, []);

  const handleSave = (character: Character) => {
    let updatedCharacters;
    if (editingCharacter) {
      updatedCharacters = characters.map(c => 
        c.id === character.id ? character : c
      );
    } else {
      updatedCharacters = [...characters, character];
    }
    
    setCharacters(updatedCharacters);
    localStorage.setItem('characters', JSON.stringify(updatedCharacters));
    setEditingCharacter(null);
    setIsCreatingLocal(false);
    onCreateComplete?.();
  };

  const handleDelete = (id: string) => {
    const updatedCharacters = characters.filter(c => c.id !== id);
    setCharacters(updatedCharacters);
    localStorage.setItem('characters', JSON.stringify(updatedCharacters));
  };

  if (isCreatingLocal || editingCharacter) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">
            {isCreatingLocal ? 'Create New Character' : 'Edit Character'}
          </h2>
          <CharacterForm
            initialCharacter={editingCharacter || undefined}
            onSubmit={handleSave}
            onCancel={() => {
              setEditingCharacter(null);
              setIsCreatingLocal(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Character Management</h2>
        <button className="btn-primary" onClick={() => setIsCreatingLocal(true)}>
          + Add Character
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map(character => (
          <div key={character.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{character.name}</h3>
              <div className="space-x-2">
                <button 
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  onClick={() => setEditingCharacter(character)}
                >
                  Edit
                </button>
                <button 
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  onClick={() => handleDelete(character.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Level {character.level} {character.class}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {Object.entries(character.stats).map(([stat, value]) => (
                <div key={stat} className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{stat}:</span>{' '}
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>            {character.skills?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Skills</h4>
                <div className="space-y-1">
                  {character.skills.map((skill, index) => (
                    <div key={index} className="text-sm">
                      {skill.name} (Level {skill.level})
                    </div>
                  ))}
                </div>
              </div>
            )}
            {character.abilities?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Abilities</h4>
                <div className="space-y-1">
                  {character.abilities.map((ability, index) => (
                    <div key={index} className="text-sm">
                      {ability.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterManager;
