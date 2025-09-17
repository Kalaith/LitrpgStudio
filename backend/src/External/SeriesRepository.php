<?php

declare(strict_types=1);

namespace App\External;

use App\Models\Series;
use App\Models\SeriesAnalytics;

final class SeriesRepository
{
    public function findById(string $id): ?Series
    {
        return Series::find($id);
    }

    public function findAll(): array
    {
        return Series::all()->toArray();
    }

    public function create(Series $series): Series
    {
        $series->save();
        return $series;
    }

    public function update(Series $series): Series
    {
        $series->save();
        return $series;
    }

    public function delete(string $id): bool
    {
        $series = $this->findById($id);
        if (!$series) {
            return false;
        }

        return $series->delete();
    }

    public function findWithRelations(string $id): ?Series
    {
        return Series::with(['books', 'characters'])->find($id);
    }

    public function createFromArray(array $data): Series
    {
        return Series::create($data);
    }

    public function updateFromArray(string $id, array $data): ?Series
    {
        $series = $this->findById($id);
        if (!$series) {
            return null;
        }

        $series->update($data);
        return $series;
    }

    public function addCharacterToSeries(string $seriesId, string $characterId): bool
    {
        $series = $this->findById($seriesId);
        if (!$series) {
            return false;
        }

        $sharedElements = $series->shared_elements ?? [];
        $characters = $sharedElements['characters'] ?? [];

        if (!in_array($characterId, $characters)) {
            $characters[] = $characterId;
            $sharedElements['characters'] = $characters;
            $series->update(['shared_elements' => $sharedElements]);
        }

        return true;
    }

    public function removeCharacterFromSeries(string $seriesId, string $characterId): bool
    {
        $series = $this->findById($seriesId);
        if (!$series) {
            return false;
        }

        $sharedElements = $series->shared_elements ?? [];
        $characters = $sharedElements['characters'] ?? [];

        $characters = array_filter($characters, fn($id) => $id !== $characterId);
        $sharedElements['characters'] = array_values($characters);
        $series->update(['shared_elements' => $sharedElements]);

        return true;
    }

    public function addCharacterAppearance(string $seriesId, string $characterId, array $appearanceData): bool
    {
        // This could be implemented to track character appearances across books
        // For now, returning true as placeholder
        return true;
    }

    public function updateCharacterDevelopment(string $seriesId, string $characterId, array $developmentData): bool
    {
        // This could be implemented to track character development across the series
        // For now, returning true as placeholder
        return true;
    }

    public function getAnalytics(string $seriesId): ?SeriesAnalytics
    {
        return SeriesAnalytics::where('series_id', $seriesId)->first();
    }

    public function createOrUpdateAnalytics(string $seriesId, array $analyticsData): SeriesAnalytics
    {
        return SeriesAnalytics::updateOrCreate(
            ['series_id' => $seriesId],
            $analyticsData
        );
    }
}