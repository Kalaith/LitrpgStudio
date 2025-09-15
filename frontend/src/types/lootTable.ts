export interface LootTable {
  id: string;
  name: string;
  description: string;
  category: LootCategory;
  type: LootTableType;
  entries: LootEntry[];
  conditions: LootCondition[];
  modifiers: LootModifier[];
  metadata: LootTableMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type LootCategory = 'monster' | 'treasure' | 'container' | 'environment' | 'quest' | 'shop' | 'random_event';
export type LootTableType = 'simple' | 'weighted' | 'tiered' | 'conditional' | 'nested' | 'progressive';

export interface LootEntry {
  id: string;
  name: string;
  type: LootEntryType;
  item?: ItemReference;
  nestedTable?: string;
  quantity: QuantityRange;
  probability: ProbabilityData;
  conditions: LootCondition[];
  rarity: LootItemRarity;
  category: string;
  tags: string[];
  description: string;
}

export type LootEntryType = 'item' | 'currency' | 'experience' | 'table' | 'nothing' | 'effect' | 'custom';

export interface ItemReference {
  itemId?: string;
  itemName: string;
  itemType: string;
  properties: Record<string, unknown>;
  alternates: string[];
}

export interface QuantityRange {
  min: number;
  max: number;
  formula?: string;
  modifiers: QuantityModifier[];
}

export interface QuantityModifier {
  condition: string;
  multiplier: number;
  additive: number;
  description: string;
}

export interface ProbabilityData {
  weight: number;
  baseChance: number;
  scalingFactor: number;
  conditions: ProbabilityCondition[];
  rollType: 'simple' | 'advantage' | 'disadvantage' | 'multiple';
  rollModifier: number;
}

export interface ProbabilityCondition {
  condition: string;
  modifier: number;
  type: 'additive' | 'multiplicative' | 'override';
}

export interface LootCondition {
  id: string;
  name: string;
  type: ConditionType;
  operator: ConditionOperator;
  value: unknown;
  description: string;
}

export type ConditionType =
  | 'character_level'
  | 'party_size'
  | 'time_of_day'
  | 'location'
  | 'weather'
  | 'season'
  | 'difficulty'
  | 'enemy_type'
  | 'random_roll'
  | 'character_stat'
  | 'character_class'
  | 'character_race'
  | 'quest_status'
  | 'reputation'
  | 'custom';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'contains'
  | 'not_contains'
  | 'in_range'
  | 'not_in_range';

export interface LootModifier {
  id: string;
  name: string;
  type: ModifierType;
  effect: ModifierEffect;
  conditions: LootCondition[];
  priority: number;
  description: string;
}

export type ModifierType =
  | 'quantity_bonus'
  | 'quality_bonus'
  | 'rarity_shift'
  | 'additional_roll'
  | 'reroll'
  | 'upgrade'
  | 'curse'
  | 'blessing';

export interface ModifierEffect {
  target: string;
  operation: 'add' | 'multiply' | 'set' | 'reroll' | 'upgrade' | 'downgrade';
  value: number;
  limit?: number;
}

export interface LootTableMetadata {
  version: string;
  author: string;
  tags: string[];
  difficulty: DifficultyLevel;
  recommendedLevel: LevelRange;
  balanceScore: number;
  totalWeight: number;
  expectedValue: ExpectedValue;
  testResults: TestResult[];
}

export type DifficultyLevel = 'trivial' | 'easy' | 'normal' | 'hard' | 'extreme' | 'legendary';

export interface LevelRange {
  min: number;
  max: number;
  optimal: number;
}

export interface ExpectedValue {
  averageGoldValue: number;
  averageItemCount: number;
  rarityDistribution: Record<LootItemRarity, number>;
  typeDistribution: Record<string, number>;
}

export interface TestResult {
  id: string;
  timestamp: Date;
  sampleSize: number;
  results: LootRollResult[];
  statistics: RollStatistics;
  balanceAnalysis: BalanceAnalysis;
}

export interface LootRollResult {
  rollId: string;
  conditions: Record<string, unknown>;
  items: GeneratedItem[];
  totalValue: number;
  rollTime: number;
}

export interface GeneratedItem {
  name: string;
  quantity: number;
  rarity: LootItemRarity;
  value: number;
  source: string;
  modifiers: string[];
}

export interface RollStatistics {
  averageValue: number;
  medianValue: number;
  standardDeviation: number;
  minValue: number;
  maxValue: number;
  rarityDistribution: Record<LootItemRarity, number>;
  nothingPercentage: number;
  averageRollTime: number;
}

export interface BalanceAnalysis {
  balanceScore: number;
  issues: BalanceIssue[];
  recommendations: string[];
  comparisonData: ComparisonData;
}

export interface BalanceIssue {
  type: 'too_generous' | 'too_stingy' | 'rarity_imbalance' | 'outlier_items' | 'poor_distribution';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedEntries: string[];
  suggestedFix: string;
}

export interface ComparisonData {
  similarTables: string[];
  industryStandards: Record<string, number>;
  playerExpectations: Record<string, number>;
}

export type LootItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'artifact' | 'unique';

export interface LootTableTemplate {
  id: string;
  name: string;
  category: LootCategory;
  description: string;
  baseTable: Partial<LootTable>;
  customization: TemplateCustomization[];
}

export interface TemplateCustomization {
  field: string;
  type: 'text' | 'number' | 'select' | 'range' | 'boolean';
  label: string;
  description: string;
  defaultValue: unknown;
  options?: unknown[];
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

export interface LootTableSet {
  id: string;
  name: string;
  description: string;
  tables: string[];
  relationships: TableRelationship[];
  globalModifiers: LootModifier[];
  metadata: SetMetadata;
}

export interface TableRelationship {
  parentTable: string;
  childTable: string;
  type: 'nested' | 'sequential' | 'conditional' | 'alternative';
  conditions: LootCondition[];
  probability: number;
}

export interface SetMetadata {
  theme: string;
  difficulty: DifficultyLevel;
  levelRange: LevelRange;
  tags: string[];
  balanceScore: number;
}

export interface RandomizationEngine {
  type: 'mersenne_twister' | 'xorshift' | 'linear_congruential' | 'crypto_random' | 'custom';
  seed?: number;
  parameters: Record<string, unknown>;
}

export interface RollSession {
  id: string;
  tableId: string;
  conditions: Record<string, unknown>;
  engine: RandomizationEngine;
  results: LootRollResult[];
  startTime: Date;
  endTime?: Date;
  notes: string;
}

export interface LootSimulation {
  id: string;
  name: string;
  tableIds: string[];
  scenarios: SimulationScenario[];
  parameters: SimulationParameters;
  results: SimulationResult[];
  createdAt: Date;
}

export interface SimulationScenario {
  name: string;
  description: string;
  conditions: Record<string, unknown>;
  iterations: number;
  expectedOutcome: ExpectedOutcome;
}

export interface ExpectedOutcome {
  minValue: number;
  maxValue: number;
  targetRarity: LootItemRarity[];
  targetTypes: string[];
}

export interface SimulationParameters {
  totalRuns: number;
  parallelism: number;
  randomSeed: number;
  confidence: number;
  precision: number;
}

export interface SimulationResult {
  scenarioName: string;
  statistics: RollStatistics;
  distribution: DistributionData;
  performance: PerformanceMetrics;
  validation: ValidationResult;
}

export interface DistributionData {
  valueHistogram: HistogramBin[];
  rarityChart: Record<LootItemRarity, number>;
  typeChart: Record<string, number>;
  outliers: OutlierData[];
}

export interface HistogramBin {
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface OutlierData {
  value: number;
  frequency: number;
  standardDeviations: number;
  items: string[];
}

export interface PerformanceMetrics {
  averageRollTime: number;
  peakMemoryUsage: number;
  totalExecutionTime: number;
  rollsPerSecond: number;
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestedFix?: string;
}

export interface LootTableExport {
  format: 'json' | 'xml' | 'csv' | 'yaml' | 'sql' | 'code';
  options: ExportOptions;
  template?: string;
}

export interface ExportOptions {
  includeMetadata: boolean;
  includeComments: boolean;
  minify: boolean;
  language?: string;
  framework?: string;
  customFields: string[];
}
