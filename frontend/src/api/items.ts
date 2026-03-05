import { apiClient, ApiResponse } from './client';
import type { Item } from '../types/itemDatabase';

interface ItemApiPayload {
  id: string;
  name: string;
  description: string;
  type: Item['type'];
  sub_type: string;
  rarity: Item['rarity'];
  level: number;
  value: number;
  weight?: number | null;
  durability?: Item['durability'] | null;
  stats: Item['stats'];
  effects: Item['effects'];
  requirements: Item['requirements'];
  set_bonus?: Item['setBonus'] | null;
  enchantments: Item['enchantments'];
  stackable: boolean;
  max_stack?: number | null;
  sellable: boolean;
  tradeable: boolean;
  icon?: string | null;
  image?: string | null;
  lore?: string | null;
}

const toItem = (payload: ItemApiPayload): Item => ({
  id: payload.id,
  name: payload.name,
  description: payload.description ?? '',
  type: payload.type ?? 'weapon',
  subType: payload.sub_type ?? 'sword',
  rarity: payload.rarity ?? 'common',
  level: Number(payload.level ?? 1),
  value: Number(payload.value ?? 0),
  weight: payload.weight ?? undefined,
  durability: payload.durability ?? undefined,
  stats: payload.stats ?? [],
  effects: payload.effects ?? [],
  requirements: payload.requirements ?? {},
  setBonus: payload.set_bonus ?? undefined,
  enchantments: payload.enchantments ?? { slots: 0, used: 0, enchants: [] },
  stackable: Boolean(payload.stackable),
  maxStack: payload.max_stack ?? undefined,
  sellable: payload.sellable ?? true,
  tradeable: payload.tradeable ?? true,
  icon: payload.icon ?? undefined,
  image: payload.image ?? undefined,
  lore: payload.lore ?? undefined,
});

const toPayload = (item: Partial<Item>): Record<string, unknown> => ({
  id: item.id,
  name: item.name,
  description: item.description,
  type: item.type,
  sub_type: item.subType,
  rarity: item.rarity,
  level: item.level,
  value: item.value,
  weight: item.weight,
  durability: item.durability,
  stats: item.stats,
  effects: item.effects,
  requirements: item.requirements,
  set_bonus: item.setBonus,
  enchantments: item.enchantments,
  stackable: item.stackable,
  max_stack: item.maxStack,
  sellable: item.sellable,
  tradeable: item.tradeable,
  icon: item.icon,
  image: item.image,
  lore: item.lore,
});

const mapResponse = <T = unknown>(
  response: ApiResponse<T>,
  transform?: (data: T) => unknown
): ApiResponse<unknown> => ({
  success: response.success,
  data: response.data && transform ? transform(response.data) : response.data,
  error: response.error,
  message: response.message,
  status: response.status,
});

export const itemsApi = {
  getAll: async (): Promise<ApiResponse<Item[]>> => {
    const response = await apiClient.get<ItemApiPayload[]>('/items');
    return mapResponse(response, (items) => items.map(toItem)) as ApiResponse<Item[]>;
  },

  getById: async (id: string): Promise<ApiResponse<Item>> => {
    const response = await apiClient.get<ItemApiPayload>(`/items/${id}`);
    return mapResponse(response, toItem) as ApiResponse<Item>;
  },

  create: async (item: Partial<Item>): Promise<ApiResponse<Item>> => {
    const response = await apiClient.post<ItemApiPayload>('/items', toPayload(item));
    return mapResponse(response, toItem) as ApiResponse<Item>;
  },

  update: async (id: string, item: Partial<Item>): Promise<ApiResponse<Item>> => {
    const response = await apiClient.put<ItemApiPayload>(`/items/${id}`, toPayload(item));
    return mapResponse(response, toItem) as ApiResponse<Item>;
  },

  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/items/${id}`),
};
