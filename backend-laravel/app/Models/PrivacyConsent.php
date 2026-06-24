<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrivacyConsent extends Model
{
    /*
     * Nombre explícito de la tabla asociada al modelo.
     * Esto ayuda a que cualquier integrante identifique qué tabla usa este modelo.
     */
    protected $table = 'privacy_consents';

    /*
     * Campos que se pueden llenar de forma masiva con create() o update().
     * Solo estos campos podrán guardarse desde el controlador.
     */
    protected $fillable = [
        'student_id',
        'accepted',
        'consent_text',
        'accepted_at',
    ];

    /*
     * Conversión automática de tipos.
     * accepted se maneja como booleano.
     * accepted_at se maneja como fecha/hora.
     */
    protected $casts = [
        'accepted' => 'boolean',
        'accepted_at' => 'datetime',
    ];

    /*
     * Relación con el estudiante.
     * Cada consentimiento pertenece a un estudiante.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}