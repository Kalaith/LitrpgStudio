<?php

declare(strict_types=1);

namespace App\Actions\Character;

use App\External\CharacterRepository;
use App\Models\Character;

final class LevelUpCharacterAction
{
    public function __construct(
        private readonly CharacterRepository $characterRepository
    ) {}

    public function execute(string $characterId): Character
    {
        $character = $this->characterRepository->findById($characterId);

        if (!$character) {
            throw new \InvalidArgumentException('Character not found');
        }

        // Business logic - level up calculations
        $stats = $character->stats ?? [];
        $currentLevel = $stats['level'] ?? 1;
        $newLevel = $currentLevel + 1;

        // Update level
        $stats['level'] = $newLevel;

        // Calculate derived stats based on core attributes
        $constitution = $stats['constitution'] ?? 10;
        $intelligence = $stats['intelligence'] ?? 10;

        $stats['hitPoints'] = max(1, $constitution * 10 + $newLevel * 5);
        $stats['manaPoints'] = max(0, $intelligence * 5 + $newLevel * 3);

        // Update character
        $character->stats = $stats;

        // Persistence
        return $this->characterRepository->update($character);
    }
}