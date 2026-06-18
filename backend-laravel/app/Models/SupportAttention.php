<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportAttention extends Model
{
    protected $fillable = [
        'referral_id',
        'student_id',
        'support_staff_id',
        'attention_type',
        'modality',
        'description',
        'agreement',
        'case_status',
        'attention_date',
    ];

    protected $casts = [
        'attention_date' => 'date',
    ];

    public function referral()
    {
        return $this->belongsTo(Referral::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function supportStaff()
    {
        return $this->belongsTo(SupportStaff::class);
    }
}