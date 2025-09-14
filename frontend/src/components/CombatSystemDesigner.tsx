import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CombatAction {
  id: string;
  name: string;
  type: 'attack' | 'spell' | 'skill' | 'item';
  baseDamage: number;
  damageType: 'physical' | 'magical' | 'fire' | 'ice' | 'lightning' | 'poison';
  accuracy: number;
  critChance: number;
  critMultiplier: number;
  energyCost: number;
  cooldown: number;
  range: number;
  areaOfEffect: boolean;
  effects: CombatEffect[];
  requirements: {
    level: number;
    stats: Record<string, number>;
    items: string[];
  };
}

export interface CombatEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'dot' | 'hot' | 'stun' | 'silence';
  duration: number;
  value: number;
  stackable: boolean;
}

export interface CombatStats {
  health: number;
  energy: number;
  attack: number;
  defense: number;
  magicPower: number;
  magicDefense: number;
  speed: number;
  accuracy: number;
  evasion: number;
  criticalRate: number;
  criticalDamage: number;
}

export interface CombatSimulation {
  attacker: CombatStats;
  defender: CombatStats;
  action: CombatAction;
  environment: {
    terrain: 'normal' | 'fire' | 'ice' | 'water' | 'earth';
    weather: 'clear' | 'rain' | 'storm' | 'fog';
    modifiers: number;
  };
}

interface CombatSystemDesignerProps {
  onSimulate?: (simulation: CombatSimulation) => void;
}

