<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoryTemplate extends Model
{
    protected $table = 'story_templates';

    protected $fillable = [
        'story_id',
        'name',
        'description',
        'template_data',
        'is_public',
        'usage_count'
    ];

    protected $casts = [
        'template_data' => 'array',
        'is_public' => 'boolean',
        'usage_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function story(): BelongsTo
    {
        return $this->belongsTo(Story::class);
    }

    public function getTemplateDataAttribute($value): array
    {
        return json_decode($value, true) ?? [];
    }

    public function setTemplateDataAttribute($value): void
    {
        $this->attributes['template_data'] = json_encode($value);
    }
}