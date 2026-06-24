<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmotionalRecord extends Model
{
    /*
     * Tabla donde se guardan los registros emocionales diarios.
     */
    protected $table = 'emotional_records';

    /*
     * Campos que se pueden guardar desde el controlador.
     *
     * IMPORTANTE:
     * La columna real en la base de datos se llama record_date,
     * no recorded_date.
     */
    protected $fillable = [
        'student_id',
        'emotion_id',
        'event_category_id',
        'intensity_level',
        'event_description',
        'personal_note',
        'record_date',
    ];

    /*
     * record_date se manejará como fecha.
     */
    protected $casts = [
        'record_date' => 'date',
    ];

    /*
     * Cada registro emocional pertenece a un estudiante.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /*
     * Cada registro emocional tiene una emoción seleccionada.
     */
    public function emotion()
    {
        return $this->belongsTo(Emotion::class);
    }

    /*
     * Cada registro emocional puede tener una categoría de evento.
     */
    public function eventCategory()
    {
        return $this->belongsTo(EventCategory::class);
    }
}