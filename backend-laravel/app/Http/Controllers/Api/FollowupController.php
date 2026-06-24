<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Followup;
use App\Models\Student;
use App\Models\StudentTutorAssignment;
use App\Models\Tutor;
use Illuminate\Http\Request;

class FollowupController extends Controller
{
    /*
     * Valida que el usuario autenticado tenga rol tutor.
     *
     * Este módulo está pensado para que el tutor registre acciones
     * de seguimiento sobre alertas generadas por el sistema.
     */
    private function ensureTutor(Request $request)
    {
        // Carga el rol del usuario autenticado.
        $user = $request->user()->load('role');

        // Si el usuario no tiene rol tutor, se bloquea el acceso.
        if (!$user->role || $user->role->name !== 'tutor') {
            return response()->json([
                'message' => 'Access denied. Only tutors can perform this action.',
            ], 403);
        }

        return null;
    }

    /*
     * Obtiene el perfil de tutor relacionado con el usuario autenticado.
     */
    private function getAuthenticatedTutor(Request $request)
    {
        $tutor = Tutor::where('user_id', $request->user()->id)->first();

        if (!$tutor) {
            return response()->json([
                'message' => 'Tutor profile not found for authenticated user.',
            ], 404);
        }

        return $tutor;
    }

    /*
     * Valida que la alerta pertenezca a un estudiante asignado al tutor.
     *
     * Esto evita que un tutor registre seguimientos sobre alertas
     * de estudiantes que no le corresponden.
     */
    private function ensureAlertBelongsToTutor(Alert $alert, Tutor $tutor)
    {
        // Busca el estudiante relacionado con la alerta.
        $student = Student::find($alert->student_id);

        if (!$student) {
            return response()->json([
                'message' => 'Student related to this alert was not found.',
            ], 404);
        }

        // Verifica que exista una asignación activa estudiante-tutor.
        $hasAssignment = StudentTutorAssignment::where('student_id', $student->id)
            ->where('tutor_id', $tutor->id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAssignment) {
            return response()->json([
                'message' => 'Access denied. This alert does not belong to an assigned student.',
            ], 403);
        }

        return null;
    }

    /*
     * Registra un seguimiento para una alerta.
     *
     * Endpoint:
     * POST /api/tutor/alerts/{alert}/followups
     *
     * Este endpoint permite que el tutor documente qué acción tomó
     * después de revisar una alerta.
     */
    public function store(Request $request, Alert $alert)
    {
        /*
         * Verifica que el usuario autenticado sea tutor.
         */
        if ($response = $this->ensureTutor($request)) {
            return $response;
        }

        /*
         * Obtiene el perfil del tutor autenticado.
         */
        $tutor = $this->getAuthenticatedTutor($request);

        if ($tutor instanceof \Illuminate\Http\JsonResponse) {
            return $tutor;
        }

        /*
         * Verifica que la alerta pertenezca a un estudiante asignado.
         */
        if ($response = $this->ensureAlertBelongsToTutor($alert, $tutor)) {
            return $response;
        }

        /*
         * Valida los datos enviados desde Postman, web o app móvil.
         */
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'action_taken' => ['required', 'string', 'max:1000'],
            'status' => ['nullable', 'string', 'in:pending,completed,cancelled'],
            'followup_date' => ['nullable', 'date'],
        ]);

        /*
         * Crea el seguimiento.
         *
         * student_id viene desde la alerta.
         * tutor_id viene desde el tutor autenticado.
         * alert_id viene desde la ruta.
         */
        $followup = Followup::create([
            'student_id' => $alert->student_id,
            'tutor_id' => $tutor->id,
            'alert_id' => $alert->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'action_taken' => $validated['action_taken'],
            'status' => $validated['status'] ?? 'pending',
            'followup_date' => $validated['followup_date'] ?? now()->toDateString(),
        ]);

        /*
         * Devuelve el seguimiento con sus relaciones principales.
         */
        return response()->json([
            'message' => 'Follow-up registered successfully.',
            'followup' => $followup->load([
                'student.user',
                'tutor.user',
                'alert',
            ]),
        ], 201);
    }

    /*
     * Lista los seguimientos de una alerta específica.
     *
     * Endpoint:
     * GET /api/tutor/alerts/{alert}/followups
     *
     * Sirve para que el tutor vea el historial de acciones registradas
     * sobre una alerta.
     */
    public function index(Request $request, Alert $alert)
    {
        /*
         * Verifica que el usuario autenticado sea tutor.
         */
        if ($response = $this->ensureTutor($request)) {
            return $response;
        }

        /*
         * Obtiene el perfil del tutor autenticado.
         */
        $tutor = $this->getAuthenticatedTutor($request);

        if ($tutor instanceof \Illuminate\Http\JsonResponse) {
            return $tutor;
        }

        /*
         * Verifica que la alerta pertenezca a un estudiante asignado.
         */
        if ($response = $this->ensureAlertBelongsToTutor($alert, $tutor)) {
            return $response;
        }

        /*
         * Consulta los seguimientos de la alerta.
         */
        $followups = Followup::with([
                'student.user',
                'tutor.user',
                'alert',
            ])
            ->where('alert_id', $alert->id)
            ->orderBy('followup_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'alert' => $alert->load(['student.user', 'emotionalRecord.emotion']),
            'followups' => $followups,
        ]);
    }
}