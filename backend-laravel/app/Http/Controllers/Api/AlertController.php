<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\EmotionalRecord;
use App\Models\Student;
use App\Models\StudentTutorAssignment;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AlertController extends Controller
{
    /*
     * Valida que el usuario autenticado tenga rol tutor.
     *
     * Las alertas de este módulo están pensadas para el dashboard del tutor,
     * por eso estudiantes, support y admin no deben usar directamente
     * estos endpoints.
     */
    private function ensureTutor(Request $request)
    {
        $user = $request->user()->load('role');

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
     * Valida que el estudiante solicitado esté asignado al tutor autenticado.
     *
     * Esto protege los datos emocionales sensibles, ya que un tutor
     * no debe ver ni generar alertas de estudiantes que no tiene asignados.
     */
    private function ensureAssignedStudent(Student $student, Tutor $tutor)
    {
        $hasAssignment = StudentTutorAssignment::where('student_id', $student->id)
            ->where('tutor_id', $tutor->id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAssignment) {
            return response()->json([
                'message' => 'Access denied. This student is not assigned to the authenticated tutor.',
            ], 403);
        }

        return null;
    }

    /*
     * Calcula un indicador básico de riesgo a partir de registros emocionales.
     *
     * IMPORTANTE:
     * Este cálculo NO es diagnóstico clínico.
     * Solo genera señales de apoyo para priorizar seguimiento.
     */
    private function calculateRiskFromRecords($records)
    {
        /*
         * Si no hay registros recientes, no hay datos suficientes
         * para generar una alerta.
         */
        if ($records->isEmpty()) {
            return [
                'level' => 'low',
                'score' => 0,
                'should_create_alert' => false,
                'title' => 'Low risk indicator',
                'reason' => 'There are no recent emotional records indicating immediate follow-up priority.',
            ];
        }

        /*
         * Emociones que en el MVP se consideran señales de atención.
         * No significan diagnóstico; solo ayudan a priorizar revisión.
         */
        $attentionEmotions = [
            'Sad',
            'Angry',
            'Anxious',
            'Stressed',
            'Tired',
        ];

        $averageIntensity = round($records->avg('intensity_level'), 2);

        $attentionCount = $records->filter(function ($record) use ($attentionEmotions) {
            return $record->emotion && in_array($record->emotion->name, $attentionEmotions);
        })->count();

        $highIntensityCount = $records->filter(function ($record) {
            return $record->intensity_level >= 4;
        })->count();

        /*
         * Score simple para MVP:
         * - Hasta 40 puntos por intensidad promedio.
         * - Hasta 30 puntos por emociones de atención.
         * - Hasta 30 puntos por intensidad alta.
         */
        $score = 0;
        $score += min(40, $averageIntensity * 8);
        $score += min(30, $attentionCount * 10);
        $score += min(30, $highIntensityCount * 10);
        $score = round($score);

        /*
         * Define nivel y si debe crear alerta.
         * Para el MVP:
         * - medium y high sí generan alerta.
         * - low no genera alerta.
         */
        if ($score >= 70) {
            return [
                'level' => 'high',
                'score' => $score,
                'should_create_alert' => true,
                'title' => 'High risk indicator',
                'reason' => 'The student shows repeated or intense emotional signals that may require prompt tutor follow-up.',
            ];
        }

        if ($score >= 40) {
            return [
                'level' => 'medium',
                'score' => $score,
                'should_create_alert' => true,
                'title' => 'Medium risk indicator',
                'reason' => 'The student shows some emotional records that may require tutor follow-up.',
            ];
        }

        return [
            'level' => 'low',
            'score' => $score,
            'should_create_alert' => false,
            'title' => 'Low risk indicator',
            'reason' => 'The student does not currently show enough recent signals to prioritize immediate follow-up.',
        ];
    }

    /*
     * Genera una alerta de riesgo para un estudiante asignado.
     *
     * Endpoint:
     * POST /api/tutor/students/{student}/alerts/generate
     *
     * Este endpoint analiza los registros emocionales recientes del estudiante.
     * Si el indicador es medium o high, crea una alerta.
     */
    public function generate(Request $request, Student $student)
    {
        /*
         * Verifica que el usuario sea tutor.
         */
        if ($response = $this->ensureTutor($request)) {
            return $response;
        }

        /*
         * Obtiene el perfil de tutor autenticado.
         */
        $tutor = $this->getAuthenticatedTutor($request);

        if ($tutor instanceof \Illuminate\Http\JsonResponse) {
            return $tutor;
        }

        /*
         * Verifica que el estudiante pertenezca al tutor.
         */
        if ($response = $this->ensureAssignedStudent($student, $tutor)) {
            return $response;
        }

        /*
         * Carga datos generales del estudiante.
         */
        $student->load('user');

        if (!$student->user || $student->user->status !== 'active') {
            return response()->json([
                'message' => 'The selected student user account is not active.',
            ], 422);
        }

        /*
         * Obtiene registros emocionales recientes.
         * Para el MVP se usa una ventana de 7 días.
         */
        $recentRecords = EmotionalRecord::with(['emotion', 'eventCategory'])
            ->where('student_id', $student->id)
            ->where('record_date', '>=', now()->subDays(7)->toDateString())
            ->orderBy('record_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        /*
         * Calcula el indicador de riesgo.
         */
        $risk = $this->calculateRiskFromRecords($recentRecords);

        /*
         * Si el riesgo es bajo, no se crea alerta.
         */
        if (!$risk['should_create_alert']) {
            return response()->json([
                'message' => 'No alert generated. Current risk indicator is low.',
                'risk' => [
                    'level' => $risk['level'],
                    'score' => $risk['score'],
                    'is_diagnostic' => false,
                ],
                'analysis_window' => [
                    'days' => 7,
                    'records_analyzed' => $recentRecords->count(),
                ],
            ]);
        }

        /*
         * Toma el registro emocional más reciente como origen de la alerta.
         */
        $latestRecord = $recentRecords->first();

        /*
         * Evita duplicar alertas abiertas para el mismo estudiante y registro.
         * Así, si el tutor presiona varias veces "generar alerta", no se crean
         * registros repetidos.
         */
        $existingAlert = Alert::where('student_id', $student->id)
            ->where('emotional_record_id', $latestRecord->id)
            ->where('risk_level', $risk['level'])
            ->where('status', 'open')
            ->first();

        if ($existingAlert) {
            return response()->json([
                'message' => 'An open alert already exists for this risk indicator.',
                'alert' => $existingAlert->load(['student.user', 'emotionalRecord.emotion']),
                'risk' => [
                    'level' => $risk['level'],
                    'score' => $risk['score'],
                    'is_diagnostic' => false,
                ],
            ]);
        }

        /*
         * Crea la alerta dentro de una transacción.
         * Esto ayuda a mantener consistencia si después agregamos notificaciones.
         */
        $alert = DB::transaction(function () use ($student, $latestRecord, $risk, $request) {
            return Alert::create([
                'student_id' => $student->id,
                'emotional_record_id' => $latestRecord->id,
                'risk_level' => $risk['level'],
                'title' => $risk['title'],
                'general_reason' => $risk['reason'],
                'status' => 'open',
                'generated_by' => $request->user()->id,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]);
        });

        return response()->json([
            'message' => 'Risk alert generated successfully.',
            'risk' => [
                'level' => $risk['level'],
                'score' => $risk['score'],
                'is_diagnostic' => false,
            ],
            'alert' => $alert->load(['student.user', 'emotionalRecord.emotion', 'emotionalRecord.eventCategory']),
        ], 201);
    }

    /*
     * Lista las alertas de los estudiantes asignados al tutor autenticado.
     *
     * Endpoint:
     * GET /api/tutor/alerts
     *
     * También permite filtrar por status:
     * GET /api/tutor/alerts?status=open
     */
    public function index(Request $request)
    {
        /*
         * Verifica que el usuario autenticado sea tutor.
         */
        if ($response = $this->ensureTutor($request)) {
            return $response;
        }

        /*
         * Obtiene el perfil de tutor.
         */
        $tutor = $this->getAuthenticatedTutor($request);

        if ($tutor instanceof \Illuminate\Http\JsonResponse) {
            return $tutor;
        }

        /*
         * Obtiene los IDs de estudiantes asignados al tutor.
         */
        $assignedStudentIds = StudentTutorAssignment::where('tutor_id', $tutor->id)
            ->where('status', 'active')
            ->pluck('student_id');

        /*
         * Consulta alertas de esos estudiantes.
         */
        $query = Alert::with([
                'student.user',
                'emotionalRecord.emotion',
                'emotionalRecord.eventCategory',
                'generatedBy',
                'reviewedBy',
            ])
            ->whereIn('student_id', $assignedStudentIds)
            ->orderBy('created_at', 'desc');

        /*
         * Filtro opcional por status.
         * Ejemplo: open, reviewed.
         */
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'alerts' => $query->get(),
        ]);
    }

    /*
     * Marca una alerta como revisada por el tutor autenticado.
     *
     * Endpoint:
     * PATCH /api/tutor/alerts/{alert}/review
     */
    public function review(Request $request, Alert $alert)
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
         * Valida que la alerta pertenezca a un estudiante asignado al tutor.
         */
        $student = Student::find($alert->student_id);

        if (!$student) {
            return response()->json([
                'message' => 'Student related to this alert was not found.',
            ], 404);
        }

        if ($response = $this->ensureAssignedStudent($student, $tutor)) {
            return $response;
        }

        /*
         * Actualiza la alerta como revisada.
         */
        $alert->update([
            'status' => 'reviewed',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Alert reviewed successfully.',
            'alert' => $alert->load(['student.user', 'emotionalRecord.emotion', 'reviewedBy']),
        ]);
    }
}