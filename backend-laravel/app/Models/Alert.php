<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    /*
     * Tabla donde se guardan las alertas generadas por el sistema.
     *
     * Estas alertas NO representan diagnósticos clínicos.
     * Solo son señales de apoyo para priorizar seguimiento institucional.
     */
    protected $table = 'alerts';

    /*
     * Campos que se pueden guardar desde el controlador.
     */
    protected $fillable = [
        'student_id',
        'emotional_record_id',
        'risk_level',
        'title',
        'general_reason',
        'status',
        'generated_by',
        'reviewed_by',
        'reviewed_at',
    ];

    /*
     * Conversión automática de fechas.
     */
    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    /*
     * Relación con el estudiante dueño de la alerta.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /*
     * Relación con el registro emocional que originó la alerta.
     */
    public function emotionalRecord()
    {
        return $this->belongsTo(EmotionalRecord::class);
    }

    /*
     * Usuario que generó la alerta.
     * En este MVP normalmente será el tutor autenticado.
     */
    public function generatedBy()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /*
     * Usuario que revisó la alerta.
     */
    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}