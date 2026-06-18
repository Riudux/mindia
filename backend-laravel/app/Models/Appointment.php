<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'student_id',
        'tutor_id',
        'support_staff_id',
        'referral_id',
        'requested_by',
        'appointment_date',
        'start_time',
        'end_time',
        'modality',
        'reason',
        'status',
    ];

    protected $casts = [
        'appointment_date' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function tutor()
    {
        return $this->belongsTo(Tutor::class);
    }

    public function supportStaff()
    {
        return $this->belongsTo(SupportStaff::class);
    }

    public function referral()
    {
        return $this->belongsTo(Referral::class);
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}