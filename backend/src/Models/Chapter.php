<?php

declare(strict_types=1);

namespace LitRPGStudio\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chapter extends Model
{
    protected $table = 'chapters';

    protected $fillable = [
        'story_id',
        'title',
        'chapter_number',
        'content',
        'word_count',
        'status',
        'summary',
        'notes',
        'character_progression',
        'story_events'
    ];

    protected $casts = [
        'chapter_number' => 'integer',
        'word_count' => 'integer',
        'character_progression' => 'array',
        'story_events' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function story(): BelongsTo
    {
        return $this->belongsTo(Story::class);
    }

    public function getCharacterProgressionAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setCharacterProgressionAttribute($value): void
    {
        $this->attributes['character_progression'] = json_encode($value);
    }

    public function getStoryEventsAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setStoryEventsAttribute($value): void
    {
        $this->attributes['story_events'] = json_encode($value);
    }
}