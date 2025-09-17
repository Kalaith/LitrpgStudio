<?php

declare(strict_types=1);

namespace App\External;

use App\Models\Story;
use App\Models\StoryTemplate;

final class StoryRepository
{
    public function findById(string $id): ?Story
    {
        return Story::find($id);
    }

    public function findAll(): array
    {
        return Story::all()->toArray();
    }

    public function findBySeriesId(string $seriesId): array
    {
        return Story::where('series_id', $seriesId)->get()->toArray();
    }

    public function findByBookId(string $bookId): array
    {
        return Story::where('book_id', $bookId)->get()->toArray();
    }

    public function create(Story $story): Story
    {
        $story->save();
        return $story;
    }

    public function update(Story $story): Story
    {
        $story->save();
        return $story;
    }

    public function delete(string $id): bool
    {
        $story = $this->findById($id);
        if (!$story) {
            return false;
        }

        return $story->delete();
    }

    public function findWithRelations(string $id): ?Story
    {
        return Story::with(['series', 'book'])->find($id);
    }

    public function createFromArray(array $data): Story
    {
        return Story::create($data);
    }

    public function updateFromArray(string $id, array $data): ?Story
    {
        $story = $this->findById($id);
        if (!$story) {
            return null;
        }

        $story->update($data);
        return $story;
    }

    public function addEvent(string $storyId, array $eventData): ?Story
    {
        $story = $this->findById($storyId);
        if (!$story) {
            return null;
        }

        $events = $story->story_events ?? [];
        $events[] = $eventData;

        $story->update(['story_events' => $events]);
        return $story;
    }

    public function findTemplates(): array
    {
        return StoryTemplate::where('is_public', true)->get()->toArray();
    }

    public function createTemplate(array $data): StoryTemplate
    {
        return StoryTemplate::create([
            'story_id' => $data['story_id'] ?? null,
            'name' => $data['name'] ?? '',
            'description' => $data['description'] ?? '',
            'template_data' => $data['template_data'] ?? [],
            'is_public' => $data['is_public'] ?? false,
            'usage_count' => 0
        ]);
    }

    public function createFromTemplate(string $templateId, array $data): ?Story
    {
        $template = StoryTemplate::find($templateId);

        if (!$template) {
            return null;
        }

        $templateData = $template->template_data ?? [];
        $storyData = array_merge($templateData, $data);
        $storyData['id'] = \Ramsey\Uuid\Uuid::uuid4()->toString();

        $story = $this->createFromArray($storyData);

        // Increment template usage
        $template->increment('usage_count');

        return $story;
    }
}