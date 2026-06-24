<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventCategory extends Model
{
    /*
     * Tabla asociada al catálogo de categorías de eventos.
     * Estas categorías sirven para clasificar situaciones del día del estudiante.
     */
    protected $table = 'event_categories';

    /*
     * Campos permitidos para asignación masiva.
     */
    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    /*
     * Convierte is_active a booleano automáticamente.
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];
}