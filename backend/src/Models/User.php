<?php
// ✅ CORRECT: Typed Eloquent models
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class User extends Model
{
    protected $table = 'users';

    protected $fillable = [
        'webhatch_,
        'username',
        'first_name',
        'last_name',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
}
