<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Followup extends Model
{
    /*
     * Tabla donde se guardan los seguimientos realizados por el tutor.
     *
     * Un seguimiento representa una acción posterior a una alerta,
     * por ejemplo: contactar al estudiante, registrar observaciones
     * o dar continuidad a un caso.
     */
    protected $table = 'followups';

    /*
     * Campos que se pueden guardar desde el controlador.
     */
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

    /*
     * Convierte followup_date automáticamente a fecha.
     */
    protected $casts = [
        'followup_date' => 'date',
    ];

    /*
     * Estudiante al que pertenece el seguimiento.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /*
     * Tutor que registró el seguimiento.
     */
    public function tutor()
    {
        return $this->belongsTo(Tutor::class);
    }

    /*
     * Alerta relacionada con el seguimiento.
     */
    public function alert()
    {
        return $this->belongsTo(Alert::class);
    }
}