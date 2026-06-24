<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
// Modelo donde se guardan los registros emocionales diarios.
use App\Models\EmotionalRecord;
// Modelo del estudiante.
use App\Models\Student;
// Modelo donde se guardan las asignaciones estudiante-tutor.
use App\Models\StudentTutorAssignment;
// Modelo del tutor.
use App\Models\Tutor;


class TutorStudentController extends Controller
{
    /*
     * Valida que el usuario autenticado tenga rol de tutor.
     *
     * Este endpoint no debe ser usado por admin, support ni student,
     * porque su propósito es mostrarle al tutor únicamente los estudiantes
     * que tiene asignados.
     */
    private function ensureTutor(Request $request)
    {
        // Carga el rol del usuario autenticado.
        $user = $request->user()->load('role');

        // Si el usuario no tiene rol o su rol no es tutor, se bloquea el acceso.
        if (!$user->role || $user->role->name !== 'tutor') {
            return response()->json([
                'message' => 'Access denied. Only tutors can perform this action.',
            ], 403);
        }

        // Si es tutor, no se devuelve error.
        return null;
    }

    /*
     * Lista los estudiantes asignados al tutor autenticado.
     *
     * Flujo:
     * 1. Verifica que el usuario autenticado sea tutor.
     * 2. Busca el registro del tutor en la tabla "tutors".
     * 3. Consulta las asignaciones activas en "student_tutor_assignments".
     * 4. Devuelve solo los estudiantes asignados a ese tutor.
     */
    public function index(Request $request)
    {
        // Verifica que solo un tutor pueda usar este endpoint.
        if ($response = $this->ensureTutor($request)) {
            return $response;
        }

        /*
         * Busca el perfil de tutor relacionado con el usuario autenticado.
         * El usuario autenticado viene desde el token Bearer de Sanctum.
         */
        $tutor = Tutor::where('user_id', $request->user()->id)->first();

        /*
         * Si el usuario tiene rol tutor pero no existe en la tabla tutors,
         * significa que su perfil institucional no está completo.
         */
        if (!$tutor) {
            return response()->json([
                'message' => 'Tutor profile not found for authenticated user.',
            ], 404);
        }

        /*
         * Consulta las asignaciones activas del tutor.
         *
         * with('student.user') permite traer:
         * - Los datos académicos del estudiante desde la tabla students.
         * - Los datos generales del usuario desde la tabla users.
         *
         * whereHas('student.user') filtra para traer solo estudiantes
         * cuya cuenta de usuario esté activa.
         */
        $assignments = StudentTutorAssignment::with(['student.user'])
            ->where('tutor_id', $tutor->id)
            ->where('status', 'active')
            ->whereHas('student.user', function ($query) {
                $query->where('status', 'active');
            })
            ->orderBy('assigned_at', 'desc')
            ->get();

        /*
         * Se transforma la respuesta para que el frontend reciba datos limpios.
         * Así React no tiene que navegar estructuras demasiado anidadas.
         */
        $students = $assignments->map(function ($assignment) {
            return [
                'assignment_id' => $assignment->id,
                'student_id' => $assignment->student->id,
                'user_id' => $assignment->student->user->id,
                'name' => $assignment->student->user->name,
                'email' => $assignment->student->user->email,
                'phone' => $assignment->student->user->phone,
                'enrollment_key' => $assignment->student->enrollment_key,
                'career' => $assignment->student->career,
                'group_name' => $assignment->student->group_name,
                'semester' => $assignment->student->semester,
                'academic_status' => $assignment->student->academic_status,
                'assignment_status' => $assignment->status,
                'assigned_at' => $assignment->assigned_at,
            ];
        });

        // Devuelve la lista final de estudiantes asignados al tutor.
        return response()->json([
            'tutor' => [
                'id' => $tutor->id,
                'user_id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ],
            'students' => $students,
        ]);
    }
    /*
    * Consulta el historial emocional de un estudiante asignado al tutor autenticado.
    *
    * Endpoint:
    * GET /api/tutor/students/{student}/emotional-records
    *
    * Este endpoint permite que un tutor vea los registros emocionales
    * únicamente de estudiantes que tiene asignados.
    */
    public function emotionalRecords(Request $request, Student $student)
    {
        /*
        * Primero se valida que el usuario autenticado tenga rol tutor.
        * Si el usuario no es tutor, se devuelve 403 Forbidden.
        */
        if ($response = $this->ensureTutor($request)) {
            return $response;
        }

        /*
        * Se busca el perfil de tutor relacionado con el usuario autenticado.
        * El token Bearer identifica al usuario, y con user_id buscamos su perfil en tutors.
        */
        $tutor = Tutor::where('user_id', $request->user()->id)->first();

        /*
        * Si el usuario tiene rol tutor pero no tiene perfil en la tabla tutors,
        * significa que su perfil institucional está incompleto.
        */
        if (!$tutor) {
            return response()->json([
                'message' => 'Tutor profile not found for authenticated user.',
            ], 404);
        }

        /*
        * Se valida que el estudiante solicitado realmente esté asignado
        * al tutor autenticado.
        *
        * Esto evita que un tutor consulte información emocional de estudiantes
        * que no le pertenecen.
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
        * Se carga el usuario relacionado al estudiante.
        * Esto permite devolver nombre, correo y estado de la cuenta.
        */
        $student->load('user');

        /*
        * Si la cuenta del estudiante está inactiva, no se devuelve su historial.
        * Esto mantiene consistencia con la lógica de usuarios activos.
        */
        if (!$student->user || $student->user->status !== 'active') {
            return response()->json([
                'message' => 'The selected student user account is not active.',
            ], 422);
        }

        /*
        * Se consultan los registros emocionales del estudiante.
        *
        * with(['emotion', 'eventCategory']) carga:
        * - La emoción seleccionada.
        * - La categoría del evento relacionado.
        *
        * Se ordena por record_date descendente para mostrar primero
        * los registros más recientes.
        */
        $records = EmotionalRecord::with(['emotion', 'eventCategory'])
            ->where('student_id', $student->id)
            ->orderBy('record_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        /*
        * Se devuelve una respuesta limpia para que el dashboard web
        * pueda consumirla fácilmente.
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
            'records' => $records,
        ]);
    }
    /*
    * Consulta la tendencia emocional de un estudiante asignado al tutor autenticado.
    *
    * Endpoint:
    * GET /api/tutor/students/{student}/emotional-trends
    *
    * Este endpoint resume los registros emocionales del estudiante para que
    * el dashboard web pueda mostrar métricas y gráficas.
    */
    public function emotionalTrends(Request $request, Student $student)
    {
        /*
        * Primero se valida que el usuario autenticado tenga rol tutor.
        * Si no es tutor, se devuelve 403 Forbidden.
        */
        if ($response = $this->ensureTutor($request)) {
            return $response;
        }

        /*
        * Se busca el perfil de tutor relacionado con el usuario autenticado.
        * El usuario viene desde el token Bearer de Sanctum.
        */
        $tutor = Tutor::where('user_id', $request->user()->id)->first();

        /*
        * Si no existe perfil de tutor, no se puede continuar.
        */
        if (!$tutor) {
            return response()->json([
                'message' => 'Tutor profile not found for authenticated user.',
            ], 404);
        }

        /*
        * Se valida que el estudiante solicitado esté asignado al tutor.
        * Esto evita que un tutor vea información emocional de estudiantes
        * que no le corresponden.
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
        * Se carga la información general del estudiante.
        */
        $student->load('user');

        /*
        * Si la cuenta del estudiante está inactiva, no se devuelve tendencia.
        */
        if (!$student->user || $student->user->status !== 'active') {
            return response()->json([
                'message' => 'The selected student user account is not active.',
            ], 422);
        }

        /*
        * Se consultan todos los registros emocionales del estudiante.
        *
        * with(['emotion', 'eventCategory']) permite incluir:
        * - La emoción registrada.
        * - La categoría del evento relacionado.
        */
        $records = EmotionalRecord::with(['emotion', 'eventCategory'])
            ->where('student_id', $student->id)
            ->orderBy('record_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        /*
        * Si el estudiante todavía no tiene registros, se devuelve una respuesta
        * válida pero con métricas vacías.
        */
        if ($records->isEmpty()) {
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
                'summary' => [
                    'total_records' => 0,
                    'average_intensity' => null,
                    'highest_intensity' => null,
                    'lowest_intensity' => null,
                    'most_frequent_emotion' => null,
                    'latest_record' => null,
                ],
                'emotion_distribution' => [],
                'trend_data' => [],
            ]);
        }

