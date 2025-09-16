<?php

declare(strict_types=1);

namespace LitRPGStudio\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeriesAnalytics extends Model
{
    protected $table = 'series_analytics';

    protected $fillable = [
        'series_id',
        'total_word_count',
        'average_book_length',
        'completion_rate',
        'character_count',
        'location_count',
        'plot_thread_count',
        'consistency_score',
        'readability_score',
        'pacing_data',
        'character_development_data',
        'world_building_depth'
    ];

    protected $casts = [
        'total_word_count' => 'integer',
        'average_book_length' => 'float',
        'completion_rate' => 'float',
        'character_count' => 'integer',
        'location_count' => 'integer',
        'plot_thread_count' => 'integer',
        'consistency_score' => 'float',
        'readability_score' => 'float',
        'pacing_data' => 'array',
        'character_development_data' => 'array',
        'world_building_depth' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }

    public function getPacingDataAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setPacingDataAttribute($value): void
    {
        $this->attributes['pacing_data'] = json_encode($value);
    }

    public function getCharacterDevelopmentDataAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setCharacterDevelopmentDataAttribute($value): void
    {
        $this->attributes['character_development_data'] = json_encode($value);
    }

    public function getWorldBuildingDepthAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setWorldBuildingDepthAttribute($value): void
    {
        $this->attributes['world_building_depth'] = json_encode($value);
    }
}