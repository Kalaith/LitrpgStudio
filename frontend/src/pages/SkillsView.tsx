import { useState, useEffect } from 'react';
import SkillTreeVisualizer, { SkillTree } from '../components/SkillTreeVisualizer';

interface Character {
  id: string;
  name: string;
  skills: CharacterSkill[];
  skillPoints: number;
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
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [skillTrees, setSkillTrees] = useState<SkillTree[]>([]);
  const [selectedTree, setSelectedTree] = useState<string>('');
  
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

    // Initialize default skill trees
    const defaultTrees: SkillTree[] = [
      {
        id: 'combat',
        name: 'Combat Skills',
        description: 'Physical and magical combat abilities',
        nodes: [
          {
            id: 'sword-mastery',
            name: 'Sword Mastery',
            description: 'Increases damage and accuracy with sword weapons',
            tier: 1,
            maxLevel: 10,
            currentLevel: 0,
            prerequisites: [],
            cost: 1,
            unlocked: true,
            skillType: 'passive',
            category: 'combat',
            effects: ['+5% sword damage per level', '+2% critical chance per level'],
            icon: '⚔️'
          },
          {
            id: 'power-strike',
            name: 'Power Strike',
            description: 'A devastating melee attack that deals massive damage',
            tier: 2,
            maxLevel: 5,
            currentLevel: 0,
            prerequisites: ['sword-mastery'],
            cost: 2,
            unlocked: false,
            skillType: 'active',
            category: 'combat',
            effects: ['150% weapon damage', '+10% damage per level'],
            icon: '💥'
          },
          {
            id: 'defensive-stance',
            name: 'Defensive Stance',
            description: 'Reduces damage taken but lowers attack speed',
            tier: 1,
            maxLevel: 5,
            currentLevel: 0,
            prerequisites: [],
            cost: 1,
            unlocked: true,
            skillType: 'toggle',
            category: 'combat',
            effects: ['-20% damage taken', '-15% attack speed', '+5% damage reduction per level'],
            icon: '🛡️'
          }
        ],
        connections: [
          { from: 'sword-mastery', to: 'power-strike', type: 'prerequisite' }
        ]
      },
      {
        id: 'magic',
        name: 'Magic Skills',
        description: 'Arcane and elemental magic abilities',
        nodes: [
          {
            id: 'fire-bolt',
            name: 'Fire Bolt',
            description: 'Launches a bolt of fire at enemies',
            tier: 1,
            maxLevel: 10,
            currentLevel: 0,
            prerequisites: [],
            cost: 1,
            unlocked: true,
            skillType: 'active',
            category: 'magic',
            effects: ['50 base fire damage', '+10 damage per level', '5% burn chance'],
            icon: '🔥'
          },
          {
            id: 'ice-shard',
            name: 'Ice Shard',
            description: 'Fires sharp ice projectiles that slow enemies',
            tier: 1,
            maxLevel: 10,
            currentLevel: 0,
            prerequisites: [],
            cost: 1,
            unlocked: true,
            skillType: 'active',
            category: 'magic',
            effects: ['40 base ice damage', '+8 damage per level', '20% slow effect'],
            icon: '❄️'
          },
          {
            id: 'meteor',
            name: 'Meteor',
            description: 'Calls down a devastating meteor from the sky',
            tier: 3,
            maxLevel: 5,
            currentLevel: 0,
            prerequisites: ['fire-bolt'],
            cost: 3,
            unlocked: false,
            skillType: 'active',
            category: 'magic',
            effects: ['300 base fire damage', '+50 damage per level', 'Area of effect'],
            icon: '☄️'
          }
        ],
        connections: [
          { from: 'fire-bolt', to: 'meteor', type: 'prerequisite' }
        ]
      }
    ];