        /*
        * Calcula la distribución de emociones.
        *
        * Ejemplo:
        * Stressed: 3 veces
        * Calm: 1 vez
        * Sad: 1 vez
        */
        $emotionDistribution = $records
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
                ];
            })
            ->values();

        /*
        * Obtiene la emoción más frecuente.
        */
        $mostFrequentEmotion = $emotionDistribution
            ->sortByDesc('count')
            ->first();

        /*
        * Agrupa los registros por fecha.
        *
        * Esto sirve directamente para gráficas de tendencia:
        * eje X = fecha
        * eje Y = intensidad promedio
        */
        $trendData = $records
            ->groupBy(function ($record) {
                return $record->record_date
                    ? $record->record_date->format('Y-m-d')
                    : null;
            })
            ->map(function ($group, $date) {
                $mainEmotionGroup = $group
                    ->groupBy(function ($record) {
                        return $record->emotion ? $record->emotion->name : 'Unknown';
                    })
                    ->sortByDesc(function ($emotionGroup) {
                        return $emotionGroup->count();
                    })
                    ->first();

                $mainRecord = $mainEmotionGroup ? $mainEmotionGroup->first() : null;

                return [
                    'date' => $date,
                    'record_count' => $group->count(),
                    'average_intensity' => round($group->avg('intensity_level'), 2),
                    'highest_intensity' => $group->max('intensity_level'),
                    'lowest_intensity' => $group->min('intensity_level'),
                    'main_emotion' => $mainRecord && $mainRecord->emotion ? [
                        'id' => $mainRecord->emotion->id,
                        'name' => $mainRecord->emotion->name,
                        'color' => $mainRecord->emotion->color,
                        'icon' => $mainRecord->emotion->icon,
                    ] : null,
                ];
            })
            ->values();

        /*
        * Obtiene el registro más reciente.
        */
        $latestRecord = $records
            ->sortByDesc('record_date')
            ->sortByDesc('id')
            ->first();

        /*
        * Devuelve la tendencia emocional ya resumida.
        * Esta respuesta está pensada para consumirse desde React en el dashboard web.
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
            'summary' => [
                'total_records' => $records->count(),
                'average_intensity' => round($records->avg('intensity_level'), 2),
                'highest_intensity' => $records->max('intensity_level'),
                'lowest_intensity' => $records->min('intensity_level'),
                'most_frequent_emotion' => $mostFrequentEmotion,
                'latest_record' => $latestRecord,
            ],
            'emotion_distribution' => $emotionDistribution,
            'trend_data' => $trendData,
        ]);
    }
}