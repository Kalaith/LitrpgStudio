<?php

declare(strict_types=1);

namespace LitRPGStudio\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CharacterTemplate extends Model
{
    protected $table = 'character_templates';

    protected $fillable = [
        'character_id',
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

    public function character(): BelongsTo
    {
        return $this->belongsTo(Character::class);
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