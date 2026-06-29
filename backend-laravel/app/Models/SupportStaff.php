<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class SupportStaff extends Model
{
    protected $table = 'support_staff';

    protected $fillable = [
        'user_id',
        'area',
        'employee_key',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function referrals()
    {
        return $this->hasMany(Referral::class, 'referred_to');
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