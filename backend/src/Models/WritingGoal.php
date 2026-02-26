<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WritingGoal extends Model
{
    protected $table = 'writing_goals';

    protected $fillable = [
        'id',
        'title',
        'description',
        'type',
        'target',
        'current',
        'start_date',
        'deadline',
        'is_active',
        'completed_at',
        'story_id',
        'book_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'deadline' => 'date',
        'completed_at' => 'datetime',
        'is_active' => 'boolean',
        'target' => 'integer',
        'current' => 'integer',
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * Relationships
     */
    public function story()
    {
        return $this->belongsTo(Story::class, 'story_id');
    }

    public function book()
    {
        return $this->belongsTo(Book::class, 'book_id');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCompleted($query)
    {
        return $query->whereNotNull('completed_at');
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeDueBy($query, $date)
    {
        return $query->where('deadline', '<=', $date);
    }

    public function scopeOverdue($query)
    {
        return $query->where('is_active', true)
                     ->where('deadline', '<', now())
                     ->whereNull('completed_at');
    }

    /**
     * Helpers
     */
    public function getProgressPercentage(): float
    {
        if ($this->target > 0) {
            return round(($this->current / $this->target) * 100, 2);
        }
        return 0;
    }

    public function getRemainingTarget(): int
    {
        return max(0, $this->target - $this->current);
    }

    public function isOverdue(): bool
    {
        return $this->is_active
            && $this->deadline
            && $this->deadline < now()
            && !$this->completed_at;
    }

    public function markComplete(): void
    {
        $this->completed_at = now();
        $this->is_active = false;
        $this->save();
    }

    public function updateProgress(int $amount): void
    {
        $this->current = min($this->target, $this->current + $amount);

        // Auto-complete if target reached
        if ($this->current >= $this->target && !$this->completed_at) {
            $this->markComplete();
        } else {
            $this->save();
        }
    }
}
