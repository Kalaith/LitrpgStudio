<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Character extends Model
{
    protected $table = 'characters';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'series_id',
        'name',
        'race',
        'class',
        'background',
        'personality',
        'appearance',
        'stats',
        'skills',
        'inventory',
        'equipment',
        'status_effects',
        'level_progression',
        'relationships',
        'backstory',
        'motivations',
        'flaws',
        'story_references',
        'cross_references'
    ];

    protected $casts = [
        'stats' => 'array',
        'skills' => 'array',
        'inventory' => 'array',
        'equipment' => 'array',
        'status_effects' => 'array',
        'level_progression' => 'array',
        'relationships' => 'array',
        'story_references' => 'array',
        'cross_references' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }

    public function templates(): HasMany
    {
        return $this->hasMany(CharacterTemplate::class);
    }

    public function getStatsAttribute($value): array
    {
        $decoded = json_decode($value, true);
        return $decoded ?? [
            'level' => 1,
            'experience' => 0,
            'strength' => 10,
            'dexterity' => 10,
            'constitution' => 10,
            'intelligence' => 10,
            'wisdom' => 10,
            'charisma' => 10,
            'hitPoints' => 0,
            'manaPoints' => 0
        ];
    }

    public function setStatsAttribute($value): void
    {
        $this->attributes['stats'] = json_encode($value);
    }

    public function getSkillsAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setSkillsAttribute($value): void
    {
        $this->attributes['skills'] = json_encode($value);
    }

    public function getInventoryAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setInventoryAttribute($value): void
    {
        $this->attributes['inventory'] = json_encode($value);
    }

    public function getEquipmentAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setEquipmentAttribute($value): void
    {
        $this->attributes['equipment'] = json_encode($value);
    }

    public function getLevelProgressionAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setLevelProgressionAttribute($value): void
    {
        $this->attributes['level_progression'] = json_encode($value);
    }

    public function getRelationshipsAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setRelationshipsAttribute($value): void
    {
        $this->attributes['relationships'] = json_encode($value);
    }

    public function getStoryReferencesAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setStoryReferencesAttribute($value): void
    {
        $this->attributes['story_references'] = json_encode($value);
    }

    public function getCrossReferencesAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setCrossReferencesAttribute($value): void
    {
        $this->attributes['cross_references'] = json_encode($value);
    }
}