<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Story extends Model
{
    protected $table = 'stories';

    protected $fillable = [
        'series_id',
        'book_id',
        'title',
        'description',
        'genre',
        'tags',
        'status',
        'word_count',
        'target_word_count',
        'summary',
        'outline',
        'setting',
        'themes',
        'plot_points',
        'character_roles',
        'story_events'
    ];

    protected $casts = [
        'tags' => 'array',
        'word_count' => 'integer',
        'target_word_count' => 'integer',
        'plot_points' => 'array',
        'character_roles' => 'array',
        'story_events' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class)->orderBy('chapter_number');
    }

    public function templates(): HasMany
    {
        return $this->hasMany(StoryTemplate::class);
    }

    public function getPlotPointsAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setPlotPointsAttribute($value): void
    {
        $this->attributes['plot_points'] = json_encode($value);
    }

    public function getCharacterRolesAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setCharacterRolesAttribute($value): void
    {
        $this->attributes['character_roles'] = json_encode($value);
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