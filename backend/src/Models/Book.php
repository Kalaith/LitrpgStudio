<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    protected $table = 'books';

    protected $fillable = [
        'series_id',
        'title',
        'description',
        'book_number',
        'status',
        'target_word_count',
        'current_word_count',
        'synopsis',
        'outline',
        'character_arcs',
        'plot_threads',
        'timeline_events'
    ];

    protected $casts = [
        'book_number' => 'integer',
        'target_word_count' => 'integer',
        'current_word_count' => 'integer',
        'character_arcs' => 'array',
        'plot_threads' => 'array',
        'timeline_events' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }

    public function stories(): HasMany
    {
        return $this->hasMany(Story::class);
    }

    public function getCharacterArcsAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setCharacterArcsAttribute($value): void
    {
        $this->attributes['character_arcs'] = json_encode($value);
    }

    public function getPlotThreadsAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setPlotThreadsAttribute($value): void
    {
        $this->attributes['plot_threads'] = json_encode($value);
    }

    public function getTimelineEventsAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setTimelineEventsAttribute($value): void
    {
        $this->attributes['timeline_events'] = json_encode($value);
    }
}