<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrivacyConsent;
use App\Models\Student;
use Illuminate\Http\Request;

class PrivacyConsentController extends Controller
{
    /*
     * Obtiene el perfil de estudiante del usuario autenticado.
     *
     * Este método valida dos cosas:
     * 1. Que el usuario autenticado tenga rol "student".
     * 2. Que exista un registro relacionado en la tabla "students".
     *
     * Si algo falla, devuelve una respuesta de error.
     * Si todo está bien, devuelve el modelo Student.
     */
    private function getAuthenticatedStudent(Request $request)
    {
        // Carga el rol del usuario autenticado.
        $user = $request->user()->load('role');

        // Verifica que el usuario tenga rol student.
        if (!$user->role || $user->role->name !== 'student') {
            return response()->json([
                'message' => 'Access denied. Only students can perform this action.',
            ], 403);
        }

        // Busca el perfil de estudiante relacionado con el usuario autenticado.
        $student = Student::where('user_id', $user->id)->first();

        // Si no existe perfil de estudiante, se devuelve error.
        if (!$student) {
            return response()->json([
                'message' => 'Student profile not found for authenticated user.',
            ], 404);
        }

        // Si todo está correcto, se devuelve el estudiante.
        return $student;
    }

    /*
     * Consulta el consentimiento de privacidad del estudiante autenticado.
     *
     * Endpoint:
     * GET /api/privacy-consents/me
     *
     * Sirve para que Flutter o React sepan si el estudiante ya aceptó
     * el consentimiento antes de permitirle registrar información emocional.
     */
    public function me(Request $request)
    {
        // Obtiene el estudiante autenticado o una respuesta de error.
        $student = $this->getAuthenticatedStudent($request);

        // Si se recibió una respuesta JSON, significa que hubo error.
        if ($student instanceof \Illuminate\Http\JsonResponse) {
            return $student;
        }

        /*
         * Busca el consentimiento más reciente del estudiante.
         * Si no existe, significa que todavía no ha aceptado.
         */
        $consent = PrivacyConsent::where('student_id', $student->id)
            ->latest()
            ->first();

        return response()->json([
            'has_consent' => $consent && $consent->accepted,
            'consent' => $consent,
        ]);
    }

    /*
     * Registra o actualiza el consentimiento de privacidad del estudiante.
     *
     * Endpoint:
     * POST /api/privacy-consents
     *
     * Este endpoint debe ser usado por el estudiante autenticado.
     * Guarda que el estudiante aceptó el uso de sus datos emocionales
     * únicamente con fines de apoyo e indicadores de riesgo, nunca diagnóstico.
     */
    public function store(Request $request)
    {
        // Obtiene el estudiante autenticado o una respuesta de error.
        $student = $this->getAuthenticatedStudent($request);

        // Si se recibió una respuesta JSON, significa que hubo error.
        if ($student instanceof \Illuminate\Http\JsonResponse) {
            return $student;
        }

        /*
         * Validación del consentimiento.
         *
         * accepted debe venir como true.
         * Esto evita guardar consentimientos rechazados como si fueran válidos.
         */
        $request->validate([
            'accepted' => ['required', 'accepted'],
            'consent_text' => ['nullable', 'string', 'max:5000'],
        ]);

        /*
         * Texto por defecto del consentimiento.
         * Se guarda para dejar evidencia de qué aceptó el estudiante.
         */
        $defaultConsentText = 'El estudiante acepta que MindIA procese sus registros emocionales únicamente con fines de acompañamiento e indicadores de riesgo, no como diagnóstico clínico.';

        /*
         * updateOrCreate evita duplicar consentimientos para el mismo estudiante.
         * Si ya existe un consentimiento para student_id, se actualiza.
         * Si no existe, se crea uno nuevo.
         */
        $consent = PrivacyConsent::updateOrCreate(
            [
                'student_id' => $student->id,
            ],
            [
                'accepted' => true,
                'consent_text' => $request->consent_text ?? $defaultConsentText,
                'accepted_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Privacy consent registered successfully.',
            'has_consent' => true,
            'consent' => $consent,
        ], $consent->wasRecentlyCreated ? 201 : 200);
    }
}