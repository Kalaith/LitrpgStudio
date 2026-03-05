<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $table = 'items';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'description',
        'type',
        'sub_type',
        'rarity',
        'level',
        'value',
        'weight',
        'durability',
        'stats',
        'effects',
        'requirements',
        'set_bonus',
        'enchantments',
        'stackable',
        'max_stack',
        'sellable',
        'tradeable',
        'icon',
        'image',
        'lore',
    ];

    protected $casts = [
        'level' => 'integer',
        'value' => 'integer',
        'weight' => 'float',
        'durability' => 'array',
        'stats' => 'array',
        'effects' => 'array',
        'requirements' => 'array',
        'set_bonus' => 'array',
        'enchantments' => 'array',
        'stackable' => 'boolean',
        'max_stack' => 'integer',
        'sellable' => 'boolean',
        'tradeable' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
