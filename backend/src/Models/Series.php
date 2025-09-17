<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Series extends Model
{
    protected $table = 'series';

    protected $fillable = [
        'title',
        'description',
        'genre',
        'tags',
        'status',
        'target_books',
        'author_notes',
        'shared_elements'
    ];

    protected $casts = [
        'tags' => 'array',
        'shared_elements' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function books(): HasMany
    {
        return $this->hasMany(Book::class)->orderBy('book_number');
    }

    public function characters(): HasMany
    {
        return $this->hasMany(Character::class);
    }

    public function stories(): HasMany
    {
        return $this->hasMany(Story::class);
    }

    public function analytics(): HasMany
    {
        return $this->hasMany(SeriesAnalytics::class);
    }

    public function getSharedElementsAttribute($value): array
    {
        $decoded = json_decode($value, true);
        return $decoded ?? [
            'characters' => [],
            'worldBuilding' => [
                'timeline' => [],
                'worldRules' => [],
                'cultures' => [],
                'languages' => [],
                'religions' => [],
                'economics' => []
            ],
            'magicSystems' => [],
            'locations' => [],
            'factions' => [],
            'terminology' => []
        ];
    }

    public function setSharedElementsAttribute($value): void
    {
        $this->attributes['shared_elements'] = json_encode($value);
    }
}