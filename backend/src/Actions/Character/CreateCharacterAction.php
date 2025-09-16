<?php

declare(strict_types=1);

namespace LitRPGStudio\Actions\Character;

use LitRPGStudio\External\CharacterRepository;
use LitRPGStudio\Models\Character;
use Ramsey\Uuid\Uuid;

final class CreateCharacterAction
{
    public function __construct(
        private readonly CharacterRepository $characterRepository
    ) {}

    public function execute(array $data): Character
    {
        // Validation
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('Character name is required');
        }

        // Business logic - prepare character data
        $characterData = [
            'id' => Uuid::uuid4()->toString(),
            'series_id' => $data['series_id'] ?? null,
            'name' => $data['name'],
            'race' => $data['race'] ?? '',
            'class' => $data['class'] ?? '',
            'background' => $data['background'] ?? '',
            'personality' => $data['personality'] ?? '',
            'appearance' => $data['appearance'] ?? '',
            'stats' => $data['stats'] ?? [],
            'skills' => $data['skills'] ?? [],
            'inventory' => $data['inventory'] ?? [],
            'equipment' => $data['equipment'] ?? [],
            'status_effects' => $data['status_effects'] ?? [],
            'level_progression' => $data['level_progression'] ?? [],
            'relationships' => $data['relationships'] ?? [],
            'backstory' => $data['backstory'] ?? '',
            'motivations' => $data['motivations'] ?? '',
            'flaws' => $data['flaws'] ?? '',
            'story_references' => $data['story_references'] ?? [],
            'cross_references' => $data['cross_references'] ?? []
        ];

        // Persistence
        return $this->characterRepository->createFromArray($characterData);
    }
}