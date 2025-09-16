<?php

declare(strict_types=1);

namespace LitRPGStudio\Actions\Character;

use LitRPGStudio\External\CharacterRepository;
use LitRPGStudio\Models\Character;
use Ramsey\Uuid\Uuid;

final class AddItemToCharacterAction
{
    public function __construct(
        private readonly CharacterRepository $characterRepository
    ) {}

    public function execute(string $characterId, array $itemData): Character
    {
        $character = $this->characterRepository->findById($characterId);

        if (!$character) {
            throw new \InvalidArgumentException('Character not found');
        }

        // Validation
        if (empty($itemData['name'])) {
            throw new \InvalidArgumentException('Item name is required');
        }

        // Business logic - prepare item data
        $item = [
            'id' => Uuid::uuid4()->toString(),
            'name' => $itemData['name'],
            'type' => $itemData['type'] ?? 'misc',
            'rarity' => $itemData['rarity'] ?? 'common',
            'value' => $itemData['value'] ?? 0,
            'weight' => $itemData['weight'] ?? 0,
            'description' => $itemData['description'] ?? '',
            'stats' => $itemData['stats'] ?? [],
            'effects' => $itemData['effects'] ?? [],
            'quantity' => $itemData['quantity'] ?? 1,
            'equipped' => false
        ];

        // Add item to character inventory
        $inventory = $character->inventory ?? [];
        $inventory[] = $item;
        $character->inventory = $inventory;

        // Persistence
        return $this->characterRepository->update($character);
    }
}