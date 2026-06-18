<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    protected $fillable = [
        'student_id',
        'emotional_record_id',
        'risk_level',
        'title',
        'general_reason',
        'status',
        'generated_by',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function emotionalRecord()
    {
        return $this->belongsTo(EmotionalRecord::class);
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function followups()
    {
        return $this->hasMany(Followup::class);
    }

    public function referrals()
    {
        return $this->hasMany(Referral::class);
    }
}