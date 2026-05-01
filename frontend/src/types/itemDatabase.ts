export interface ItemStat {
  name: string;
  value: number;
  type: "flat" | "percentage";
}

export interface ItemEffect {
  id: string;
  name: string;
  description: string;
  type: "passive" | "active" | "proc";
  trigger?: string;
  cooldown?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: "weapon" | "armor" | "accessory" | "consumable" | "material" | "quest";
  subType: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  level: number;
  value: number;
  weight?: number;
  durability?: {
    current: number;
    max: number;
  };
  stats: ItemStat[];
  effects: ItemEffect[];
  requirements: {
    level?: number;
    class?: string[];
    stats?: Record<string, number>;
  };
  setBonus?: {
    setName: string;
    pieces: number;
    bonuses: Record<number, string[]>;
  };
  enchantments: {
    slots: number;
    used: number;
    enchants: Array<{
      name: string;
      effect: string;
      power: number;
    }>;
  };
  stackable: boolean;
  maxStack?: number;
  sellable: boolean;
  tradeable: boolean;
  icon?: string;
  image?: string;
  lore?: string;
}
