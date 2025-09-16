<?php

declare(strict_types=1);

namespace LitRPGStudio\Actions\Character;

use LitRPGStudio\External\CharacterRepository;
use LitRPGStudio\Models\Character;
use Ramsey\Uuid\Uuid;

final class AddSkillToCharacterAction
{
    public function __construct(
        private readonly CharacterRepository $characterRepository
    ) {}

    public function execute(string $characterId, array $skillData): Character
    {
        $character = $this->characterRepository->findById($characterId);

        if (!$character) {
            throw new \InvalidArgumentException('Character not found');
        }

        // Validation
        if (empty($skillData['name'])) {
            throw new \InvalidArgumentException('Skill name is required');
        }

        // Business logic - prepare skill data
        $skill = [
            'id' => Uuid::uuid4()->toString(),
            'name' => $skillData['name'],
            'level' => $skillData['level'] ?? 1,
            'experience' => $skillData['experience'] ?? 0,
            'description' => $skillData['description'] ?? '',
            'type' => $skillData['type'] ?? 'combat',
            'requirements' => $skillData['requirements'] ?? []
        ];

        // Add skill to character
        $skills = $character->skills ?? [];
        $skills[] = $skill;
        $character->skills = $skills;

        // Persistence
        return $this->characterRepository->update($character);
    }
}