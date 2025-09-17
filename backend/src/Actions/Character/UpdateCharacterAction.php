<?php
// ✅ CORRECT: Actions contain business logic
declare(strict_types=1);

namespace App\Actions\Character;

use App\External\CharacterRepository;
use App\Models\Character;

final class UpdateCharacterAction
{
    public function __construct(
        private readonly CharacterRepository $characterRepository
    ) {}

    public function execute(string $id, array $data): ?Character
    {
        // Validation
        if (empty($id)) {
            throw new \InvalidArgumentException('Character ID is required');
        }

        // Business logic - find character
        $character = $this->characterRepository->findById($id);
        if (!$character) {
            return null;
        }

        // Business logic - update character data
        return $this->characterRepository->updateFromArray($id, $data);
    }
}