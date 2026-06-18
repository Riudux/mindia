<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tutor extends Model
{
    protected $fillable = [
        'user_id',
        'department',
        'employee_key',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function studentAssignments()
    {
        return $this->hasMany(StudentTutorAssignment::class);
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
}