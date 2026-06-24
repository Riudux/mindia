<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Emotion extends Model
{
    /*
     * Tabla asociada al catálogo de emociones.
     * Esta tabla guarda emociones como Happy, Sad, Angry, Calm, etc.
     */
    protected $table = 'emotions';

    /*
     * Campos que se pueden llenar de forma masiva.
     */
    protected $fillable = [
        'name',
        'color',
        'icon',
        'is_active',
    ];

    /*
     * Convierte is_active a booleano automáticamente.
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];
}