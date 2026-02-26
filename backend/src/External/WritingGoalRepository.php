<?php

declare(strict_types=1);

namespace App\External;

use App\Models\WritingGoal;

class WritingGoalRepository
{
    public function findAll(): array
    {
        return WritingGoal::orderBy('created_at', 'desc')->get()->toArray();
    }

    public function findById(string $id): ?array
    {
        $goal = WritingGoal::find($id);
        return $goal ? $goal->toArray() : null;
    }

    public function findActive(): array
    {
        return WritingGoal::active()
            ->orderBy('deadline', 'asc')
            ->get()
            ->toArray();
    }

    public function findByType(string $type): array
    {
        return WritingGoal::ofType($type)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function findOverdue(): array
    {
        return WritingGoal::overdue()
            ->orderBy('deadline', 'asc')
            ->get()
            ->toArray();
    }

    public function findByStoryId(string $storyId): array
    {
        return WritingGoal::where('story_id', $storyId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function findByBookId(string $bookId): array
    {
        return WritingGoal::where('book_id', $bookId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function create(array $data): array
    {
        $goal = WritingGoal::create($data);
        return $goal->toArray();
    }

    public function update(string $id, array $data): array
    {
        $goal = WritingGoal::findOrFail($id);
        $goal->update($data);
        return $goal->fresh()->toArray();
    }

    public function delete(string $id): bool
    {
        $goal = WritingGoal::findOrFail($id);
        return $goal->delete();
    }

    public function updateProgress(string $id, int $amount): array
    {
        $goal = WritingGoal::findOrFail($id);
        $goal->updateProgress($amount);
        return $goal->fresh()->toArray();
    }

    public function markComplete(string $id): array
    {
        $goal = WritingGoal::findOrFail($id);
        $goal->markComplete();
        return $goal->fresh()->toArray();
    }

    /**
     * Statistics
     */
    public function getAchievementRate(?string $startDate = null, ?string $endDate = null): float
    {
        $query = WritingGoal::query();

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }

        $total = $query->count();
        if ($total === 0) {
            return 0;
        }

        $completed = (clone $query)->completed()->count();

        return round(($completed / $total) * 100, 2);
    }

    public function getActiveGoalsByType(): array
    {
        return WritingGoal::active()
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();
    }
}
