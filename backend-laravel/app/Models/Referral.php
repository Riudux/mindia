<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    protected $fillable = [
        'student_id',
        'tutor_id',
        'alert_id',
        'referred_to',
        'reason',
        'priority',
        'status',
        'referral_date',
    ];

    protected $casts = [
        'referral_date' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function tutor()
    {
        return $this->belongsTo(Tutor::class);
    }

    public function alert()
    {
        return $this->belongsTo(Alert::class);
    }

    public function supportStaff()
    {
        return $this->belongsTo(SupportStaff::class, 'referred_to');
    }

    public function supportAttentions()
    {
        return $this->hasMany(SupportAttention::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}