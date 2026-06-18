<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Followup extends Model
{
    protected $fillable = [
        'student_id',
        'tutor_id',
        'alert_id',
        'title',
        'description',
        'action_taken',
        'status',
        'followup_date',
    ];

    protected $casts = [
        'followup_date' => 'date',
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
}