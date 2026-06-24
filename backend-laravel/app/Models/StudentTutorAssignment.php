<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentTutorAssignment extends Model
{
    /*
     * Nombre de la tabla asociada al modelo.
     * Laravel normalmente puede inferirlo, pero aquí lo dejamos explícito
     * para que cualquier integrante entienda qué tabla usa este modelo.
     */
    protected $table = 'student_tutor_assignments';

    /*
     * Campos que se pueden llenar mediante create() o update().
     * Esto protege el modelo contra asignación masiva de campos no permitidos.
     */
    protected $fillable = [
        'student_id',
        'tutor_id',
        'assigned_by',
        'status',
        'assigned_at',
    ];

    /*
     * Conversión automática de datos.
     * assigned_at se manejará como fecha/hora desde Laravel.
     */
    protected $casts = [
        'assigned_at' => 'datetime',
    ];

    /*
     * Relación con el estudiante asignado.
     * Cada asignación pertenece a un estudiante.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /*
     * Relación con el tutor asignado.
     * Cada asignación pertenece a un tutor.
     */
    public function tutor()
    {
        return $this->belongsTo(Tutor::class);
    }

    /*
     * Relación con el usuario administrador que hizo la asignación.
     * El campo assigned_by guarda el ID del usuario admin.
     */
    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}