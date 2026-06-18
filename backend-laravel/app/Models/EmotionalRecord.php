<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmotionalRecord extends Model
{
    protected $fillable = [
        'student_id',
        'emotion_id',
        'event_category_id',
        'intensity_level',
        'event_description',
        'personal_note',
        'record_date',
    ];

    protected $casts = [
        'record_date' => 'date',
        'intensity_level' => 'integer',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function emotion()
    {
        return $this->belongsTo(Emotion::class);
    }

    public function eventCategory()
    {
        return $this->belongsTo(EventCategory::class);
    }

    public function alerts()
    {
        return $this->hasMany(Alert::class);
    }
}