export default function CombatSystemDesigner({
  onSimulate
}: CombatSystemDesignerProps) {
  const [activeTab, setActiveTab] = useState<'actions' | 'simulator' | 'balance'>('actions');
  const [actions, setActions] = useState<CombatAction[]>([]);
  const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null);
  const [isCreatingAction, setIsCreatingAction] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // Default combat stats for testing
  const defaultStats: CombatStats = {
    health: 100,
    energy: 50,
    attack: 20,
    defense: 15,
    magicPower: 18,
    magicDefense: 12,
    speed: 25,
    accuracy: 85,
    evasion: 15,
    criticalRate: 10,
    criticalDamage: 150
  };

  const [attackerStats, setAttackerStats] = useState<CombatStats>(defaultStats);
  const [defenderStats, setDefenderStats] = useState<CombatStats>({ ...defaultStats, health: 120 });

  useEffect(() => {
    // Initialize with sample combat actions
    const sampleActions: CombatAction[] = [
      {
        id: 'basic-attack',
        name: 'Basic Attack',
        type: 'attack',
        baseDamage: 20,
        damageType: 'physical',
        accuracy: 85,
        critChance: 10,
        critMultiplier: 1.5,
        energyCost: 0,
        cooldown: 0,
        range: 1,
        areaOfEffect: false,
        effects: [],
        requirements: {
          level: 1,
          stats: {},
          items: []
        }
      },
      {
        id: 'fireball',
        name: 'Fireball',
        type: 'spell',
        baseDamage: 35,
        damageType: 'fire',
        accuracy: 75,
        critChance: 15,
        critMultiplier: 2.0,
        energyCost: 15,
        cooldown: 3,
        range: 5,
        areaOfEffect: true,
        effects: [
          {
            id: 'burn',
            name: 'Burn',
            type: 'dot',
            duration: 3,
            value: 5,
            stackable: false
          }
        ],
        requirements: {
          level: 5,
          stats: { magicPower: 25 },
          items: []
        }
      },
      {
        id: 'power-strike',
        name: 'Power Strike',
        type: 'skill',
        baseDamage: 45,
        damageType: 'physical',
        accuracy: 70,
        critChance: 20,
        critMultiplier: 2.5,
        energyCost: 20,
        cooldown: 5,
        range: 1,
        areaOfEffect: false,
        effects: [],
        requirements: {
          level: 8,
          stats: { attack: 30 },
          items: ['sword']
        }
      }
    ];

    setActions(sampleActions);
  }, []);

  const calculateDamage = (action: CombatAction, attacker: CombatStats, defender: CombatStats): any => {
    // Base damage calculation
    let baseDmg = action.baseDamage;

    // Add stat-based damage
    if (action.damageType === 'physical') {
      baseDmg += attacker.attack * 0.5;
    } else if (action.damageType === 'magical' ||
               ['fire', 'ice', 'lightning', 'poison'].includes(action.damageType)) {
      baseDmg += attacker.magicPower * 0.5;
    }

    // Calculate defense reduction
    let defense = action.damageType === 'physical' ? defender.defense : defender.magicDefense;
    let damageReduction = defense / (defense + 100);
    let finalDamage = baseDmg * (1 - damageReduction);

    // Check for hit
    let hitChance = action.accuracy + attacker.accuracy - defender.evasion;
    let isHit = Math.random() * 100 < hitChance;

    if (!isHit) {
      return {
        hit: false,
        damage: 0,
        critical: false,
        effects: []
      };
    }

    // Check for critical hit
    let critChance = action.critChance + attacker.criticalRate;
    let isCritical = Math.random() * 100 < critChance;

    if (isCritical) {
      finalDamage *= (action.critMultiplier * (attacker.criticalDamage / 100));
    }

    return {
      hit: true,
      damage: Math.round(finalDamage),
      critical: isCritical,
      effects: action.effects,
      baseDamage: baseDmg,
      damageReduction: damageReduction * 100,
      hitChance,
      critChance
    };
  };

  const runSimulation = () => {
    if (!selectedAction) return;

    const results = [];
    const numSimulations = 1000;

    for (let i = 0; i < numSimulations; i++) {
      const result = calculateDamage(selectedAction, attackerStats, defenderStats);
      results.push(result);
    }

    const analysis = {
      totalSimulations: numSimulations,
      hits: results.filter(r => r.hit).length,
      misses: results.filter(r => !r.hit).length,
      criticals: results.filter(r => r.critical).length,
      averageDamage: results.reduce((sum, r) => sum + r.damage, 0) / numSimulations,
      maxDamage: Math.max(...results.map(r => r.damage)),
      minDamage: Math.min(...results.filter(r => r.hit).map(r => r.damage)),
      hitRate: (results.filter(r => r.hit).length / numSimulations) * 100,
      critRate: (results.filter(r => r.critical).length / numSimulations) * 100,
      sampleResult: results[0]
    };

    setSimulationResults(analysis);
    if (onSimulate) {
      onSimulate({
        attacker: attackerStats,
        defender: defenderStats,
        action: selectedAction,
        environment: {
          terrain: 'normal',
          weather: 'clear',
          modifiers: 1.0
        }
      });
    }
  };

  const renderActionsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Combat Actions</h3>
        <button
          onClick={() => setIsCreatingAction(true)}
          className="btn-primary"
        >
          Create New Action
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map(action => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedAction(action)}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold">{action.name}</h4>
              <span className={`
                px-2 py-1 text-xs rounded-full
                ${action.type === 'attack' ? 'bg-red-100 text-red-800' :
                  action.type === 'spell' ? 'bg-purple-100 text-purple-800' :
                  action.type === 'skill' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'}
              `}>
                {action.type}
              </span>
            </div>

            <div className="text-sm space-y-1">
              <div>Base Damage: <span className="font-medium">{action.baseDamage}</span></div>
              <div>Type: <span className="capitalize font-medium">{action.damageType}</span></div>
              <div>Accuracy: <span className="font-medium">{action.accuracy}%</span></div>
              <div>Crit Chance: <span className="font-medium">{action.critChance}%</span></div>
              {action.energyCost > 0 && (
                <div>Energy Cost: <span className="font-medium">{action.energyCost}</span></div>
              )}
              {action.cooldown > 0 && (
                <div>Cooldown: <span className="font-medium">{action.cooldown} turns</span></div>
              )}
            </div>

            {action.effects.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Effects:</div>
                <div className="flex flex-wrap gap-1">
                  {action.effects.slice(0, 2).map(effect => (
                    <span key={effect.id} className="px-1 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                      {effect.name}
                    </span>
                  ))}
                  {action.effects.length > 2 && (
                    <span className="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      +{action.effects.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderSimulatorTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attacker Stats */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <h4 className="font-semibold mb-4">Attacker Stats</h4>
          <div className="space-y-3">
            {Object.entries(attackerStats).map(([stat, value]) => (
              <div key={stat} className="flex justify-between items-center">
                <label className="text-sm capitalize">{stat.replace(/([A-Z])/g, ' $1').trim()}:</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setAttackerStats({
                    ...attackerStats,
                    [stat]: parseFloat(e.target.value) || 0
                  })}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Action Selection */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <h4 className="font-semibold mb-4">Selected Action</h4>
          {selectedAction ? (
            <div className="space-y-3">
              <div className="font-medium">{selectedAction.name}</div>
              <div className="text-sm space-y-1">
                <div>Base Damage: {selectedAction.baseDamage}</div>
                <div>Damage Type: {selectedAction.damageType}</div>
                <div>Accuracy: {selectedAction.accuracy}%</div>
                <div>Crit Chance: {selectedAction.critChance}%</div>
                <div>Crit Multiplier: {selectedAction.critMultiplier}x</div>
              </div>
              <button
                onClick={runSimulation}
                className="w-full btn-primary mt-4"
              >
                Run Simulation (1000 tests)
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Select an action from the Actions tab first
            </div>
          )}
        </div>

        {/* Defender Stats */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <h4 className="font-semibold mb-4">Defender Stats</h4>
          <div className="space-y-3">
            {Object.entries(defenderStats).map(([stat, value]) => (
              <div key={stat} className="flex justify-between items-center">
                <label className="text-sm capitalize">{stat.replace(/([A-Z])/g, ' $1').trim()}:</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setDefenderStats({
                    ...defenderStats,
                    [stat]: parseFloat(e.target.value) || 0
                  })}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      {simulationResults && (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <h4 className="font-semibold mb-4">Simulation Results (1000 runs)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{simulationResults.averageDamage.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Damage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{simulationResults.hitRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{simulationResults.critRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Crit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{simulationResults.maxDamage}</div>
              <div className="text-sm text-gray-600">Max Damage</div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h5 className="font-medium mb-2">Sample Calculation Breakdown</h5>
            {simulationResults.sampleResult && (
              <div className="text-sm space-y-1">
                <div>Hit: {simulationResults.sampleResult.hit ? 'Yes' : 'Miss'}</div>
                {simulationResults.sampleResult.hit && (
                  <>
                    <div>Base Damage: {simulationResults.sampleResult.baseDamage?.toFixed(1)}</div>
                    <div>Damage Reduction: {simulationResults.sampleResult.damageReduction?.toFixed(1)}%</div>
                    <div>Final Damage: {simulationResults.sampleResult.damage}</div>
                    <div>Critical: {simulationResults.sampleResult.critical ? 'Yes' : 'No'}</div>
                    <div>Hit Chance: {simulationResults.sampleResult.hitChance?.toFixed(1)}%</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderBalanceTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Balance Analysis</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <h4 className="font-semibold mb-4">DPS Analysis</h4>
          <div className="space-y-4">
            {actions.map(action => {
              const dps = action.baseDamage / Math.max(1, action.cooldown + 1);
              const dpsWithCrit = dps * (1 + (action.critChance / 100) * (action.critMultiplier - 1));

              return (
                <div key={action.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <div className="font-medium">{action.name}</div>
                    <div className="text-sm text-gray-600">
                      Base DPS: {dps.toFixed(1)} | With Crits: {dpsWithCrit.toFixed(1)}
                    </div>
                  </div>
                  <div className={`px-2 py-1 text-sm rounded ${
                    dpsWithCrit > 15 ? 'bg-red-100 text-red-800' :
                    dpsWithCrit > 10 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {dpsWithCrit > 15 ? 'High' : dpsWithCrit > 10 ? 'Medium' : 'Low'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <h4 className="font-semibold mb-4">Resource Efficiency</h4>
          <div className="space-y-4">
            {actions.filter(a => a.energyCost > 0).map(action => {
              const efficiency = action.baseDamage / action.energyCost;

              return (
                <div key={action.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <div className="font-medium">{action.name}</div>
                    <div className="text-sm text-gray-600">
                      Damage per Energy: {efficiency.toFixed(2)}
                    </div>
                  </div>
                  <div className={`px-2 py-1 text-sm rounded ${
                    efficiency > 2 ? 'bg-green-100 text-green-800' :
                    efficiency > 1.5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {efficiency > 2 ? 'Efficient' : efficiency > 1.5 ? 'Fair' : 'Inefficient'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6">
        <h4 className="font-semibold mb-4">Balance Recommendations</h4>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <strong>Damage Balance:</strong> Keep basic attacks around 15-25 damage, spells 25-40, skills 35-50
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <strong>Critical Hits:</strong> Basic attacks should have 5-15% crit, advanced skills up to 25%
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
            <strong>Energy Costs:</strong> Aim for 1.5-2.5 damage per energy point for balanced gameplay
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Combat System Designer</h1>
          <p className="text-gray-600 dark:text-gray-400">Design and balance combat mechanics for your LitRPG world</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'actions', label: 'Combat Actions', icon: '⚔️' },
            { key: 'simulator', label: 'Battle Simulator', icon: '🎯' },
            { key: 'balance', label: 'Balance Analysis', icon: '⚖️' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'actions' && renderActionsTab()}
            {activeTab === 'simulator' && renderSimulatorTab()}
            {activeTab === 'balance' && renderBalanceTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}