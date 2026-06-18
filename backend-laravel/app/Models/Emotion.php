<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Emotion extends Model
{
    protected $fillable = [
        'name',
        'color',
        'icon',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function emotionalRecords()
    {
        return $this->hasMany(EmotionalRecord::class);
    }
}