    setSkillTrees(defaultTrees);
    if (defaultTrees.length > 0) {
      setSelectedTree(defaultTrees[0].id);
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

  const handleSkillUpgrade = (skillId: string) => {
    if (!selectedCharacter) return;

    const character = characters.find(c => c.id === selectedCharacter);
    if (!character || !character.skillPoints || character.skillPoints <= 0) return;

    const updatedTrees = skillTrees.map(tree => {
      if (tree.id === selectedTree) {
        return {
          ...tree,
          nodes: tree.nodes.map(node => {
            if (node.id === skillId && node.currentLevel < node.maxLevel) {
              // Check prerequisites
              const hasPrerequisites = node.prerequisites.every(prereqId => {
                const prereq = tree.nodes.find(n => n.id === prereqId);
                return prereq?.currentLevel > 0;
              });

              if (hasPrerequisites && character.skillPoints >= node.cost) {
                return { ...node, currentLevel: node.currentLevel + 1 };
              }
            }
            return node;
          })
        };
      }
      return tree;
    });

    // Update character skill points
    const updatedCharacters = characters.map(char => {
      if (char.id === selectedCharacter) {
        const skill = skillTrees.find(t => t.id === selectedTree)?.nodes.find(n => n.id === skillId);
        return {
          ...char,
          skillPoints: char.skillPoints - (skill?.cost || 1)
        };
      }
      return char;
    });

    setSkillTrees(updatedTrees);
    setCharacters(updatedCharacters);
    localStorage.setItem('characters', JSON.stringify(updatedCharacters));
  };

  const handleSkillReset = (skillId: string) => {
    if (!selectedCharacter) return;

    const character = characters.find(c => c.id === selectedCharacter);
    if (!character) return;

    const updatedTrees = skillTrees.map(tree => {
      if (tree.id === selectedTree) {
        return {
          ...tree,
          nodes: tree.nodes.map(node => {
            if (node.id === skillId) {
              const pointsToRefund = node.currentLevel * node.cost;

              // Reset skill
              const resetNode = { ...node, currentLevel: 0 };

              // Update character skill points
              const updatedCharacters = characters.map(char => {
                if (char.id === selectedCharacter) {
                  return {
                    ...char,
                    skillPoints: (char.skillPoints || 0) + pointsToRefund
                  };
                }
                return char;
              });

              setCharacters(updatedCharacters);
              localStorage.setItem('characters', JSON.stringify(updatedCharacters));

              return resetNode;
            }
            return node;
          })
        };
      }
      return tree;
    });

    setSkillTrees(updatedTrees);
  };

  const getCurrentSkillTree = (): SkillTree | undefined => {
    return skillTrees.find(tree => tree.id === selectedTree);
  };

  const getCharacterSkillPoints = (): number => {
    if (!selectedCharacter) return 0;
    const character = characters.find(c => c.id === selectedCharacter);
    return character?.skillPoints || 0;
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
              <option key={char.id} value={char.id}>
                {char.name} ({char.skillPoints || 0} pts)
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
            {['list', 'tree'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`
                  px-3 py-1 text-sm capitalize
                  ${viewMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                {mode} View
              </button>
            ))}
          </div>

          {viewMode === 'tree' && (
            <select
              className="input max-w-xs"
              value={selectedTree}
              onChange={(e) => setSelectedTree(e.target.value)}
            >
              <option value="">Select Skill Tree</option>
              {skillTrees.map(tree => (
                <option key={tree.id} value={tree.id}>{tree.name}</option>
              ))}
            </select>
          )}

          {viewMode === 'list' && (
            <button className="btn-primary" onClick={handleCreateSkill}>+ Add New Skill</button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
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
      ) : (
        // Skill Tree View
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {selectedTree && getCurrentSkillTree() ? (
            <SkillTreeVisualizer
              skillTree={getCurrentSkillTree()!}
              availablePoints={getCharacterSkillPoints()}
              onSkillUpgrade={handleSkillUpgrade}
              onSkillReset={handleSkillReset}
              readonly={!selectedCharacter}
            />
          ) : (
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">🌳</div>
              <h3 className="text-xl font-semibold mb-2">Select a Skill Tree</h3>
              <p className="text-gray-400">Choose a character and skill tree to view the skill tree visualizer</p>
            </div>
          )}
        </div>
      )}

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
