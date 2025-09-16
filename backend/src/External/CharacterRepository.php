<?php

declare(strict_types=1);

namespace LitRPGStudio\External;

use LitRPGStudio\Models\Character;
use LitRPGStudio\Models\CharacterTemplate;

final class CharacterRepository
{
    public function findById(string $id): ?Character
    {
        return Character::find($id);
    }

    public function findAll(): array
    {
        return Character::all()->toArray();
    }

    public function findBySeriesId(string $seriesId): array
    {
        return Character::where('series_id', $seriesId)->get()->toArray();
    }

    public function create(Character $character): Character
    {
        $character->save();
        return $character;
    }

    public function update(Character $character): Character
    {
        $character->save();
        return $character;
    }

    public function delete(string $id): bool
    {
        $character = $this->findById($id);
        if (!$character) {
            return false;
        }

        return $character->delete();
    }

    public function findWithRelations(string $id): ?Character
    {
        return Character::with(['series'])->find($id);
    }

    public function createFromArray(array $data): Character
    {
        return Character::create($data);
    }

    public function updateFromArray(string $id, array $data): ?Character
    {
        $character = $this->findById($id);
        if (!$character) {
            return null;
        }

        $character->update($data);
        return $character;
    }

    public function findTemplates(?string $characterId = null): array
    {
        $query = CharacterTemplate::where('is_public', true);

        if ($characterId) {
            $query->orWhere('character_id', $characterId);
        }

        return $query->get()->toArray();
    }

    public function createTemplate(array $data): CharacterTemplate
    {
        return CharacterTemplate::create([
            'character_id' => $data['character_id'] ?? null,
            'name' => $data['name'] ?? '',
            'description' => $data['description'] ?? '',
            'template_data' => $data['template_data'] ?? [],
            'is_public' => $data['is_public'] ?? false,
            'usage_count' => 0
        ]);
    }

    public function createFromTemplate(string $templateId, string $name): ?Character
    {
        $template = CharacterTemplate::find($templateId);

        if (!$template) {
            return null;
        }

        $templateData = $template->template_data ?? [];
        $templateData['name'] = $name ?: ($templateData['name'] ?? '');
        $templateData['id'] = \Ramsey\Uuid\Uuid::uuid4()->toString();

        $character = $this->createFromArray($templateData);

        // Increment template usage
        $template->increment('usage_count');

        return $character;
    }
}