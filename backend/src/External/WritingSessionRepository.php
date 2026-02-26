<?php

declare(strict_types=1);

namespace App\External;

use App\Models\WritingSession;
use Illuminate\Support\Facades\DB;

class WritingSessionRepository
{
    public function findAll(): array
    {
        return WritingSession::orderBy('start_time', 'desc')->get()->toArray();
    }

    public function findById(string $id): ?array
    {
        $session = WritingSession::find($id);
        return $session ? $session->toArray() : null;
    }

    public function findActive(): ?array
    {
        $session = WritingSession::active()->first();
        return $session ? $session->toArray() : null;
    }

    public function findByStoryId(string $storyId): array
    {
        return WritingSession::forStory($storyId)
            ->orderBy('start_time', 'desc')
            ->get()
            ->toArray();
    }

    public function findByDateRange(string $startDate, string $endDate): array
    {
        return WritingSession::forDateRange($startDate, $endDate)
            ->orderBy('date', 'desc')
            ->get()
            ->toArray();
    }

    public function findByDate(string $date): array
    {
        return WritingSession::forDate($date)
            ->orderBy('start_time', 'desc')
            ->get()
            ->toArray();
    }

    public function findCompleted(int $limit = 100): array
    {
        return WritingSession::completed()
            ->orderBy('start_time', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function create(array $data): array
    {
        $session = WritingSession::create($data);
        return $session->toArray();
    }

    public function update(string $id, array $data): array
    {
        $session = WritingSession::findOrFail($id);
        $session->update($data);
        return $session->fresh()->toArray();
    }

    public function delete(string $id): bool
    {
        $session = WritingSession::findOrFail($id);
        return $session->delete();
    }

    /**
     * Analytics queries
     */
    public function getTotalWordsWritten(?string $startDate = null, ?string $endDate = null): int
    {
        $query = WritingSession::completed();

        if ($startDate && $endDate) {
            $query->forDateRange($startDate, $endDate);
        }

        return $query->sum('words_written') ?? 0;
    }

    public function getAverageSessionDuration(?string $startDate = null, ?string $endDate = null): float
    {
        $query = WritingSession::completed();

        if ($startDate && $endDate) {
            $query->forDateRange($startDate, $endDate);
        }

        return round($query->avg('duration') ?? 0, 2);
    }

    public function getAverageWPM(?string $startDate = null, ?string $endDate = null): float
    {
        $query = WritingSession::completed()->where('duration', '>', 0);

        if ($startDate && $endDate) {
            $query->forDateRange($startDate, $endDate);
        }

        $sessions = $query->get();

        if ($sessions->isEmpty()) {
            return 0;
        }

        $totalWords = $sessions->sum('words_written');
        $totalMinutes = $sessions->sum('duration');

        if ($totalMinutes > 0) {
            return round($totalWords / ($totalMinutes / 60), 2);
        }

        return 0;
    }

    public function getDailyStats(string $date): array
    {
        $sessions = WritingSession::forDate($date)->completed()->get();

        $totalWords = $sessions->sum('words_written');
        $totalMinutes = $sessions->sum('duration');
        $sessionCount = $sessions->count();

        $averageWPM = 0;
        if ($totalMinutes > 0) {
            $averageWPM = round($totalWords / ($totalMinutes / 60), 2);
        }

        return [
            'date' => $date,
            'words_written' => $totalWords,
            'sessions_count' => $sessionCount,
            'total_minutes' => $totalMinutes,
            'average_wpm' => $averageWPM,
        ];
    }

    public function getSessionsByHour(): array
    {
        return DB::table('writing_sessions')
            ->select(DB::raw('HOUR(start_time) as hour, COUNT(*) as count, SUM(words_written) as total_words'))
            ->where('is_active', false)
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->toArray();
    }
}
