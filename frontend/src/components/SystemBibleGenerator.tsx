import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SystemBible, GameSystemDefinition, CoreSystem, ExportFormat } from '../types/systemBible';

interface SystemBibleGeneratorProps {
  onGenerate?: (systemBible: SystemBible) => void;
}

export const SystemBibleGenerator: React.FC<SystemBibleGeneratorProps> = ({ onGenerate }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [systemBible, setSystemBible] = useState<Partial<SystemBible>>({
    name: '',
    version: '1.0',
    description: '',
    gameSystem: {} as GameSystemDefinition,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps = [
    { id: 'basic', title: 'Basic Info', icon: '📋' },
    { id: 'core', title: 'Core System', icon: '⚙️' },
    { id: 'combat', title: 'Combat', icon: '⚔️' },
    { id: 'magic', title: 'Magic', icon: '✨' },
    { id: 'skills', title: 'Skills', icon: '📚' },
    { id: 'items', title: 'Items', icon: '🎒' },
    { id: 'characters', title: 'Characters', icon: '👤' },
    { id: 'generate', title: 'Generate', icon: '🔄' }
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);

    // Simulate documentation generation process
    const totalSteps = 10;
    for (let i = 0; i <= totalSteps; i++) {
      setProgress((i / totalSteps) * 100);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const completeBible: SystemBible = {
      id: crypto.randomUUID(),
      name: systemBible.name || 'Untitled System',
      version: systemBible.version || '1.0',
      description: systemBible.description || '',
      gameSystem: generateCompleteGameSystem(systemBible.gameSystem!),
      documentation: generateDocumentation(),
      templates: generateTemplates(),
      exportFormats: generateExportFormats(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setIsGenerating(false);
    onGenerate?.(completeBible);
  };

  const renderStepContent = () => {
    switch (steps[activeStep].id) {
      case 'basic':
        return <BasicInfoStep systemBible={systemBible} onChange={setSystemBible} />;
      case 'core':
        return <CoreSystemStep systemBible={systemBible} onChange={setSystemBible} />;
      case 'combat':
        return <CombatSystemStep systemBible={systemBible} onChange={setSystemBible} />;
      case 'magic':
        return <MagicSystemStep systemBible={systemBible} onChange={setSystemBible} />;
      case 'skills':
        return <SkillSystemStep systemBible={systemBible} onChange={setSystemBible} />;
      case 'items':
        return <ItemSystemStep systemBible={systemBible} onChange={setSystemBible} />;
      case 'characters':
        return <CharacterSystemStep systemBible={systemBible} onChange={setSystemBible} />;
      case 'generate':
        return <GenerateStep onGenerate={handleGenerate} isGenerating={isGenerating} progress={progress} />;
      default:
        return null;
    }
  };

  return (
    <div className="system-bible-generator bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          System Bible Generator
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Create comprehensive game system documentation automatically
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex flex-col items-center min-w-0 flex-1 ${
              index < steps.length - 1 ? 'relative' : ''
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer ${
                index === activeStep
                  ? 'bg-blue-500 text-white'
                  : index < activeStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              onClick={() => setActiveStep(index)}
            >
              {step.icon}
            </div>
            <span className={`mt-2 text-xs text-center font-medium ${
              index === activeStep
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div className={`absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                index < activeStep ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[500px]"
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {!isGenerating && (
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
            disabled={activeStep === steps.length - 1}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {activeStep === steps.length - 2 ? 'Generate' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};

// Basic Info Step Component
const BasicInfoStep: React.FC<{
  systemBible: Partial<SystemBible>;
  onChange: (bible: Partial<SystemBible>) => void;
}> = ({ systemBible, onChange }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Basic System Information</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          System Name
        </label>
        <input
          type="text"
          value={systemBible.name || ''}
          onChange={(e) => onChange({ ...systemBible, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="e.g., Arcane Ascension RPG"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Version
        </label>
        <input
          type="text"
          value={systemBible.version || ''}
          onChange={(e) => onChange({ ...systemBible, version: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="1.0"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        System Description
      </label>
      <textarea
        value={systemBible.description || ''}
        onChange={(e) => onChange({ ...systemBible, description: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        rows={4}
        placeholder="Describe your game system, its themes, and core concepts..."
      />
    </div>

    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What is a System Bible?</h4>
      <p className="text-blue-700 dark:text-blue-200 text-sm">
        A System Bible is comprehensive documentation that defines all rules, mechanics, and systems
        in your game world. It ensures consistency across your story and helps readers understand
        the underlying game mechanics that drive your narrative.
      </p>
    </div>
  </div>
);

// Core System Step Component
const CoreSystemStep: React.FC<{
  systemBible: Partial<SystemBible>;
  onChange: (bible: Partial<SystemBible>) => void;
}> = ({ systemBible, onChange }) => {
  const updateCoreSystem = (updates: Partial<CoreSystem>) => {
    onChange({
      ...systemBible,
      gameSystem: {
        ...systemBible.gameSystem!,
        core: { ...systemBible.gameSystem?.core, ...updates } as CoreSystem
      }
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Core Game System</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Genre
          </label>
          <select
            value={systemBible.gameSystem?.core?.genre || ''}
            onChange={(e) => updateCoreSystem({ genre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select Genre</option>
            <option value="fantasy">Fantasy</option>
            <option value="sci-fi">Science Fiction</option>
            <option value="cyberpunk">Cyberpunk</option>
            <option value="steampunk">Steampunk</option>
            <option value="post-apocalyptic">Post-Apocalyptic</option>
            <option value="modern">Modern</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Complexity Level
          </label>
          <select
            value={systemBible.gameSystem?.core?.complexity || ''}
            onChange={(e) => updateCoreSystem({ complexity: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select Complexity</option>
            <option value="simple">Simple (Easy to learn)</option>
            <option value="moderate">Moderate (Balanced)</option>
            <option value="complex">Complex (Detailed)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Core Game Loop
        </label>
        <textarea
          value={systemBible.gameSystem?.core?.coreLoop || ''}
          onChange={(e) => updateCoreSystem({ coreLoop: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={3}
          placeholder="Describe the main gameplay loop (e.g., Explore → Fight → Gain XP → Level Up → Explore)"
        />
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Dice System</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dice Type
            </label>
            <select
              value={systemBible.gameSystem?.core?.dice?.type || ''}
              onChange={(e) => updateCoreSystem({
                dice: { ...systemBible.gameSystem?.core?.dice, type: e.target.value as any }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select Dice System</option>
              <option value="d20">d20 System</option>
              <option value="3d6">3d6 System</option>
              <option value="2d10">2d10 System</option>
              <option value="percentile">Percentile (d100)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dice Description
            </label>
            <input
              type="text"
              value={systemBible.gameSystem?.core?.dice?.description || ''}
              onChange={(e) => updateCoreSystem({
                dice: { ...systemBible.gameSystem?.core?.dice, description: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Roll 1d20 + modifier vs DC"
            />
          </div>
        </div>
      </div>

      <AttributeBuilder
        attributes={systemBible.gameSystem?.core?.attributes || []}
        onChange={(attributes) => updateCoreSystem({ attributes })}
      />
    </div>
  );
};

// Combat System Step Component
const CombatSystemStep: React.FC<{
  systemBible: Partial<SystemBible>;
  onChange: (bible: Partial<SystemBible>) => void;
}> = ({ systemBible, onChange }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Combat System</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Initiative System
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Select Initiative Type</option>
          <option value="dexterity">Dexterity-based</option>
          <option value="roll">Roll + Modifier</option>
          <option value="speed">Speed Attribute</option>
          <option value="custom">Custom Formula</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Armor System
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Select Armor Type</option>
          <option value="AC">Armor Class (harder to hit)</option>
          <option value="damage_reduction">Damage Reduction</option>
          <option value="ablative">Ablative (armor degrades)</option>
          <option value="custom">Custom System</option>
        </select>
      </div>
    </div>

    <DamageTypeBuilder />
    <ActionSystemBuilder />
  </div>
);

// Magic System Step Component
const MagicSystemStep: React.FC<{
  systemBible: Partial<SystemBible>;
  onChange: (bible: Partial<SystemBible>) => void;
}> = ({ systemBible, onChange }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Magic System</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Magic Type
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Select Magic System</option>
          <option value="vancian">Vancian (Prepared Spells)</option>
          <option value="mana">Mana Points</option>
          <option value="spell_points">Spell Points</option>
          <option value="cooldown">Cooldown System</option>
          <option value="ritual">Ritual Magic</option>
          <option value="custom">Custom System</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Magic Rarity
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="common">Common (Everyone can use magic)</option>
          <option value="uncommon">Uncommon (Some people can use magic)</option>
          <option value="rare">Rare (Few people can use magic)</option>
          <option value="legendary">Legendary (Magic is extremely rare)</option>
        </select>
      </div>
    </div>

    <MagicSchoolBuilder />
    <SpellComponentBuilder />
  </div>
);

// Skill System Step Component
const SkillSystemStep: React.FC<{
  systemBible: Partial<SystemBible>;
  onChange: (bible: Partial<SystemBible>) => void;
}> = ({ systemBible, onChange }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Skill System</h3>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Skill Structure
      </label>
      <select
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="">Select Skill System</option>
        <option value="list">Skill List (Fixed skills)</option>
        <option value="tree">Skill Tree (Prerequisites)</option>
        <option value="point_buy">Point Buy (Allocate points)</option>
        <option value="class_based">Class-based Skills</option>
      </select>
    </div>

    <SkillListBuilder />
    <SkillAdvancementBuilder />
  </div>
);

// Item System Step Component
const ItemSystemStep: React.FC<{
  systemBible: Partial<SystemBible>;
  onChange: (bible: Partial<SystemBible>) => void;
}> = ({ systemBible, onChange }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Item System</h3>

    <ItemCategoryBuilder />
    <CraftingSystemBuilder />
    <EnchantmentSystemBuilder />
  </div>
);

// Character System Step Component
const CharacterSystemStep: React.FC<{
  systemBible: Partial<SystemBible>;
  onChange: (bible: Partial<SystemBible>) => void;
}> = ({ systemBible, onChange }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Character System</h3>

    <CharacterCreationBuilder />
    <CharacterClassBuilder />
    <CharacterRaceBuilder />
  </div>
);

// Generate Step Component
const GenerateStep: React.FC<{
  onGenerate: () => void;
  isGenerating: boolean;
  progress: number;
}> = ({ onGenerate, isGenerating, progress }) => (
  <div className="text-center space-y-6">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Generate System Bible</h3>

    {!isGenerating ? (
      <>
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
          <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Ready to Generate</h4>
          <p className="text-green-700 dark:text-green-200 text-sm mb-4">
            Your system bible will include:
          </p>
          <ul className="text-green-700 dark:text-green-200 text-sm space-y-1 text-left max-w-md mx-auto">
            <li>• Complete rule documentation</li>
            <li>• Quick reference tables</li>
            <li>• Player and GM guides</li>
            <li>• Gameplay examples</li>
            <li>• Multiple export formats</li>
          </ul>
        </div>

        <button
          onClick={onGenerate}
          className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Generate System Bible
        </button>
      </>
    ) : (
      <div className="space-y-4">
        <div className="w-32 h-32 mx-auto border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Generating Documentation...</h4>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{Math.round(progress)}% complete</p>
        </div>
      </div>
    )}
  </div>
);

// Helper Components
const AttributeBuilder: React.FC<{
  attributes: any[];
  onChange: (attributes: any[]) => void;
}> = ({ attributes, onChange }) => {
  const [newAttribute, setNewAttribute] = useState({ name: '', description: '' });

  const addAttribute = () => {
    if (newAttribute.name) {
      onChange([...attributes, { id: crypto.randomUUID(), ...newAttribute }]);
      setNewAttribute({ name: '', description: '' });
    }
  };

  return (
    <div>
      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Attributes</h4>
      <div className="space-y-3">
        {attributes.map((attr, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">{attr.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{attr.description}</div>
            </div>
            <button
              onClick={() => onChange(attributes.filter((_, i) => i !== index))}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          type="text"
          value={newAttribute.name}
          onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Attribute name (e.g., Strength)"
        />
        <input
          type="text"
          value={newAttribute.description}
          onChange={(e) => setNewAttribute({ ...newAttribute, description: e.target.value })}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Description"
        />
        <button
          onClick={addAttribute}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
};

// Placeholder components for other builders
const DamageTypeBuilder: React.FC = () => <div className="text-gray-500">Damage types will be configured here...</div>;
const ActionSystemBuilder: React.FC = () => <div className="text-gray-500">Action system will be configured here...</div>;
const MagicSchoolBuilder: React.FC = () => <div className="text-gray-500">Magic schools will be configured here...</div>;
const SpellComponentBuilder: React.FC = () => <div className="text-gray-500">Spell components will be configured here...</div>;
const SkillListBuilder: React.FC = () => <div className="text-gray-500">Skill list will be configured here...</div>;
const SkillAdvancementBuilder: React.FC = () => <div className="text-gray-500">Skill advancement will be configured here...</div>;
const ItemCategoryBuilder: React.FC = () => <div className="text-gray-500">Item categories will be configured here...</div>;
const CraftingSystemBuilder: React.FC = () => <div className="text-gray-500">Crafting system will be configured here...</div>;
const EnchantmentSystemBuilder: React.FC = () => <div className="text-gray-500">Enchantment system will be configured here...</div>;
const CharacterCreationBuilder: React.FC = () => <div className="text-gray-500">Character creation will be configured here...</div>;
const CharacterClassBuilder: React.FC = () => <div className="text-gray-500">Character classes will be configured here...</div>;
const CharacterRaceBuilder: React.FC = () => <div className="text-gray-500">Character races will be configured here...</div>;

// Helper functions for generating complete system data
const generateCompleteGameSystem = (partial: Partial<GameSystemDefinition>): GameSystemDefinition => {
  // This would generate a complete game system based on the partial data provided
  return {
    core: partial.core || {
      name: 'Basic System',
      genre: 'fantasy',
      complexity: 'moderate',
      baseRules: [],
      dice: { type: 'd20', description: 'Roll 1d20 + modifier', modifiers: [], criticals: [] },
      attributes: [],
      coreLoop: 'Standard gameplay loop'
    },
    combat: {} as any,
    magic: {} as any,
    skills: {} as any,
    items: {} as any,
    character: {} as any,
    progression: {} as any,
    economy: {} as any,
    social: {} as any
  };
};

const generateDocumentation = () => ({
  quickReference: { sections: [], tables: [], formulas: [] },
  playerGuide: {
    introduction: '',
    characterCreation: '',
    basicRules: '',
    combat: '',
    magic: '',
    advancement: '',
    equipment: '',
    appendices: []
  },
  gmGuide: {
    introduction: '',
    worldBuilding: '',
    npcs: '',
    encounters: '',
    campaigns: '',
    customization: '',
    troubleshooting: '',
    resources: []
  },
  examples: [],
  appendices: []
});

const generateTemplates = () => [];

const generateExportFormats = (): ExportFormat[] => [
  {
    name: 'PDF',
    description: 'Professional PDF document',
    fileExtension: 'pdf',
    mimeType: 'application/pdf',
    options: [],
    template: ''
  },
  {
    name: 'HTML',
    description: 'Web-friendly HTML document',
    fileExtension: 'html',
    mimeType: 'text/html',
    options: [],
    template: ''
  },
  {
    name: 'Markdown',
    description: 'Markdown format for easy editing',
    fileExtension: 'md',
    mimeType: 'text/markdown',
    options: [],
    template: ''
  }
];

export default SystemBibleGenerator;