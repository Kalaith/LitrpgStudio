export interface SystemBible {
  id: string;
  name: string;
  version: string;
  description: string;
  gameSystem: GameSystemDefinition;
  documentation: SystemDocumentation;
  templates: DocumentationTemplate[];
  exportFormats: ExportFormat[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSystemDefinition {
  core: CoreSystem;
  combat: CombatSystem;
  magic: MagicSystem;
  skills: SkillSystem;
  items: ItemSystem;
  character: CharacterSystem;
  progression: ProgressionSystem;
  economy: EconomySystem;
  social: SocialSystem;
}

export interface CoreSystem {
  name: string;
  genre: string;
  complexity: 'simple' | 'moderate' | 'complex';
  baseRules: GameRule[];
  dice: DiceSystem;
  attributes: AttributeDefinition[];
  coreLoop: string;
}

export interface GameRule {
  id: string;
  name: string;
  category: string;
  description: string;
  examples: string[];
  exceptions: string[];
  priority: number;
  relatedRules: string[];
}

export interface DiceSystem {
  type: 'd20' | '3d6' | '2d10' | 'percentile' | 'custom';
  description: string;
  modifiers: DiceModifier[];
  criticals: CriticalRule[];
}

export interface DiceModifier {
  name: string;
  value: number;
  condition: string;
  description: string;
}

export interface CriticalRule {
  type: 'success' | 'failure';
  threshold: number;
  effect: string;
  description: string;
}

export interface AttributeDefinition {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  range: { min: number; max: number };
  derivedStats: string[];
  useIn: string[];
}

export interface CombatSystem {
  initiative: InitiativeSystem;
  actions: ActionSystem;
  damage: DamageSystem;
  healing: HealingSystem;
  conditions: StatusCondition[];
  tactical: TacticalRules;
}

export interface InitiativeSystem {
  type: 'dexterity' | 'roll' | 'speed' | 'custom';
  formula: string;
  modifiers: string[];
  description: string;
}

export interface ActionSystem {
  actionTypes: ActionType[];
  actionEconomy: ActionEconomy;
  reactions: ReactionRule[];
}

export interface ActionType {
  name: string;
  cost: string;
  description: string;
  examples: string[];
  restrictions: string[];
}

export interface ActionEconomy {
  structure: string;
  details: string;
  examples: ActionExample[];
}

export interface ActionExample {
  scenario: string;
  actions: string[];
  explanation: string;
}

export interface ReactionRule {
  trigger: string;
  response: string;
  cost: string;
  description: string;
}

export interface DamageSystem {
  types: DamageType[];
  calculation: string;
  resistances: ResistanceRule[];
  armor: ArmorSystem;
}

export interface DamageType {
  name: string;
  description: string;
  sources: string[];
  interactions: string[];
}

export interface ResistanceRule {
  type: string;
  effect: string;
  sources: string[];
  calculation: string;
}

export interface ArmorSystem {
  type: 'AC' | 'damage_reduction' | 'ablative' | 'custom';
  calculation: string;
  interactions: string[];
  description: string;
}

export interface HealingSystem {
  types: HealingType[];
  limitations: string[];
  costs: string[];
}

export interface HealingType {
  name: string;
  method: string;
  effectiveness: string;
  restrictions: string[];
}

export interface StatusCondition {
  name: string;
  description: string;
  effects: string[];
  duration: string;
  removal: string[];
  stacking: boolean;
}

export interface TacticalRules {
  positioning: string[];
  movement: MovementRule[];
  terrain: TerrainRule[];
  environment: EnvironmentRule[];
}

export interface MovementRule {
  type: string;
  speed: string;
  restrictions: string[];
  description: string;
}

export interface TerrainRule {
  type: string;
  effects: string[];
  movement: string;
  combat: string;
}

export interface EnvironmentRule {
  condition: string;
  effects: string[];
  duration: string;
  description: string;
}

export interface MagicSystem {
  type: 'vancian' | 'mana' | 'spell_points' | 'cooldown' | 'ritual' | 'custom';
  description: string;
  schools: MagicSchool[];
  casting: CastingSystem;
  components: MagicComponent[];
  limitations: MagicLimitation[];
}

export interface MagicSchool {
  name: string;
  focus: string;
  description: string;
  spellTypes: string[];
  practitioners: string[];
  philosophy: string;
}

export interface CastingSystem {
  method: string;
  requirements: string[];
  time: CastingTime[];
  range: RangeDefinition[];
  interruption: string;
}

export interface CastingTime {
  type: string;
  duration: string;
  description: string;
}

export interface RangeDefinition {
  type: string;
  distance: string;
  description: string;
}

export interface MagicComponent {
  type: 'verbal' | 'somatic' | 'material' | 'focus' | 'divine';
  description: string;
  requirements: string[];
  alternatives: string[];
}

export interface MagicLimitation {
  type: string;
  description: string;
  scope: string;
  workarounds: string[];
}

export interface SkillSystem {
  structure: 'list' | 'tree' | 'point_buy' | 'class_based';
  skills: SkillDefinition[];
  advancement: SkillAdvancement;
  synergies: SkillSynergy[];
}

export interface SkillDefinition {
  id: string;
  name: string;
  category: string;
  attribute: string;
  description: string;
  uses: string[];
  difficulties: DifficultyClass[];
  specializations: string[];
}

export interface DifficultyClass {
  name: string;
  value: number;
  description: string;
  examples: string[];
}

export interface SkillAdvancement {
  method: string;
  costs: AdvancementCost[];
  limitations: string[];
  milestones: SkillMilestone[];
}

export interface AdvancementCost {
  level: string;
  cost: string;
  requirements: string[];
}

export interface SkillMilestone {
  level: number;
  benefits: string[];
  unlocks: string[];
}

export interface SkillSynergy {
  skills: string[];
  benefit: string;
  description: string;
}

export interface ItemSystem {
  categories: ItemCategory[];
  properties: ItemProperty[];
  crafting: CraftingSystem;
  enchantment: EnchantmentSystem;
  economy: ItemEconomy;
}

export interface ItemCategory {
  name: string;
  description: string;
  subcategories: string[];
  properties: string[];
  examples: ItemExample[];
}

export interface ItemExample {
  name: string;
  description: string;
  properties: Record<string, unknown>;
  value: number;
}

export interface ItemProperty {
  name: string;
  type: 'numeric' | 'boolean' | 'string' | 'list';
  description: string;
  affects: string[];
  examples: string[];
}

export interface CraftingSystem {
  methods: CraftingMethod[];
  materials: Material[];
  recipes: CraftingRecipe[];
  quality: QualitySystem;
}

export interface CraftingMethod {
  name: string;
  description: string;
  requirements: string[];
  time: string;
  success: string;
}

export interface Material {
  name: string;
  type: string;
  rarity: string;
  properties: string[];
  sources: string[];
}

export interface CraftingRecipe {
  name: string;
  result: string;
  materials: MaterialRequirement[];
  method: string;
  difficulty: number;
  time: string;
}

export interface MaterialRequirement {
  material: string;
  quantity: number;
  quality?: string;
  alternatives?: string[];
}

export interface QualitySystem {
  levels: QualityLevel[];
  effects: QualityEffect[];
  determination: string;
}

export interface QualityLevel {
  name: string;
  description: string;
  modifier: number;
  rarity: string;
}

export interface QualityEffect {
  quality: string;
  effects: string[];
  bonuses: Record<string, number>;
}

export interface EnchantmentSystem {
  types: EnchantmentType[];
  process: EnchantmentProcess;
  limitations: EnchantmentLimitation[];
}

export interface EnchantmentType {
  name: string;
  school: string;
  effects: string[];
  requirements: string[];
  cost: string;
}

export interface EnchantmentProcess {
  steps: string[];
  requirements: string[];
  time: string;
  success: string;
  risks: string[];
}

export interface EnchantmentLimitation {
  type: string;
  description: string;
  scope: string;
  exceptions: string[];
}

export interface ItemEconomy {
  pricing: PricingRule[];
  availability: AvailabilityRule[];
  trade: TradeRule[];
}

export interface PricingRule {
  category: string;
  basePrice: string;
  modifiers: PriceModifier[];
}

export interface PriceModifier {
  factor: string;
  multiplier: number;
  description: string;
}

export interface AvailabilityRule {
  item: string;
  location: string;
  chance: number;
  conditions: string[];
}

export interface TradeRule {
  type: string;
  description: string;
  examples: string[];
}

export interface CharacterSystem {
  creation: CharacterCreation;
  advancement: CharacterAdvancement;
  classes: CharacterClass[];
  races: CharacterRace[];
  backgrounds: CharacterBackground[];
}

export interface CharacterCreation {
  method: string;
  steps: CreationStep[];
  options: CreationOption[];
  restrictions: string[];
}

export interface CreationStep {
  order: number;
  name: string;
  description: string;
  choices: string[];
  effects: string[];
}

export interface CreationOption {
  category: string;
  options: string[];
  effects: Record<string, unknown>;
}

export interface CharacterAdvancement {
  triggers: AdvancementTrigger[];
  choices: AdvancementChoice[];
  caps: AdvancementCap[];
}

export interface AdvancementTrigger {
  type: string;
  condition: string;
  frequency: string;
}

export interface AdvancementChoice {
  category: string;
  options: string[];
  restrictions: string[];
}

export interface AdvancementCap {
  attribute: string;
  maximum: number;
  conditions: string[];
}

export interface CharacterClass {
  name: string;
  description: string;
  role: string;
  primaryAttributes: string[];
  hitDie: string;
  skills: string[];
  abilities: ClassAbility[];
  progression: ClassProgression[];
}

export interface ClassAbility {
  name: string;
  level: number;
  description: string;
  type: 'active' | 'passive' | 'reaction';
  uses: string;
}

export interface ClassProgression {
  level: number;
  hitPoints: string;
  abilities: string[];
  bonuses: Record<string, number>;
}

export interface CharacterRace {
  name: string;
  description: string;
  traits: RacialTrait[];
  attributeModifiers: Record<string, number>;
  size: string;
  speed: number;
  languages: string[];
}

export interface RacialTrait {
  name: string;
  description: string;
  type: 'innate' | 'learned' | 'cultural';
  mechanics: string;
}

export interface CharacterBackground {
  name: string;
  description: string;
  skills: string[];
  equipment: string[];
  connections: string[];
  traits: string[];
}

export interface ProgressionSystem {
  experience: ExperienceSystem;
  levels: LevelProgression[];
  milestones: ProgressionMilestone[];
  alternatives: AlternativeProgression[];
}

export interface ExperienceSystem {
  sources: ExperienceSource[];
  calculation: string;
  scaling: string;
  caps: string[];
}

export interface ExperienceSource {
  type: string;
  amount: string;
  conditions: string[];
  frequency: string;
}

export interface LevelProgression {
  level: number;
  experienceRequired: number;
  benefits: LevelBenefit[];
  unlocks: string[];
}

export interface LevelBenefit {
  type: string;
  description: string;
  value: number;
}

export interface ProgressionMilestone {
  name: string;
  description: string;
  requirements: string[];
  rewards: string[];
}

export interface AlternativeProgression {
  name: string;
  description: string;
  method: string;
  benefits: string[];
}

export interface EconomySystem {
  currency: CurrencySystem;
  trade: TradeSystem;
  services: ServiceDefinition[];
  taxation: TaxationRule[];
}

export interface CurrencySystem {
  denominations: Currency[];
  exchange: ExchangeRate[];
  usage: CurrencyUsage[];
}

export interface Currency {
  name: string;
  symbol: string;
  value: number;
  material: string;
  description: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  conditions: string[];
}

export interface CurrencyUsage {
  context: string;
  preferred: string[];
  accepted: string[];
}

export interface TradeSystem {
  methods: TradeMethod[];
  routes: TradeRoute[];
  goods: TradeGood[];
  regulations: TradeRegulation[];
}

export interface TradeMethod {
  type: string;
  description: string;
  requirements: string[];
  benefits: string[];
}

export interface TradeRoute {
  name: string;
  locations: string[];
  goods: string[];
  dangers: string[];
  duration: string;
}

export interface TradeGood {
  name: string;
  category: string;
  baseValue: number;
  rarity: string;
  demand: Record<string, number>;
}

export interface TradeRegulation {
  type: string;
  description: string;
  enforcement: string;
  penalties: string[];
}

export interface ServiceDefinition {
  name: string;
  provider: string;
  cost: string;
  duration: string;
  availability: string;
  quality: string[];
}

export interface TaxationRule {
  type: string;
  rate: string;
  base: string;
  exemptions: string[];
  collection: string;
}

export interface SocialSystem {
  hierarchy: SocialHierarchy;
  relationships: RelationshipRule[];
  reputation: ReputationSystem;
  communication: CommunicationRule[];
}

export interface SocialHierarchy {
  structure: string;
  levels: SocialLevel[];
  mobility: string;
}

export interface SocialLevel {
  name: string;
  description: string;
  requirements: string[];
  privileges: string[];
  obligations: string[];
}

export interface RelationshipRule {
  type: string;
  description: string;
  effects: string[];
  maintenance: string;
}

export interface ReputationSystem {
  categories: ReputationCategory[];
  effects: ReputationEffect[];
  changes: ReputationChange[];
}

export interface ReputationCategory {
  name: string;
  description: string;
  scale: string;
  groups: string[];
}

export interface ReputationEffect {
  level: string;
  effects: string[];
  interactions: string[];
}

export interface ReputationChange {
  action: string;
  change: number;
  conditions: string[];
}

export interface CommunicationRule {
  method: string;
  range: string;
  requirements: string[];
  limitations: string[];
}

export interface SystemDocumentation {
  quickReference: QuickReference;
  playerGuide: PlayerGuide;
  gmGuide: GMGuide;
  examples: GameExample[];
  appendices: Appendix[];
}

export interface QuickReference {
  sections: QuickRefSection[];
  tables: ReferenceTable[];
  formulas: FormulaReference[];
}

export interface QuickRefSection {
  title: string;
  content: string;
  subsections: string[];
}

export interface ReferenceTable {
  name: string;
  headers: string[];
  rows: string[][];
  notes: string[];
}

export interface FormulaReference {
  name: string;
  formula: string;
  variables: FormulaVariable[];
  example: string;
}

export interface FormulaVariable {
  symbol: string;
  name: string;
  description: string;
}

export interface PlayerGuide {
  introduction: string;
  characterCreation: string;
  basicRules: string;
  combat: string;
  magic: string;
  advancement: string;
  equipment: string;
  appendices: string[];
}

export interface GMGuide {
  introduction: string;
  worldBuilding: string;
  npcs: string;
  encounters: string;
  campaigns: string;
  customization: string;
  troubleshooting: string;
  resources: string[];
}

export interface GameExample {
  title: string;
  scenario: string;
  participants: ExampleParticipant[];
  steps: ExampleStep[];
  outcome: string;
  lessons: string[];
}

export interface ExampleParticipant {
  name: string;
  role: string;
  stats: Record<string, unknown>;
  description: string;
}

export interface ExampleStep {
  order: number;
  actor: string;
  action: string;
  mechanics: string;
  result: string;
}

export interface Appendix {
  title: string;
  content: string;
  references: string[];
}

export interface DocumentationTemplate {
  id: string;
  name: string;
  type: 'section' | 'table' | 'example' | 'formula';
  category: string;
  template: string;
  variables: TemplateVariable[];
  examples: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'list' | 'object';
  description: string;
  defaultValue?: unknown;
  required: boolean;
}

export interface ExportFormat {
  name: string;
  description: string;
  fileExtension: string;
  mimeType: string;
  options: ExportOption[];
  template: string;
}

export interface ExportOption {
  name: string;
  type: 'boolean' | 'string' | 'number' | 'select';
  description: string;
  defaultValue: unknown;
  options?: string[];
}