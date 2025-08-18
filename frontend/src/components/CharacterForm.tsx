import { useState } from 'react';

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

interface CharacterFormProps {
  initialCharacter?: Character;
  onSubmit: (character: Character) => void;
  onCancel: () => void;
}

const CharacterForm: React.FC<CharacterFormProps> = ({
  initialCharacter,
  onSubmit,
  onCancel
}) => {
  const defaultCharacter: Character = {
    id: crypto.randomUUID(),
    name: '',
    level: 1,
    class: 'Adventurer',
    stats: {
      Strength: 10,
      Dexterity: 10,
      Constitution: 10,
      Intelligence: 10,
      Wisdom: 10,
      Charisma: 10,
    },
    skills: [],
    abilities: []
  };

  const [character, setCharacter] = useState<Character>({
    ...defaultCharacter,
    ...initialCharacter,
    // Ensure these arrays exist even if initialCharacter is provided
    skills: initialCharacter?.skills || [],
    abilities: initialCharacter?.abilities || []
  });

  const [newSkill, setNewSkill] = useState({ name: '', level: 1, description: '' });
  const [newAbility, setNewAbility] = useState({ name: '', description: '', cooldown: 0 });

  const handleStatChange = (stat: string, value: number) => {
    setCharacter(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: value }
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.name) {
      setCharacter(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
      setNewSkill({ name: '', level: 1, description: '' });
    }
  };

  const handleAddAbility = () => {
    if (newAbility.name) {
      setCharacter(prev => ({
        ...prev,
        abilities: [...prev.abilities, newAbility]
      }));
      setNewAbility({ name: '', description: '', cooldown: 0 });
    }
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            className="input"
            placeholder="Character name"
            value={character.name}
            onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Class</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Warrior, Mage, Rogue"
            value={character.class}
            onChange={(e) => setCharacter(prev => ({ ...prev, class: e.target.value }))}
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Base Stats</h3>
        <div className="grid grid-cols-3 gap-6">
          {Object.entries(character.stats).map(([stat, value]) => (
            <div key={stat}>
              <label className="block text-sm font-medium mb-2">{stat}</label>
              <input
                type="number"
                className="input"
                value={value}
                min="1"
                max="100"
                onChange={(e) => handleStatChange(stat, parseInt(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </div>      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Skills</h3>
        <div className="space-y-6">
          {character.skills.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {character.skills.map((skill, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{skill.name}</div>
                    <div className="px-2 py-1 text-sm bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                      Level {skill.level}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{skill.description}</div>
                </div>
              ))}
            </div>
          )}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Add New Skill</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Skill name"
                className="input"
                value={newSkill.name}
                onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Level"
                className="input"
                min="1"
                max="100"
                value={newSkill.level}
                onChange={(e) => setNewSkill(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
              />
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Description"
                  className="input"
                  value={newSkill.description}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <button className="btn-secondary col-span-2" onClick={handleAddSkill}>Add Skill</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Abilities</h3>
        <div className="space-y-6">
          {character.abilities.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {character.abilities.map((ability, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{ability.name}</div>                    {ability.cooldown && ability.cooldown > 0 && (
                      <div className="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        {ability.cooldown}s CD
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{ability.description}</div>
                </div>
              ))}
            </div>
          )}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Add New Ability</h4>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Ability name"
                className="input"
                value={newAbility.name}
                onChange={(e) => setNewAbility(prev => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Cooldown (seconds)"
                className="input"
                min="0"
                value={newAbility.cooldown}
                onChange={(e) => setNewAbility(prev => ({ ...prev, cooldown: parseInt(e.target.value) || 0 }))}
              />
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Description"
                  className="input"
                  value={newAbility.description}
                  onChange={(e) => setNewAbility(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <button className="btn-secondary col-span-2" onClick={handleAddAbility}>Add Ability</button>
            </div>
          </div>
        </div>
      </div>      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button className="btn-secondary px-6" onClick={onCancel}>Cancel</button>
        <button 
          className="btn-primary px-6 flex items-center gap-2" 
          onClick={() => onSubmit(character)}
        >
          {initialCharacter ? 'Update' : 'Create'} Character
        </button>
      </div>
    </div>
  );
};

export default CharacterForm;
