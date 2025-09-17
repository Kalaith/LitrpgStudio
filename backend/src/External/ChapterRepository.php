<?php

declare(strict_types=1);

namespace App\External;

use App\Models\Chapter;

final class ChapterRepository
{
    public function findById(string $id): ?Chapter
    {
        return Chapter::find($id);
    }

    public function findAll(): array
    {
        return Chapter::all()->toArray();
    }

    public function findByStoryId(string $storyId): array
    {
        return Chapter::where('story_id', $storyId)->orderBy('chapter_number')->get()->toArray();
    }

    public function create(Chapter $chapter): Chapter
    {
        $chapter->save();
        return $chapter;
    }

    public function update(Chapter $chapter): Chapter
    {
        $chapter->save();
        return $chapter;
    }

    public function delete(string $id): bool
    {
        $chapter = $this->findById($id);
        if (!$chapter) {
            return false;
        }

        return $chapter->delete();
    }

    public function findWithRelations(string $id): ?Chapter
    {
        return Chapter::with(['story'])->find($id);
    }

    public function createFromArray(array $data): Chapter
    {
        return Chapter::create($data);
    }

    public function updateFromArray(string $id, array $data): ?Chapter
    {
        $chapter = $this->findById($id);
        if (!$chapter) {
            return null;
        }

        $chapter->update($data);
        return $chapter;
    }

    public function reorder(string $storyId, array $chapterIds): bool
    {
        foreach ($chapterIds as $index => $chapterId) {
            Chapter::where('id', $chapterId)
                ->where('story_id', $storyId)
                ->update(['chapter_number' => $index + 1]);
        }
        return true;
    }

    public function addCharacterProgression(string $chapterId, array $progressionData): ?Chapter
    {
        $chapter = $this->findById($chapterId);
        if (!$chapter) {
            return null;
        }

        $progression = $chapter->character_progression ?? [];
        $progression[] = $progressionData;

        $chapter->update(['character_progression' => $progression]);
        return $chapter;
    }

    public function updateWordCount(string $chapterId, int $wordCount): ?Chapter
    {
        $chapter = $this->findById($chapterId);
        if (!$chapter) {
            return null;
        }

        $chapter->update(['word_count' => $wordCount]);
        return $chapter;
    }
}