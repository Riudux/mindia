<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Emotion;
use App\Models\EmotionalRecord;
use App\Models\EventCategory;
use App\Models\PrivacyConsent;
use App\Models\Student;
use Illuminate\Http\Request;

class EmotionalRecordController extends Controller
{
    /*
     * Obtiene el perfil de estudiante del usuario autenticado.
     *
     * Este método valida que:
     * 1. El usuario tenga rol student.
     * 2. El usuario tenga un registro relacionado en la tabla students.
     */
    private function getAuthenticatedStudent(Request $request)
    {
        $user = $request->user()->load('role');

        if (!$user->role || $user->role->name !== 'student') {
            return response()->json([
                'message' => 'Access denied. Only students can perform this action.',
            ], 403);
        }

        $student = Student::where('user_id', $user->id)->first();

        if (!$student) {
            return response()->json([
                'message' => 'Student profile not found for authenticated user.',
            ], 404);
        }

        return $student;
    }

    /*
     * Valida si el estudiante ya aceptó el consentimiento de privacidad.
     *
     * Sin consentimiento aceptado, el sistema no debe permitir guardar
     * registros emocionales.
     */
    private function studentHasConsent(Student $student)
    {
        return PrivacyConsent::where('student_id', $student->id)
            ->where('accepted', true)
            ->exists();
    }

    /*
     * Lista el historial emocional del estudiante autenticado.
     *
     * Endpoint:
     * GET /api/emotional-records/me
     */
    public function myRecords(Request $request)
    {
        $student = $this->getAuthenticatedStudent($request);

        if ($student instanceof \Illuminate\Http\JsonResponse) {
            return $student;
        }

        $records = EmotionalRecord::with(['emotion', 'eventCategory'])
            ->where('student_id', $student->id)
            ->orderBy('record_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'records' => $records,
        ]);
    }

    /*
     * Guarda un registro emocional diario.
     *
     * Endpoint:
     * POST /api/emotional-records
     *
     * Este endpoint recibe:
     * - emotion_id: emoción seleccionada.
     * - intensity_level: intensidad emocional.
     * - event_category_id: categoría opcional del evento.
     * - event_description: descripción opcional del evento.
     * - personal_note: nota personal opcional.
     * - record_date: fecha del registro.
     */
    public function store(Request $request)
    {
        $student = $this->getAuthenticatedStudent($request);

        if ($student instanceof \Illuminate\Http\JsonResponse) {
            return $student;
        }

        /*
         * Antes de guardar emociones, se valida consentimiento.
         * Esto cumple la lógica de privacidad del MVP.
         */
        if (!$this->studentHasConsent($student)) {
            return response()->json([
                'message' => 'Privacy consent is required before creating emotional records.',
            ], 403);
        }

        /*
         * Validación de datos de entrada.
         *
         * intensity_level se limita de 1 a 5 para manejar una escala sencilla:
         * 1 = muy baja
         * 5 = muy alta
         */
        $request->validate([
            'emotion_id' => ['required', 'exists:emotions,id'],
            'event_category_id' => ['nullable', 'exists:event_categories,id'],
            'intensity_level' => ['required', 'integer', 'min:1', 'max:5'],
            'event_description' => ['nullable', 'string', 'max:1000'],
            'personal_note' => ['nullable', 'string', 'max:1000'],
            'record_date' => ['nullable', 'date'],
        ]);

        /*
         * Verifica que la emoción esté activa.
         * Así se evita registrar emociones deshabilitadas del catálogo.
         */
        $emotion = Emotion::findOrFail($request->emotion_id);

        if (!$emotion->is_active) {
            return response()->json([
                'message' => 'The selected emotion is not active.',
            ], 422);
        }

        /*
         * Si se envió categoría de evento, se valida que esté activa.
         */
        if ($request->event_category_id) {
            $category = EventCategory::findOrFail($request->event_category_id);

            if (!$category->is_active) {
                return response()->json([
                    'message' => 'The selected event category is not active.',
                ], 422);
            }
        }

        /*
         * Crea el registro emocional relacionado al estudiante autenticado.
         * El student_id no viene del body para evitar que un estudiante registre
         * datos a nombre de otro estudiante.
         */
        $record = EmotionalRecord::create([
            'student_id' => $student->id,
            'emotion_id' => $request->emotion_id,
            'event_category_id' => $request->event_category_id,
            'intensity_level' => $request->intensity_level,
            'event_description' => $request->event_description,
            'personal_note' => $request->personal_note,
            'record_date' => $request->record_date ?? now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Emotional record created successfully.',
            'record' => $record->load(['emotion', 'eventCategory']),
        ], 201);
    }
}