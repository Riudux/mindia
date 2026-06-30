<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    /*
     * Tabla donde se guardan las canalizaciones a soporte institucional.
     *
     * Una canalización representa que un tutor decidió enviar un caso
     * al área de soporte para revisión o acompañamiento institucional.
     */
    protected $table = 'referrals';

    /*
     * Campos que se pueden guardar desde el controlador.
     */
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

    /*
     * Convierte referral_date automáticamente a fecha.
     */
    protected $casts = [
        'referral_date' => 'date',
    ];

    /*
     * Estudiante canalizado.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /*
     * Tutor que realizó la canalización.
     */
    public function tutor()
    {
        return $this->belongsTo(Tutor::class);
    }

    /*
     * Alerta que motivó la canalización.
     */
    public function alert()
    {
        return $this->belongsTo(Alert::class);
    }

    /*
     * Personal de soporte institucional al que se canalizó el caso.
     *
     * La columna se llama referred_to, por eso se indica manualmente
     * el nombre de la llave foránea.
     */
    public function referredTo()
    {
        return $this->belongsTo(SupportStaff::class, 'referred_to');
    }

    /*
    * Atenciones registradas sobre esta canalización.
    */
    public function followups()
    {
        return $this->hasMany(ReferralFollowup::class);
    }
}