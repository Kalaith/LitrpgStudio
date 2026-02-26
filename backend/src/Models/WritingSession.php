<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WritingSession extends Model
{
    protected $table = 'writing_sessions';

    protected $fillable = [
        'id',
        'story_id',
        'chapter_id',
        'start_time',
        'end_time',
        'word_target',
        'initial_word_count',
        'final_word_count',
        'words_written',
        'duration',
        'date',
        'is_active',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'date' => 'date',
        'is_active' => 'boolean',
        'word_target' => 'integer',
        'initial_word_count' => 'integer',
        'final_word_count' => 'integer',
        'words_written' => 'integer',
        'duration' => 'integer',
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

    public function chapter()
    {
        return $this->belongsTo(Chapter::class, 'chapter_id');
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
        return $query->where('is_active', false);
    }

    public function scopeForDate($query, $date)
    {
        return $query->whereDate('date', $date);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeForStory($query, $storyId)
    {
        return $query->where('story_id', $storyId);
    }

    /**
     * Helpers
     */
    public function calculateDuration(): int
    {
        if ($this->end_time && $this->start_time) {
            return $this->end_time->diffInMinutes($this->start_time);
        }
        return 0;
    }

    public function calculateWordsWritten(): int
    {
        return max(0, $this->final_word_count - $this->initial_word_count);
    }

    public function calculateWPM(): float
    {
        if ($this->duration > 0) {
            return round($this->words_written / ($this->duration / 60), 2);
        }
        return 0;
    }
}
