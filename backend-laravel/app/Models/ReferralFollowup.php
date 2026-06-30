<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/*
|--------------------------------------------------------------------------
| Modelo ReferralFollowup
|--------------------------------------------------------------------------
|
| Representa una atención registrada por el personal de apoyo sobre una
| canalización institucional.
|
| Importante:
| Este modelo no representa diagnósticos clínicos. Solo almacena registros
| de seguimiento institucional dentro de MindIA.
|
*/
class ReferralFollowup extends Model
{
    use HasFactory;

    /*
     * Campos que Laravel puede guardar mediante create() o update().
     */
    protected $fillable = [
        'referral_id',
        'support_staff_id',
        'attention_type',
        'notes',
        'result',
        'status',
        'attended_at',
    ];

    /*
     * Convierte attended_at automáticamente a fecha/hora.
     */
    protected $casts = [
        'attended_at' => 'datetime',
    ];

    /*
     * Canalización relacionada con este seguimiento.
     */
    public function referral()
    {
        return $this->belongsTo(Referral::class);
    }

    /*
     * Personal de apoyo que registró la atención.
     */
    public function supportStaff()
    {
        return $this->belongsTo(SupportStaff::class);
    }
}