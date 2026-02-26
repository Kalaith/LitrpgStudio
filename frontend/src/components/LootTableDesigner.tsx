import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  LootTable,
  LootEntry,
  LootTableType,
  LootCategory,
  LootItemRarity,
  TestResult,
  LootRollResult,
  GeneratedItem
} from '../types/lootTable';

interface LootTableDesignerProps {
  onSave?: (table: LootTable) => void;
}

type LootDesignerTab = 'design' | 'test' | 'balance' | 'export';

export const LootTableDesigner: React.FC<LootTableDesignerProps> = ({ onSave }) => {
  const [activeTab, setActiveTab] = useState<LootDesignerTab>('design');
  const [lootTable, setLootTable] = useState<Partial<LootTable>>({
    name: 'New Loot Table',
    description: '',
    category: 'monster',
    type: 'weighted',
    entries: [],
    conditions: [],
    modifiers: [],
    metadata: {
      version: '1.0',
      author: '',
      tags: [],
      difficulty: 'normal',
      recommendedLevel: { min: 1, max: 10, optimal: 5 },
      balanceScore: 0,
      totalWeight: 0,
      expectedValue: {
        averageGoldValue: 0,
        averageItemCount: 0,
        rarityDistribution: {
          common: 0,
          uncommon: 0,
          rare: 0,
          epic: 0,
          legendary: 0,
          artifact: 0,
          unique: 0
        },
        typeDistribution: {}
      },
      testResults: []
    }
  });

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LootEntry | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);

  const totalWeight = useMemo(() => {
    return lootTable.entries?.reduce((sum, entry) => sum + entry.probability.weight, 0) || 0;
  }, [lootTable.entries]);

  const handleAddEntry = (entry: LootEntry) => {
    setLootTable(prev => ({
      ...prev,
      entries: [...(prev.entries || []), entry]
    }));
  };

  const handleUpdateEntry = (entryId: string, updates: Partial<LootEntry>) => {
    setLootTable(prev => ({
      ...prev,
      entries: prev.entries?.map(entry =>
        entry.id === entryId ? { ...entry, ...updates } : entry
      ) || []
    }));
  };

  const handleDeleteEntry = (entryId: string) => {
    setLootTable(prev => ({
      ...prev,
      entries: prev.entries?.filter(entry => entry.id !== entryId) || []
    }));
  };

  const rollLootTable = async (iterations: number = 100) => {
    setIsRolling(true);
    const results: LootRollResult[] = [];

    for (let i = 0; i < iterations; i++) {
      const rollResult = simulateLootRoll(lootTable as LootTable);
      results.push(rollResult);

      // Add delay for visual effect
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const testResult: TestResult = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      sampleSize: iterations,
      results,
      statistics: calculateStatistics(results),
      balanceAnalysis: analyzeBalance(results)
    };

    setTestResults(prev => [testResult, ...prev.slice(0, 9)]);
    setIsRolling(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'design':
        return (
          <DesignTab
            lootTable={lootTable}
            onUpdate={setLootTable}
            onAddEntry={() => setShowEntryModal(true)}
            onEditEntry={(entry) => {
              setSelectedEntry(entry);
              setShowEntryModal(true);
            }}
            onDeleteEntry={handleDeleteEntry}
            totalWeight={totalWeight}
          />
        );
      case 'test':
        return (
          <TestTab
            lootTable={lootTable}
            testResults={testResults}
            isRolling={isRolling}
            onRoll={rollLootTable}
          />
        );
      case 'balance':
        return <BalanceTab lootTable={lootTable} testResults={testResults} />;
      case 'export':
        return <ExportTab lootTable={lootTable} />;
      default:
        return null;
    }
  };

  return (
    <div className="loot-table-designer bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Loot Table Designer
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Create and balance randomized loot systems
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={lootTable.category}
              onChange={(e) => setLootTable(prev => ({ ...prev, category: e.target.value as LootCategory }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="monster">Monster Drop</option>
              <option value="treasure">Treasure Chest</option>
              <option value="container">Container</option>
              <option value="environment">Environmental</option>
              <option value="quest">Quest Reward</option>
              <option value="shop">Shop Inventory</option>
              <option value="random_event">Random Event</option>
            </select>

            <button
              onClick={() => onSave?.(lootTable as LootTable)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save Table
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'design', label: 'Design', icon: '🎨' },
            { id: 'test', label: 'Test & Roll', icon: '🎲' },
            { id: 'balance', label: 'Balance Analysis', icon: '⚖️' },
            { id: 'export', label: 'Export', icon: '📤' }
          ].map((tab: { id: LootDesignerTab; label: string; icon: string }) => (
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

      {/* Entry Modal */}
      {showEntryModal && (
        <LootEntryModal
          entry={selectedEntry}
          onSave={(entry) => {
            if (selectedEntry) {
              handleUpdateEntry(selectedEntry.id, entry);
            } else {
              handleAddEntry({ ...entry, id: crypto.randomUUID() } as LootEntry);
            }
            setShowEntryModal(false);
            setSelectedEntry(null);
          }}
          onClose={() => {
            setShowEntryModal(false);
            setSelectedEntry(null);
          }}
        />
      )}
    </div>
  );
};

// Design Tab Component
const DesignTab: React.FC<{
  lootTable: Partial<LootTable>;
  onUpdate: (table: Partial<LootTable>) => void;
  onAddEntry: () => void;
  onEditEntry: (entry: LootEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  totalWeight: number;
}> = ({ lootTable, onUpdate, onAddEntry, onEditEntry, onDeleteEntry, totalWeight }) => (
  <div className="space-y-6">
    {/* Basic Settings */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Table Name
        </label>
        <input
          type="text"
          value={lootTable.name || ''}
          onChange={(e) => onUpdate({ ...lootTable, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Table Type
        </label>
        <select
          value={lootTable.type}
          onChange={(e) => onUpdate({ ...lootTable, type: e.target.value as LootTableType })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="simple">Simple (Equal chances)</option>
          <option value="weighted">Weighted (Custom probabilities)</option>
          <option value="tiered">Tiered (Rarity levels)</option>
          <option value="conditional">Conditional (Based on conditions)</option>
          <option value="nested">Nested (Tables within tables)</option>
          <option value="progressive">Progressive (Changes over time)</option>
        </select>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Description
      </label>
      <textarea
        value={lootTable.description || ''}
        onChange={(e) => onUpdate({ ...lootTable, description: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        rows={3}
        placeholder="Describe when and how this loot table is used..."
      />
    </div>

    {/* Loot Entries */}
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loot Entries</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total Weight: {totalWeight}
          </span>
          <button
            onClick={onAddEntry}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Add Entry
          </button>
        </div>
      </div>

      {lootTable.entries && lootTable.entries.length > 0 ? (
        <div className="space-y-3">
          {lootTable.entries.map((entry) => (
            <LootEntryCard
              key={entry.id}
              entry={entry}
              totalWeight={totalWeight}
              onEdit={() => onEditEntry(entry)}
              onDelete={() => onDeleteEntry(entry.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-lg mb-2">No loot entries yet</p>
          <p className="text-sm mb-4">Add your first loot entry to get started</p>
          <button
            onClick={onAddEntry}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add First Entry
          </button>
        </div>
      )}
    </div>
  </div>
);

// Test Tab Component
const TestTab: React.FC<{
  lootTable: Partial<LootTable>;
  testResults: TestResult[];
  isRolling: boolean;
  onRoll: (iterations: number) => void;
}> = ({ lootTable, testResults, isRolling, onRoll }) => {
  const [iterations, setIterations] = useState(100);

  return (
    <div className="space-y-6">
      {/* Roll Controls */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Rolls</h3>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Rolls
            </label>
            <select
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={isRolling}
            >
              <option value={10}>10 rolls</option>
              <option value={100}>100 rolls</option>
              <option value={1000}>1,000 rolls</option>
              <option value={10000}>10,000 rolls</option>
            </select>
          </div>

          <div className="flex-1">
            <button
              onClick={() => onRoll(iterations)}
              disabled={isRolling || !lootTable.entries?.length}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRolling ? 'Rolling...' : 'Roll Table'}
            </button>
          </div>
        </div>
      </div>

      {/* Single Roll Result */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Single Roll Test</h4>
        <SingleRollTest lootTable={lootTable} />
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Test Results History</h4>
          <div className="space-y-4">
            {testResults.map((result) => (
              <TestResultCard key={result.id} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Balance Tab Component
const BalanceTab: React.FC<{
  lootTable: Partial<LootTable>;
  testResults: TestResult[];
}> = ({ lootTable, testResults }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Balance Analysis</h3>

    {/* Probability Distribution */}
    <ProbabilityChart entries={lootTable.entries || []} />

    {/* Balance Recommendations */}
    <BalanceRecommendations lootTable={lootTable} testResults={testResults} />

    {/* Comparison with Standards */}
    <IndustryComparison lootTable={lootTable} />
  </div>
);

// Export Tab Component
const ExportTab: React.FC<{
  lootTable: Partial<LootTable>;
}> = ({ lootTable: _lootTable }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Options</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[
        { format: 'JSON', description: 'Standard JSON format for web applications' },
        { format: 'XML', description: 'XML format for enterprise systems' },
        { format: 'CSV', description: 'Spreadsheet-compatible format' },
        { format: 'SQL', description: 'Database insert statements' },
        { format: 'Code', description: 'Generate code for your game engine' },
        { format: 'PDF', description: 'Printable reference document' }
      ].map((option) => (
        <div key={option.format} className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">{option.format}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{option.description}</p>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm">
            Export as {option.format}
          </button>
        </div>
      ))}
    </div>
  </div>
);

// Loot Entry Card Component
const LootEntryCard: React.FC<{
  entry: LootEntry;
  totalWeight: number;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ entry, totalWeight, onEdit, onDelete }) => {
  const probability = totalWeight > 0 ? (entry.probability.weight / totalWeight) * 100 : 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{entry.name}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{entry.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Type:</span>
          <span className="ml-2 text-gray-900 dark:text-white">{entry.type}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Rarity:</span>
          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
            entry.rarity === 'common' ? 'bg-gray-100 text-gray-800' :
            entry.rarity === 'uncommon' ? 'bg-green-100 text-green-800' :
            entry.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
            entry.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
            entry.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {entry.rarity}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Quantity:</span>
          <span className="ml-2 text-gray-900 dark:text-white">
            {entry.quantity.min === entry.quantity.max
              ? entry.quantity.min
              : `${entry.quantity.min}-${entry.quantity.max}`
            }
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Chance:</span>
          <span className="ml-2 text-gray-900 dark:text-white">{probability.toFixed(1)}%</span>
        </div>
      </div>

      {/* Probability Bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(probability, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Single Roll Test Component
const SingleRollTest: React.FC<{
  lootTable: Partial<LootTable>;
}> = ({ lootTable }) => {
  const [lastRoll, setLastRoll] = useState<GeneratedItem[]>([]);

  const rollOnce = () => {
    const result = simulateLootRoll(lootTable as LootTable);
    setLastRoll(result.items);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-medium text-gray-900 dark:text-white">Quick Roll</h5>
        <button
          onClick={rollOnce}
          disabled={!lootTable.entries?.length}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          Roll Once
        </button>
      </div>

      {lastRoll.length > 0 ? (
        <div className="space-y-2">
          {lastRoll.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded">
              <span className="text-gray-900 dark:text-white">
                {item.quantity > 1 && `${item.quantity}x `}
                {item.name}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                item.rarity === 'common' ? 'bg-gray-100 text-gray-800' :
                item.rarity === 'uncommon' ? 'bg-green-100 text-green-800' :
                item.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                item.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                item.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {item.rarity}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          Click "Roll Once" to see results
        </div>
      )}
    </div>
  );
};

// Test Result Card Component
const TestResultCard: React.FC<{
  result: TestResult;
}> = ({ result }) => (
  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
    <div className="flex items-center justify-between mb-3">
      <h5 className="font-medium text-gray-900 dark:text-white">
        {result.sampleSize.toLocaleString()} Rolls
      </h5>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {result.timestamp.toLocaleString()}
      </span>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="text-gray-500 dark:text-gray-400">Avg Value:</span>
        <span className="ml-2 text-gray-900 dark:text-white">
          {result.statistics.averageValue.toFixed(1)}
        </span>
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400">Nothing:</span>
        <span className="ml-2 text-gray-900 dark:text-white">
          {result.statistics.nothingPercentage.toFixed(1)}%
        </span>
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400">Min/Max:</span>
        <span className="ml-2 text-gray-900 dark:text-white">
          {result.statistics.minValue}-{result.statistics.maxValue}
        </span>
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400">Balance:</span>
        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
          result.balanceAnalysis.balanceScore >= 80 ? 'bg-green-100 text-green-800' :
          result.balanceAnalysis.balanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {result.balanceAnalysis.balanceScore}%
        </span>
      </div>
    </div>
  </div>
);

// Placeholder components for complex features
const LootEntryModal: React.FC<{
  entry: LootEntry | null;
  onSave: (entry: Partial<LootEntry>) => void;
  onClose: () => void;
}> = ({ entry, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: entry?.name || '',
    type: entry?.type || 'item' as const,
    rarity: entry?.rarity || 'common' as LootItemRarity,
    weight: entry?.probability.weight || 10,
    minQuantity: entry?.quantity.min || 1,
    maxQuantity: entry?.quantity.max || 1,
    description: entry?.description || ''
  });

  const handleSave = () => {
    onSave({
      name: formData.name,
      type: formData.type,
      rarity: formData.rarity,
      description: formData.description,
      quantity: { min: formData.minQuantity, max: formData.maxQuantity, modifiers: [] },
      probability: { weight: formData.weight, baseChance: 0, scalingFactor: 1, conditions: [], rollType: 'simple', rollModifier: 0 },
      conditions: [],
      category: '',
      tags: []
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {entry ? 'Edit' : 'Add'} Loot Entry
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as LootEntry['type'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="item">Item</option>
                <option value="currency">Currency</option>
                <option value="experience">Experience</option>
                <option value="nothing">Nothing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rarity
              </label>
              <select
                value={formData.rarity}
                onChange={(e) => setFormData({ ...formData, rarity: e.target.value as LootItemRarity })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
                <option value="artifact">Artifact</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Qty
              </label>
              <input
                type="number"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Qty
              </label>
              <input
                type="number"
                value={formData.maxQuantity}
                onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min={formData.minQuantity}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {entry ? 'Update' : 'Add'} Entry
          </button>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for complex analysis features
const ProbabilityChart: React.FC<{ entries: LootEntry[] }> = () => (
  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Probability Distribution</h4>
    <div className="text-gray-500 dark:text-gray-400">Chart visualization would go here...</div>
  </div>
);

const BalanceRecommendations: React.FC<{ lootTable: Partial<LootTable>; testResults: TestResult[] }> = ({ lootTable: _lootTable, testResults: _testResults }) => (
  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Balance Recommendations</h4>
    <div className="text-gray-500 dark:text-gray-400">Analysis and recommendations would go here...</div>
  </div>
);

const IndustryComparison: React.FC<{ lootTable: Partial<LootTable> }> = ({ lootTable: _lootTable }) => (
  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Industry Standards</h4>
    <div className="text-gray-500 dark:text-gray-400">Comparison data would go here...</div>
  </div>
);

// Helper functions
const simulateLootRoll = (lootTable: LootTable): LootRollResult => {
  const items: GeneratedItem[] = [];
  let totalValue = 0;
  const startTime = performance.now();

  // Simple weighted random selection
  if (lootTable.entries && lootTable.entries.length > 0) {
    const totalWeight = lootTable.entries.reduce((sum, entry) => sum + entry.probability.weight, 0);
    const random = Math.random() * totalWeight;
    let currentWeight = 0;

    for (const entry of lootTable.entries) {
      currentWeight += entry.probability.weight;
      if (random <= currentWeight) {
        if (entry.type !== 'nothing') {
          const quantity = Math.floor(Math.random() * (entry.quantity.max - entry.quantity.min + 1)) + entry.quantity.min;
          const item: GeneratedItem = {
            name: entry.name,
            quantity,
            rarity: entry.rarity,
            value: quantity * 10, // Placeholder value calculation
            source: entry.id,
            modifiers: []
          };
          items.push(item);
          totalValue += item.value;
        }
        break;
      }
    }
  }

  const endTime = performance.now();

  return {
    rollId: crypto.randomUUID(),
    conditions: {},
    items,
    totalValue,
    rollTime: endTime - startTime
  };
};

const calculateStatistics = (results: LootRollResult[]) => {
  const values = results.map(r => r.totalValue);
  const sum = values.reduce((a, b) => a + b, 0);
  const average = sum / values.length;
  const nothingCount = results.filter(r => r.items.length === 0).length;

  return {
    averageValue: average,
    medianValue: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
    standardDeviation: Math.sqrt(values.map(v => Math.pow(v - average, 2)).reduce((a, b) => a + b, 0) / values.length),
    minValue: Math.min(...values),
    maxValue: Math.max(...values),
    rarityDistribution: {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      artifact: 0,
      unique: 0
    },
    nothingPercentage: (nothingCount / results.length) * 100,
    averageRollTime: results.reduce((sum, r) => sum + r.rollTime, 0) / results.length
  };
};

const analyzeBalance = (results: LootRollResult[]) => {
  // Simplified balance analysis
  const statistics = calculateStatistics(results);
  let balanceScore = 75; // Base score

  // Adjust based on nothing percentage
  if (statistics.nothingPercentage > 50) balanceScore -= 20;
  if (statistics.nothingPercentage < 10) balanceScore += 10;

  return {
    balanceScore,
    issues: [],
    recommendations: ['Consider adjusting probability weights for better balance'],
    comparisonData: { similarTables: [], industryStandards: {}, playerExpectations: {} }
  };
};

export default LootTableDesigner;
