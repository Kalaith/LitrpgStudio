<?php
// ✅ CORRECT: Actions contain business logic
declare(strict_types=1);

namespace App\Actions\Character;

use App\External\CharacterRepository;
use App\Models\Character;

final class UpdateCharacterSkillAction
{
    public function __construct(
        private readonly CharacterRepository $characterRepository
    ) {}

    public function execute(string $characterId, string $skillId, array $skillData): ?Character
    {
        // Validation
        if (empty($characterId) || empty($skillId)) {
            throw new \InvalidArgumentException('Character ID and Skill ID are required');
        }

        // Business logic - find character
        $character = $this->characterRepository->findById($characterId);
        if (!$character) {
            return null;
        }

        // Business logic - update specific skill
        $skills = $character->skills ?? [];
        $skillFound = false;

        foreach ($skills as &$skill) {
            if ($skill['id'] === $skillId) {
                $skill = array_merge($skill, $skillData);
                $skillFound = true;
                break;
            }
        }

        if (!$skillFound) {
            throw new \InvalidArgumentException('Skill not found');
        }

        // Update character with modified skills
        $character->skills = $skills;
        return $this->characterRepository->update($character);
    }
}