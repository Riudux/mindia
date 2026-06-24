<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmotionalRecord;
use App\Models\Student;
use App\Models\StudentTutorAssignment;
use App\Models\Tutor;
use Illuminate\Http\Request;

class RiskAnalysisController extends Controller
{
    /*
     * Valida que el usuario autenticado tenga rol tutor.
     *
     * Este endpoint está pensado para el dashboard del tutor, por eso
     * no debe ser usado directamente por estudiantes, support o admin.
     */
    private function ensureTutor(Request $request)
    {
        // Carga el rol del usuario autenticado.
        $user = $request->user()->load('role');

        // Bloquea el acceso si el usuario no tiene rol tutor.
        if (!$user->role || $user->role->name !== 'tutor') {
            return response()->json([
                'message' => 'Access denied. Only tutors can perform this action.',
            ], 403);
        }

        // Si el usuario es tutor, no se devuelve error.
        return null;
    }

    /*
     * Calcula un indicador básico de riesgo emocional para un estudiante asignado.
     *
     * Endpoint:
     * GET /api/tutor/students/{student}/risk-summary
     *
     * IMPORTANTE:
     * Este método NO genera diagnósticos clínicos.
     * Solo produce indicadores de apoyo para que el tutor pueda identificar
     * si conviene revisar el caso del estudiante.
     */
    public function summary(Request $request, Student $student)
    {
        /*
         * Verifica que el usuario autenticado sea tutor.
         */
        if ($response = $this->ensureTutor($request)) {
            return $response;
        }

        /*
         * Busca el perfil de tutor relacionado al usuario autenticado.
         */
        $tutor = Tutor::where('user_id', $request->user()->id)->first();

        if (!$tutor) {
            return response()->json([
                'message' => 'Tutor profile not found for authenticated user.',
            ], 404);
        }

        /*
         * Valida que el estudiante consultado esté asignado al tutor.
         * Esto protege los datos emocionales sensibles del estudiante.
         */
        $hasAssignment = StudentTutorAssignment::where('student_id', $student->id)
            ->where('tutor_id', $tutor->id)
            ->where('status', 'active')
            ->exists();

        if (!$hasAssignment) {
            return response()->json([
                'message' => 'Access denied. This student is not assigned to the authenticated tutor.',
            ], 403);
        }

        /*
         * Carga los datos generales del usuario estudiante.
         */
        $student->load('user');

        if (!$student->user || $student->user->status !== 'active') {
            return response()->json([
                'message' => 'The selected student user account is not active.',
            ], 422);
        }

        /*
         * Obtiene los registros emocionales recientes.
         *
         * Para el MVP usamos los últimos 7 días como ventana de análisis.
         * Esto permite generar un indicador simple y entendible.
         */
        $recentRecords = EmotionalRecord::with(['emotion', 'eventCategory'])
            ->where('student_id', $student->id)
            ->where('record_date', '>=', now()->subDays(7)->toDateString())
            ->orderBy('record_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        /*
         * Si no hay registros recientes, se devuelve riesgo bajo.
         * No significa que el estudiante esté bien o mal, solo que no hay
         * datos recientes suficientes para elevar el indicador.
         */
        if ($recentRecords->isEmpty()) {
            return response()->json([
                'student' => [
                    'student_id' => $student->id,
                    'user_id' => $student->user->id,
                    'name' => $student->user->name,
                    'email' => $student->user->email,
                    'career' => $student->career,
                    'group_name' => $student->group_name,
                    'semester' => $student->semester,
                ],
                'risk' => [
                    'level' => 'low',
                    'score' => 0,
                    'label' => 'Low risk indicator',
                    'message' => 'There are no recent emotional records indicating immediate follow-up priority.',
                    'is_diagnostic' => false,
                ],
                'analysis_window' => [
                    'days' => 7,
                    'records_analyzed' => 0,
                ],
                'signals' => [],
            ]);
        }

        /*
         * Lista de emociones que para el MVP se consideran señales de atención.
         * Esto NO significa diagnóstico. Solo ayuda a priorizar seguimiento.
         */
        $attentionEmotions = [
            'Sad',
            'Angry',
            'Anxious',
            'Stressed',
            'Tired',
        ];

        /*
         * Calcula métricas base.
         */
        $totalRecords = $recentRecords->count();
        $averageIntensity = round($recentRecords->avg('intensity_level'), 2);
        $highestIntensity = $recentRecords->max('intensity_level');

        /*
         * Cuenta cuántos registros recientes pertenecen a emociones de atención.
         */
        $attentionRecords = $recentRecords->filter(function ($record) use ($attentionEmotions) {
            return $record->emotion && in_array($record->emotion->name, $attentionEmotions);
        });

        $attentionCount = $attentionRecords->count();

        /*
         * Cuenta registros de intensidad alta.
         * En esta escala, 4 y 5 se consideran intensidad alta.
         */
        $highIntensityCount = $recentRecords->filter(function ($record) {
            return $record->intensity_level >= 4;
        })->count();

        /*
         * Calcula un puntaje simple de riesgo.
         *
         * El score no es diagnóstico:
         * - Sube por intensidad promedio alta.
         * - Sube por emociones de atención.
         * - Sube por repetición de registros intensos.
         */
        $score = 0;

        // Aporta hasta 40 puntos según intensidad promedio.
        $score += min(40, $averageIntensity * 8);

        // Aporta hasta 30 puntos por cantidad de emociones de atención.
        $score += min(30, $attentionCount * 10);

        // Aporta hasta 30 puntos por registros de intensidad alta.
        $score += min(30, $highIntensityCount * 10);

        // Redondea el score final.
        $score = round($score);

        /*
         * Define el nivel del indicador.
         */
        if ($score >= 70) {
            $level = 'high';
            $label = 'High risk indicator';
            $message = 'The student shows repeated or intense emotional signals that may require prompt tutor follow-up.';
        } elseif ($score >= 40) {
            $level = 'medium';
            $label = 'Medium risk indicator';
            $message = 'The student shows some emotional records that may require tutor follow-up.';
        } else {
            $level = 'low';
            $label = 'Low risk indicator';
            $message = 'The student does not currently show enough recent signals to prioritize immediate follow-up.';
        }

        /*
         * Distribución de emociones recientes.
         */
        $emotionDistribution = $recentRecords
            ->groupBy(function ($record) {
                return $record->emotion ? $record->emotion->name : 'Unknown';
            })
            ->map(function ($group, $emotionName) {
                $firstRecord = $group->first();

                return [
                    'emotion_id' => $firstRecord->emotion_id,
                    'name' => $emotionName,
                    'color' => $firstRecord->emotion ? $firstRecord->emotion->color : null,
                    'icon' => $firstRecord->emotion ? $firstRecord->emotion->icon : null,
                    'count' => $group->count(),
                    'average_intensity' => round($group->avg('intensity_level'), 2),
                ];
            })
            ->values();

        /*
         * Devuelve el resumen de riesgo.
         */
        return response()->json([
            'student' => [
                'student_id' => $student->id,
                'user_id' => $student->user->id,
                'name' => $student->user->name,
                'email' => $student->user->email,
                'phone' => $student->user->phone,
                'enrollment_key' => $student->enrollment_key,
                'career' => $student->career,
                'group_name' => $student->group_name,
                'semester' => $student->semester,
                'academic_status' => $student->academic_status,
            ],
            'risk' => [
                'level' => $level,
                'score' => $score,
                'label' => $label,
                'message' => $message,
                'is_diagnostic' => false,
            ],
            'analysis_window' => [
                'days' => 7,
                'records_analyzed' => $totalRecords,
            ],
            'signals' => [
                'average_intensity' => $averageIntensity,
                'highest_intensity' => $highestIntensity,
                'attention_emotion_records' => $attentionCount,
                'high_intensity_records' => $highIntensityCount,
            ],
            'emotion_distribution' => $emotionDistribution,
            'recent_records' => $recentRecords,
        ]);
    }
}