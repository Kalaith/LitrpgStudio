import type { CombatAction, CombatStats } from '../components/CombatSystemDesigner';
import { APP_CONFIG } from '../constants';

export interface DamageCalculationResult {
  hit: boolean;
  damage: number;
  critical: boolean;
  effects: unknown[];
  baseDamage?: number;
  damageReduction?: number;
  hitChance?: number;
  critChance?: number;
}

export interface CombatSimulationResult {
  totalSimulations: number;
  hits: number;
  misses: number;
  criticals: number;
  averageDamage: number;
  maxDamage: number;
  minDamage: number;
  hitRate: number;
  critRate: number;
  sampleResult: DamageCalculationResult;
}

export class CombatService {
  static calculateDamage(
    action: CombatAction,
    attacker: CombatStats,
    defender: CombatStats
  ): DamageCalculationResult {
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
    const defense = action.damageType === 'physical' ? defender.defense : defender.magicDefense;
    const damageReduction = defense / (defense + 100);
    let finalDamage = baseDmg * (1 - damageReduction);

    // Check for hit
    const hitChance = action.accuracy + attacker.accuracy - defender.evasion;
    const isHit = Math.random() * 100 < hitChance;

    if (!isHit) {
      return {
        hit: false,
        damage: 0,
        critical: false,
        effects: [],
        hitChance
      };
    }

    // Check for critical hit
    const critChance = action.critChance + attacker.criticalRate;
    const isCritical = Math.random() * 100 < critChance;

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
  }

  static runSimulation(
    action: CombatAction,
    attacker: CombatStats,
    defender: CombatStats,
    runs: number = APP_CONFIG.COMBAT_SIMULATION_RUNS
  ): CombatSimulationResult {
    const results: DamageCalculationResult[] = [];

    for (let i = 0; i < runs; i++) {
      const result = this.calculateDamage(action, attacker, defender);
      results.push(result);
    }

    const hits = results.filter(r => r.hit);
    const criticals = results.filter(r => r.critical);
    const damageValues = hits.map(r => r.damage);

    return {
      totalSimulations: runs,
      hits: hits.length,
      misses: results.length - hits.length,
      criticals: criticals.length,
      averageDamage: results.reduce((sum, r) => sum + r.damage, 0) / runs,
      maxDamage: damageValues.length > 0 ? Math.max(...damageValues) : 0,
      minDamage: damageValues.length > 0 ? Math.min(...damageValues) : 0,
      hitRate: (hits.length / runs) * 100,
      critRate: (criticals.length / runs) * 100,
      sampleResult: results[0]
    };
  }

  static calculateDPS(action: CombatAction): number {
    return action.baseDamage / Math.max(1, action.cooldown + 1);
  }

  static calculateDPSWithCrits(action: CombatAction): number {
    const baseDPS = this.calculateDPS(action);
    return baseDPS * (1 + (action.critChance / 100) * (action.critMultiplier - 1));
  }

  static calculateResourceEfficiency(action: CombatAction): number {
    if (action.energyCost <= 0) return 0;
    return action.baseDamage / action.energyCost;
  }

  static getBalanceRecommendation(action: CombatAction): {
    dpsRating: 'low' | 'medium' | 'high';
    efficiencyRating: 'inefficient' | 'fair' | 'efficient';
    suggestions: string[];
  } {
    const dpsWithCrits = this.calculateDPSWithCrits(action);
    const efficiency = this.calculateResourceEfficiency(action);
    const suggestions: string[] = [];

    let dpsRating: 'low' | 'medium' | 'high' = 'low';
    if (dpsWithCrits > 15) {
      dpsRating = 'high';
      suggestions.push('Consider reducing damage or increasing cooldown');
    } else if (dpsWithCrits > 10) {
      dpsRating = 'medium';
    } else {
      suggestions.push('Consider increasing damage or reducing cooldown');
    }

    let efficiencyRating: 'inefficient' | 'fair' | 'efficient' = 'inefficient';
    if (efficiency > 2) {
      efficiencyRating = 'efficient';
    } else if (efficiency > 1.5) {
      efficiencyRating = 'fair';
    } else if (action.energyCost > 0) {
      suggestions.push('Consider reducing energy cost or increasing damage');
    }

    return {
      dpsRating,
      efficiencyRating,
      suggestions
    };
  }
}