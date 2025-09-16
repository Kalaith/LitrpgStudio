<?php

declare(strict_types=1);

namespace LitRPGStudio\Actions\Character;

use LitRPGStudio\External\CharacterRepository;
use LitRPGStudio\Models\Character;

final class ManageCharacterEquipmentAction
{
    public function __construct(
        private readonly CharacterRepository $characterRepository
    ) {}

    public function equipItem(string $characterId, string $itemId): Character
    {
        $character = $this->characterRepository->findById($characterId);

        if (!$character) {
            throw new \InvalidArgumentException('Character not found');
        }

        $inventory = $character->inventory ?? [];
        $equipment = $character->equipment ?? [];

        // Find and equip item
        foreach ($inventory as &$item) {
            if ($item['id'] === $itemId) {
                $item['equipped'] = true;
                $equipment[$item['type']] = $item;
                break;
            }
        }

        $character->inventory = $inventory;
        $character->equipment = $equipment;

        return $this->characterRepository->update($character);
    }

    public function unequipItem(string $characterId, string $itemId): Character
    {
        $character = $this->characterRepository->findById($characterId);

        if (!$character) {
            throw new \InvalidArgumentException('Character not found');
        }

        $inventory = $character->inventory ?? [];
        $equipment = $character->equipment ?? [];

        // Find and unequip item
        foreach ($inventory as &$item) {
            if ($item['id'] === $itemId) {
                $item['equipped'] = false;
                unset($equipment[$item['type']]);
                break;
            }
        }

        $character->inventory = $inventory;
        $character->equipment = $equipment;

        return $this->characterRepository->update($character);
    }

    public function removeItem(string $characterId, string $itemId): Character
    {
        $character = $this->characterRepository->findById($characterId);

        if (!$character) {
            throw new \InvalidArgumentException('Character not found');
        }

        $inventory = $character->inventory ?? [];
        $inventory = array_filter($inventory, fn($item) => $item['id'] !== $itemId);

        $character->inventory = array_values($inventory);

        return $this->characterRepository->update($character);
    }
}