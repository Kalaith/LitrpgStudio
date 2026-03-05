<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResearchSource extends Model
{
    protected $table = 'research_sources';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'title',
        'type',
        'content',
        'metadata',
        'annotations',
        'links',
        'citations',
        'attachments',
        'tags',
        'collections',
        'favorited',
        'archived',
        'last_accessed',
    ];

    protected $casts = [
        'content' => 'array',
        'metadata' => 'array',
        'annotations' => 'array',
        'links' => 'array',
        'citations' => 'array',
        'attachments' => 'array',
        'tags' => 'array',
        'collections' => 'array',
        'favorited' => 'boolean',
        'archived' => 'boolean',
        'last_accessed' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
