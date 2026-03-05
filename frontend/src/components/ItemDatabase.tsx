import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { itemsApi } from '../api/items';
import type { Item } from '../types/itemDatabase';

interface ItemDatabaseProps {
  onItemSelect?: (item: Item) => void;
  onItemSave?: (item: Item) => void;
  onItemDelete?: (itemId: string) => void;
}

type SortField = 'name' | 'level' | 'rarity' | 'type' | 'value';
type SortDirection = 'asc' | 'desc';

export default function ItemDatabase({
  onItemSelect,
  onItemSave,
  onItemDelete
}: ItemDatabaseProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterRarity, setFilterRarity] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const rarityColors = {
    common: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
    uncommon: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    rare: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    epic: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    legendary: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    mythic: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' }
  };

  const itemTypes = {
    weapon: ['sword', 'axe', 'bow', 'staff', 'dagger', 'hammer', 'spear'],
    armor: ['helmet', 'chest', 'legs', 'boots', 'gloves', 'shield'],
    accessory: ['ring', 'necklace', 'earring', 'bracelet', 'belt'],
    consumable: ['potion', 'food', 'scroll', 'gem'],
    material: ['ore', 'herb', 'cloth', 'leather', 'crystal'],
    quest: ['key', 'document', 'artifact', 'trophy']
  };

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await itemsApi.getAll();
      if (!response.success) {
        throw new Error(response.error ?? response.message ?? 'Failed to load items');
      }

      setItems(response.data ?? []);
    } catch (loadError) {
      console.error('Failed to load items:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const updatedSelection = items.find((item) => item.id === selectedItem.id);
    if (!updatedSelection) {
      setSelectedItem(null);
      return;
    }

    if (updatedSelection !== selectedItem) {
      setSelectedItem(updatedSelection);
    }
  }, [items, selectedItem]);

  // Filter and sort items
  const processedItems = useMemo(() => {
    let result = [...items];

    // Apply filters
    if (searchTerm) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType) {
      result = result.filter(item => item.type === filterType);
    }

    if (filterRarity) {
      result = result.filter(item => item.rarity === filterRarity);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      // Special handling for rarity sorting
      if (sortField === 'rarity') {
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
        aValue = rarityOrder.indexOf(a.rarity);
        bValue = rarityOrder.indexOf(b.rarity);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

    return result;
  }, [items, searchTerm, filterType, filterRarity, sortField, sortDirection]);

  const handleCreateItem = async () => {
    setError(null);

    const newItem: Partial<Item> = {
      name: 'New Item',
      description: 'A newly created item',
      type: 'weapon',
      subType: 'sword',
      rarity: 'common',
      level: 1,
      value: 10,
      stats: [],
      effects: [],
      requirements: {},
      enchantments: { slots: 0, used: 0, enchants: [] },
      stackable: false,
      sellable: true,
      tradeable: true
    };

    try {
      const response = await itemsApi.create(newItem);
      if (!response.success || !response.data) {
        throw new Error(response.error ?? response.message ?? 'Failed to create item');
      }

      setItems(prev => [response.data!, ...prev]);
      setSelectedItem(response.data);
      onItemSave?.(response.data);
    } catch (createError) {
      console.error('Failed to create item:', createError);
      setError(createError instanceof Error ? createError.message : 'Failed to create item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setError(null);

    try {
      const response = await itemsApi.delete(itemId);
      if (!response.success) {
        throw new Error(response.error ?? response.message ?? 'Failed to delete item');
      }

      onItemDelete?.(itemId);
      setItems(currentItems => currentItems.filter(item => item.id !== itemId));
      setSelectedItem(null);
    } catch (deleteError) {
      console.error('Failed to delete item:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete item');
    }
  };

  const getRarityStyle = (rarity: string) => {
    return rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common;
  };

  const renderItemCard = (item: Item) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg
        border-2 ${getRarityStyle(item.rarity).border}
        ${selectedItem?.id === item.id ? 'ring-2 ring-blue-500' : ''}
      `}
      onClick={() => {
        setSelectedItem(item);
        if (onItemSelect) {
          onItemSelect(item);
        }
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          {item.icon && <span className="text-2xl mr-2">{item.icon}</span>}
          <div>
            <h4 className="font-semibold">{item.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {item.type} - {item.subType}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className={`
            px-2 py-1 text-xs font-medium rounded-full capitalize
            ${getRarityStyle(item.rarity).bg} ${getRarityStyle(item.rarity).text}
          `}>
            {item.rarity}
          </span>
          <span className="text-sm text-gray-500 mt-1">Lv.{item.level}</span>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {item.description}
      </p>

      {item.stats.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-500 mb-1">Stats:</div>
          <div className="flex flex-wrap gap-1">
            {item.stats.slice(0, 3).map((stat, index) => (
              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {stat.name}: +{stat.value}{stat.type === 'percentage' ? '%' : ''}
              </span>
            ))}
            {item.stats.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                +{item.stats.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-green-600">{item.value}g</span>
        {item.durability && (
          <span className="text-gray-500">
            {item.durability.current}/{item.durability.max} durability
          </span>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Item Database</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage items, equipment, and consumables</p>
          </div>
          <button
            onClick={() => void handleCreateItem()}
            disabled={isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            <span>*</span>
            <span>Create Item</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <option value="">All Types</option>
              {Object.keys(itemTypes).map(type => (
                <option key={type} value={type} className="capitalize">{type}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <option value="">All Rarities</option>
              {Object.keys(rarityColors).map(rarity => (
                <option key={rarity} value={rarity} className="capitalize">{rarity}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-') as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(direction);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="level-asc">Level (Low-High)</option>
              <option value="level-desc">Level (High-Low)</option>
              <option value="rarity-asc">Rarity (Common-Mythic)</option>
              <option value="rarity-desc">Rarity (Mythic-Common)</option>
              <option value="value-asc">Value (Low-High)</option>
              <option value="value-desc">Value (High-Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Items Grid */}
        <div className="flex-1 p-6 overflow-auto">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing {processedItems.length} of {items.length} items
            </span>
          </div>

          {isLoading && (
            <div className="text-sm text-gray-500 mb-4">Loading items...</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {processedItems.map(renderItemCard)}
            </AnimatePresence>
          </div>

          {processedItems.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">[]</div>
              <h3 className="text-xl font-semibold mb-2">No items found</h3>
              <p className="text-gray-400">
                {searchTerm || filterType || filterRarity
                  ? 'Try adjusting your search criteria'
                  : 'Create your first item to get started'
                }
              </p>
            </div>
          )}
        </div>

        {/* Item Details Panel */}
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                {selectedItem.icon && (
                  <span className="text-3xl mr-3">{selectedItem.icon}</span>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{selectedItem.name}</h3>
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full capitalize
                    ${getRarityStyle(selectedItem.rarity).bg} ${getRarityStyle(selectedItem.rarity).text}
                  `}>
                    {selectedItem.rarity}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                X
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedItem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span>
                  <div className="capitalize">{selectedItem.type} - {selectedItem.subType}</div>
                </div>
                <div>
                  <span className="font-medium">Level:</span>
                  <div>{selectedItem.level}</div>
                </div>
                <div>
                  <span className="font-medium">Value:</span>
                  <div className="text-green-600">{selectedItem.value}g</div>
                </div>
                {selectedItem.weight && (
                  <div>
                    <span className="font-medium">Weight:</span>
                    <div>{selectedItem.weight} kg</div>
                  </div>
                )}
              </div>

              {selectedItem.stats.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Stats</h4>
                  <div className="space-y-1">
                    {selectedItem.stats.map((stat, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{stat.name}:</span>
                        <span className="font-medium text-blue-600">
                          +{stat.value}{stat.type === 'percentage' ? '%' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.effects.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Effects</h4>
                  <div className="space-y-2">
                    {selectedItem.effects.map((effect, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                        <div className="font-medium text-sm">{effect.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {effect.description}
                        </div>
                        <div className="text-xs text-blue-600 capitalize">
                          {effect.type}
                          {effect.cooldown && ` | ${effect.cooldown}s cooldown`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.lore && (
                <div>
                  <h4 className="font-medium mb-2">Lore</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    "{selectedItem.lore}"
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      onItemSave?.(selectedItem);
                    }}
                    className="flex-1 btn-secondary text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleDeleteItem(selectedItem.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

