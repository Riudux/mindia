<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'user_id',
        'enrollment_key',
        'career',
        'group_name',
        'semester',
        'academic_status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tutorAssignments()
    {
        return $this->hasMany(StudentTutorAssignment::class);
    }

    public function emotionalRecords()
    {
        return $this->hasMany(EmotionalRecord::class);
    }

    public function privacyConsents()
    {
        return $this->hasMany(PrivacyConsent::class);
    }

    public function alerts()
    {
        return $this->hasMany(Alert::class);
    }

    public function followups()
    {
        return $this->hasMany(Followup::class);
    }

    public function referrals()
    {
        return $this->hasMany(Referral::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function supportAttentions()
    {
        return $this->hasMany(SupportAttention::class);
    }
}