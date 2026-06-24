<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Emotion;
use App\Models\EventCategory;

class CatalogController extends Controller
{
    /*
     * Devuelve el catálogo de emociones activas.
     *
     * Endpoint:
     * GET /api/emotions
     *
     * Este endpoint será usado por Flutter para mostrar opciones como:
     * Happy, Calm, Sad, Angry, Anxious, Stressed, etc.
     */
    public function emotions()
    {
        $emotions = Emotion::where('is_active', true)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'emotions' => $emotions,
        ]);
    }

    /*
     * Devuelve el catálogo de categorías de eventos activas.
     *
     * Endpoint:
     * GET /api/event-categories
     *
     * Este catálogo sirve para clasificar situaciones diarias,
     * por ejemplo escuela, familia, salud, relaciones, trabajo, etc.
     */
    public function eventCategories()
    {
        $categories = EventCategory::where('is_active', true)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'event_categories' => $categories,
        ]);
    }
}