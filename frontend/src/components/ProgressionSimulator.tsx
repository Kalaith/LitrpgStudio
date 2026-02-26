import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '../stores/characterStore';
import type { Character, CharacterStats } from '../types/character';

interface ProgressionSimulatorProps {
  character: Character;
  storyLength?: number; // Expected number of chapters
}

interface SimulationResult {
  level: number;
  chapter: number;
  experience: number;
  stats: CharacterStats;
  skillsUnlocked: string[];
  featuresUnlocked: string[];
  milestones: string[];
}

interface ProgressionSettings {
  experienceRate: number; // XP per chapter
  levelingCurve: 'linear' | 'exponential' | 'logarithmic';
  statGrowthRate: number;
  skillUnlockRate: number;
  customMilestones: Milestone[];
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  triggerLevel?: number;
  triggerChapter?: number;
  requirements?: {
    stats?: Partial<CharacterStats>;
    skills?: string[];
  };
  rewards?: {
    experience?: number;
    stats?: Partial<CharacterStats>;
    skills?: string[];
    features?: string[];
  };
}

type ProgressionView = 'simulator' | 'settings' | 'milestones';

export const ProgressionSimulator: React.FC<ProgressionSimulatorProps> = ({
  character,
  storyLength = 50
}) => {
  const [settings, setSettings] = useState<ProgressionSettings>({
    experienceRate: 1000,
    levelingCurve: 'exponential',
    statGrowthRate: 1.5,
    skillUnlockRate: 0.3,
    customMilestones: []
  });

  const [activeView, setActiveView] = useState<ProgressionView>('simulator');
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  const { updateCharacter } = useCharacterStore();

  // Run simulation when settings change
  useEffect(() => {
    const results = runProgressionSimulation(character, storyLength, settings);
    setSimulationResults(results);
  }, [character, storyLength, settings]);

  const currentResult = simulationResults.find(r => r.chapter === selectedChapter) || simulationResults[0];

  const handleApplyProgression = () => {
    if (currentResult) {
      updateCharacter(character.id, {
        level: currentResult.level,
        experience: currentResult.experience,
        stats: currentResult.stats,
        skills: [
          ...character.skills,
          ...currentResult.skillsUnlocked.map(skill => ({
            id: crypto.randomUUID(),
            name: skill,
            level: 1,
            experience: 0,
            description: `Unlocked at level ${currentResult.level}`,
            category: 'Combat' as const
          }))
        ]
      });
    }
  };

  return (
    <div className="progression-simulator bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Progression Simulator
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Simulate {character.name}'s growth through the story
          </p>
        </div>

        <div className="flex gap-2">
          {(['simulator', 'settings', 'milestones'] as ProgressionView[]).map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                activeView === view
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'simulator' && (
            <SimulatorView
              results={simulationResults}
              selectedChapter={selectedChapter}
              onChapterSelect={setSelectedChapter}
              currentResult={currentResult}
              onApplyProgression={handleApplyProgression}
              character={character}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              settings={settings}
              onSettingsChange={setSettings}
              character={character}
            />
          )}

          {activeView === 'milestones' && (
            <MilestonesView
              milestones={settings.customMilestones}
              onMilestonesChange={(milestones: Milestone[]) =>
                setSettings(prev => ({ ...prev, customMilestones: milestones }))
              }
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Simulator View Component
const SimulatorView: React.FC<{
  results: SimulationResult[];
  selectedChapter: number;
  onChapterSelect: (chapter: number) => void;
  currentResult: SimulationResult | undefined;
  onApplyProgression: () => void;
  character: Character;
}> = ({ results, selectedChapter, onChapterSelect, currentResult, onApplyProgression, character }) => (
  <div className="space-y-6">
    {/* Chapter Slider */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-lg font-semibold text-gray-900 dark:text-white">
          Chapter: {selectedChapter}
        </label>
        <button
          onClick={onApplyProgression}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          disabled={!currentResult}
        >
          Apply to Character
        </button>
      </div>

      <input
        type="range"
        min={1}
        max={results.length || 50}
        value={selectedChapter}
        onChange={(e) => onChapterSelect(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
      />

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Chapter 1</span>
        <span>Chapter {results.length || 50}</span>
      </div>
    </div>

    {currentResult && (
      <>
        {/* Current State Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Level & Experience</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Level</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currentResult.level} → {currentResult.level + 1}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentResult.experience % 1000) / 10}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {currentResult.experience.toLocaleString()} XP
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Stats Comparison</h3>
            <div className="space-y-2">
              {Object.entries(currentResult.stats).map(([stat, value]) => {
                const originalValue = character.stats[stat as keyof CharacterStats] as number || 0;
                const improvement = value - originalValue;

                return (
                  <div key={stat} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {stat.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {typeof value === 'number' ? value : 0}
                      </span>
                      {improvement > 0 && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          (+{improvement})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Unlocks</h3>
            <div className="space-y-3">
              {currentResult.skillsUnlocked.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Skills
                  </div>
                  <div className="space-y-1">
                    {currentResult.skillsUnlocked.slice(-3).map((skill, index) => (
                      <div key={index} className="text-xs text-blue-600 dark:text-blue-400">
                        • {skill}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentResult.featuresUnlocked.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Features
                  </div>
                  <div className="space-y-1">
                    {currentResult.featuresUnlocked.slice(-3).map((feature, index) => (
                      <div key={index} className="text-xs text-green-600 dark:text-green-400">
                        • {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentResult.milestones.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Milestones
                  </div>
                  <div className="space-y-1">
                    {currentResult.milestones.slice(-2).map((milestone, index) => (
                      <div key={index} className="text-xs text-purple-600 dark:text-purple-400">
                        🏆 {milestone}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progression Chart */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Progression Chart</h3>
          <div className="h-48 w-full">
            <ProgressionChart results={results} selectedChapter={selectedChapter} />
          </div>
        </div>
      </>
    )}
  </div>
);

// Settings View Component
const SettingsView: React.FC<{
  settings: ProgressionSettings;
  onSettingsChange: (settings: ProgressionSettings) => void;
  character: Character;
}> = ({ settings, onSettingsChange }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Experience Settings</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Experience per Chapter
          </label>
          <input
            type="number"
            value={settings.experienceRate}
            onChange={(e) => onSettingsChange({
              ...settings,
              experienceRate: parseInt(e.target.value) || 1000
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            min="100"
            max="10000"
            step="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Leveling Curve
          </label>
          <select
            value={settings.levelingCurve}
            onChange={(e) => onSettingsChange({
              ...settings,
              levelingCurve: e.target.value as ProgressionSettings['levelingCurve']
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="linear">Linear</option>
            <option value="exponential">Exponential</option>
            <option value="logarithmic">Logarithmic</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Growth Settings</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Stat Growth Rate ({settings.statGrowthRate}x)
          </label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={settings.statGrowthRate}
            onChange={(e) => onSettingsChange({
              ...settings,
              statGrowthRate: parseFloat(e.target.value)
            })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Skill Unlock Rate ({settings.skillUnlockRate} per level)
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={settings.skillUnlockRate}
            onChange={(e) => onSettingsChange({
              ...settings,
              skillUnlockRate: parseFloat(e.target.value)
            })}
            className="w-full"
          />
        </div>
      </div>
    </div>

    {/* Preview Current Settings */}
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Settings Preview</h4>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p>• Each chapter grants ~{settings.experienceRate} experience</p>
        <p>• Stats grow {settings.statGrowthRate}x faster than base rate</p>
        <p>• Unlocks ~{settings.skillUnlockRate} skills per level</p>
        <p>• Uses {settings.levelingCurve} leveling progression</p>
      </div>
    </div>
  </div>
);

// Milestones View Component
const MilestonesView: React.FC<{
  milestones: Milestone[];
  onMilestonesChange: (milestones: Milestone[]) => void;
}> = ({ milestones, onMilestonesChange }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Milestones</h3>
      <button
        onClick={() => {
          const newMilestone: Milestone = {
            id: crypto.randomUUID(),
            name: 'New Milestone',
            description: 'Achievement description',
            triggerLevel: 5
          };
          onMilestonesChange([...milestones, newMilestone]);
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Add Milestone
      </button>
    </div>

    <div className="space-y-4">
      {milestones.map((milestone, index) => (
        <div key={milestone.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <input
                type="text"
                value={milestone.name}
                onChange={(e) => {
                  const updated = [...milestones];
                  updated[index] = { ...milestone, name: e.target.value };
                  onMilestonesChange(updated);
                }}
                className="text-lg font-medium bg-transparent border-none text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
              />
            </div>
            <button
              onClick={() => onMilestonesChange(milestones.filter(m => m.id !== milestone.id))}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>

          <textarea
            value={milestone.description}
            onChange={(e) => {
              const updated = [...milestones];
              updated[index] = { ...milestone, description: e.target.value };
              onMilestonesChange(updated);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            rows={2}
            placeholder="Milestone description..."
          />

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Trigger Level
              </label>
              <input
                type="number"
                value={milestone.triggerLevel || ''}
                onChange={(e) => {
                  const updated = [...milestones];
                  updated[index] = {
                    ...milestone,
                    triggerLevel: parseInt(e.target.value) || undefined
                  };
                  onMilestonesChange(updated);
                }}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                min="1"
                max="100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Trigger Chapter
              </label>
              <input
                type="number"
                value={milestone.triggerChapter || ''}
                onChange={(e) => {
                  const updated = [...milestones];
                  updated[index] = {
                    ...milestone,
                    triggerChapter: parseInt(e.target.value) || undefined
                  };
                  onMilestonesChange(updated);
                }}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                min="1"
              />
            </div>
          </div>
        </div>
      ))}

      {milestones.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No custom milestones defined. Add some to track special achievements!
        </div>
      )}
    </div>
  </div>
);

// Simple Progression Chart Component
const ProgressionChart: React.FC<{
  results: SimulationResult[];
  selectedChapter: number;
}> = ({ results, selectedChapter }) => {
  if (results.length === 0) return null;

  const maxLevel = Math.max(...results.map(r => r.level));
  const maxExperience = Math.max(...results.map(r => r.experience));

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 800 200" className="w-full h-full">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
          </pattern>
        </defs>
        <rect width="800" height="200" fill="url(#grid)" />

        {/* Level line */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={results.map((r, i) =>
            `${(i / (results.length - 1)) * 780 + 10},${190 - (r.level / maxLevel) * 170}`
          ).join(' ')}
        />

        {/* Experience line */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          opacity="0.7"
          points={results.map((r, i) =>
            `${(i / (results.length - 1)) * 780 + 10},${190 - (r.experience / maxExperience) * 170}`
          ).join(' ')}
        />

        {/* Selected chapter indicator */}
        {selectedChapter <= results.length && (
          <line
            x1={((selectedChapter - 1) / (results.length - 1)) * 780 + 10}
            y1="10"
            x2={((selectedChapter - 1) / (results.length - 1)) * 780 + 10}
            y2="190"
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        )}
      </svg>

      {/* Legend */}
      <div className="absolute top-2 right-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span>Level</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span>Experience</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simulation Logic
function runProgressionSimulation(
  character: Character,
  storyLength: number,
  settings: ProgressionSettings
): SimulationResult[] {
  const results: SimulationResult[] = [];

  let currentLevel = character.level;
  let currentExperience = character.experience;
  let currentStats = { ...character.stats };

  for (let chapter = 1; chapter <= storyLength; chapter++) {
    // Add experience for this chapter
    currentExperience += settings.experienceRate;

    // Calculate required experience for next level
    const requiredExp = calculateRequiredExperience(currentLevel, settings.levelingCurve);

    // Handle level ups
    while (currentExperience >= requiredExp) {
      currentLevel++;
      currentExperience -= requiredExp;

      // Increase stats based on growth rate
      currentStats = {
        ...currentStats,
        strength: Math.round(currentStats.strength + (1 * settings.statGrowthRate)),
        dexterity: Math.round(currentStats.dexterity + (1 * settings.statGrowthRate)),
        constitution: Math.round(currentStats.constitution + (1 * settings.statGrowthRate)),
        intelligence: Math.round(currentStats.intelligence + (1 * settings.statGrowthRate)),
        wisdom: Math.round(currentStats.wisdom + (1 * settings.statGrowthRate)),
        charisma: Math.round(currentStats.charisma + (1 * settings.statGrowthRate))
      };

      // Recalculate derived stats
      currentStats.hitPoints = Math.max(1, currentStats.constitution * 10 + currentLevel * 5);
      currentStats.manaPoints = Math.max(0, currentStats.intelligence * 8 + currentLevel * 3);
      currentStats.armorClass = 10 + Math.floor((currentStats.dexterity - 10) / 2);
    }

    // Determine skills unlocked
    const skillsUnlocked = generateSkillsForLevel(currentLevel, settings.skillUnlockRate);
    const featuresUnlocked = generateFeaturesForLevel(currentLevel);
    const milestones = checkMilestones(currentLevel, chapter, settings.customMilestones);

    results.push({
      level: currentLevel,
      chapter,
      experience: currentExperience,
      stats: { ...currentStats },
      skillsUnlocked,
      featuresUnlocked,
      milestones
    });
  }

  return results;
}

function calculateRequiredExperience(level: number, curve: ProgressionSettings['levelingCurve']): number {
  switch (curve) {
    case 'linear':
      return 1000 * level;
    case 'exponential':
      return Math.floor(1000 * Math.pow(1.2, level - 1));
    case 'logarithmic':
      return Math.floor(1000 * Math.log(level + 1) * 500);
    default:
      return 1000 * level;
  }
}

function generateSkillsForLevel(level: number, rate: number): string[] {
  const skills = [
    'Sword Mastery', 'Shield Block', 'Fireball', 'Healing Light', 'Stealth', 'Lockpicking',
    'Archery', 'Dual Wielding', 'Berserker Rage', 'Meditation', 'Crafting', 'Alchemy',
    'Intimidation', 'Persuasion', 'Acrobatics', 'Climb', 'Swimming', 'Survival'
  ];

  const skillsToUnlock = Math.floor(level * rate);
  const availableSkills = skills.slice(0, Math.min(skillsToUnlock, skills.length));

  return availableSkills;
}

function generateFeaturesForLevel(level: number): string[] {
  const features: { [key: number]: string[] } = {
    5: ['Extra Attack'],
    10: ['Action Surge'],
    15: ['Improved Critical'],
    20: ['Legendary Actions'],
    25: ['Mythic Powers'],
    30: ['Divine Ascension']
  };

  const unlockedFeatures: string[] = [];
  Object.entries(features).forEach(([levelReq, featureList]) => {
    if (level >= parseInt(levelReq)) {
      unlockedFeatures.push(...featureList);
    }
  });

  return unlockedFeatures;
}

function checkMilestones(level: number, chapter: number, milestones: Milestone[]): string[] {
  return milestones
    .filter(milestone =>
      (milestone.triggerLevel && level >= milestone.triggerLevel) ||
      (milestone.triggerChapter && chapter >= milestone.triggerChapter)
    )
    .map(milestone => milestone.name);
}

export default ProgressionSimulator;
