<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResearchCollection extends Model
{
    protected $table = 'research_collections';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'description',
        'category',
        'sources',
        'tags',
        'color',
        'icon',
        'visibility',
        'collaborators',
    ];

    protected $casts = [
        'sources' => 'array',
        'tags' => 'array',
        'collaborators' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
