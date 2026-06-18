<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentTutorAssignment extends Model
{
    protected $fillable = [
        'student_id',
        'tutor_id',
        'assigned_by',
        'status',
        'assigned_at',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function tutor()
    {
        return $this->belongsTo(Tutor::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}