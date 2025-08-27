import { useState, useEffect } from 'react';

interface Character {
  id: string;
  name: string;
  skills: CharacterSkill[];
}

interface Skill {
  id: string;
  name: string;
  description: string;
  baseLevel: number;
}

interface CharacterSkill extends Skill {
  currentLevel: number;
}

const SkillsView: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isEditingSkill, setIsEditingSkill] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  
  // Load characters and skills from localStorage
  useEffect(() => {
    const savedCharacters = localStorage.getItem('characters');
    if (savedCharacters) {
      setCharacters(JSON.parse(savedCharacters));
    }

    const savedSkills = localStorage.getItem('skills');
    if (savedSkills) {
      setSkills(JSON.parse(savedSkills));
    }
  }, []);

  const handleCreateSkill = () => {
    setEditingSkill({
      id: crypto.randomUUID(),
      name: '',
      description: '',
      baseLevel: 1
    });
    setIsEditingSkill(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setIsEditingSkill(true);
  };

  const handleSaveSkill = (skill: Skill) => {
    let updatedSkills: Skill[];
    if (skills.some(s => s.id === skill.id)) {
      updatedSkills = skills.map(s => s.id === skill.id ? skill : s);
    } else {
      updatedSkills = [...skills, skill];
    }
    setSkills(updatedSkills);
    localStorage.setItem('skills', JSON.stringify(updatedSkills));
    setIsEditingSkill(false);
    setEditingSkill(null);
  };

  const handleAssignSkill = (skill: Skill) => {
    if (!selectedCharacter) return;

    const updatedCharacters = characters.map(char => {
      if (char.id === selectedCharacter) {
        // Check if character already has this skill
        if (char.skills?.some(s => s.id === skill.id)) return char;

        const characterSkill: CharacterSkill = {
          ...skill,
          currentLevel: skill.baseLevel
        };

        return {
          ...char,
          skills: [...(char.skills || []), characterSkill]
        };
      }
      return char;
    });

    setCharacters(updatedCharacters);
    localStorage.setItem('characters', JSON.stringify(updatedCharacters));
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Skills Management</h2>
        <div className="flex gap-4 items-center">
          <select 
            className="input max-w-xs"
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
          >
            <option value="">Select Character</option>
            {characters.map(char => (
              <option key={char.id} value={char.id}>{char.name}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={handleCreateSkill}>+ Add New Skill</button>
        </div>
      </div>
      
      <div className="flex gap-6">
        <div className="w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 className="font-semibold mb-4">Available Skills</h4>
          <div className="space-y-3">
            {skills.map(skill => (
              <div 
                key={skill.id} 
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{skill.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{skill.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      onClick={() => handleEditSkill(skill)}
                    >
                      Edit
                    </button>
                    {selectedCharacter && (
                      <button 
                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        onClick={() => handleAssignSkill(skill)}
                      >
                        Assign
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Base Level: {skill.baseLevel}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 className="font-semibold mb-4">
            {selectedCharacter 
              ? `${characters.find(c => c.id === selectedCharacter)?.name}'s Skills` 
              : 'Select a Character to View Their Skills'}
          </h4>
          {selectedCharacter && (
            <div className="space-y-3">
              {characters.find(c => c.id === selectedCharacter)?.skills?.map((skill) => (
                <div 
                  key={skill.id} 
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{skill.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{skill.description}</div>
                    </div>
                    <div className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                      Level {skill.currentLevel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isEditingSkill && editingSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              {editingSkill.name ? 'Edit Skill' : 'Create New Skill'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  className="input"
                  value={editingSkill.name}
                  onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                  placeholder="Skill name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="input min-h-[100px]"
                  value={editingSkill.description}
                  onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
                  placeholder="Skill description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Base Level</label>
                <input
                  type="number"
                  className="input"
                  value={editingSkill.baseLevel}
                  onChange={(e) => setEditingSkill({ 
                    ...editingSkill, 
                    baseLevel: parseInt(e.target.value) || 1 
                  })}
                  min="1"
                  max="100"
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    setIsEditingSkill(false);
                    setEditingSkill(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => handleSaveSkill(editingSkill)}
                >
                  {editingSkill.name ? 'Update' : 'Create'} Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsView;
