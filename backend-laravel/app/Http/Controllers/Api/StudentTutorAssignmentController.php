<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentTutorAssignment;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Schema;

class StudentTutorAssignmentController extends Controller
{
    /*
     * Valida que el usuario autenticado sea administrador.
     * Este módulo debe estar restringido porque solo el admin
     * puede asignar estudiantes a tutores.
     */
    private function ensureAdmin(Request $request)
    {
        $user = $request->user()->load('role');

        if (!$user->role || $user->role->name !== 'admin') {
            return response()->json([
                'message' => 'Access denied. Only administrators can perform this action.',
            ], 403);
        }

        return null;
    }

    /*
     * Lista las asignaciones existentes.
     * Esta función sirve para verificar qué estudiantes ya fueron asignados
     * y a qué tutor pertenece cada uno.
     */
    public function index(Request $request)
    {
        // Verifica que solo el administrador pueda consultar asignaciones.
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        // Carga las relaciones para devolver información más completa.
        $assignments = StudentTutorAssignment::with([
            'student.user',
            'tutor.user',
            'assignedBy',
        ])
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'assignments' => $assignments,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Crear o reasignar estudiante a tutor
    |--------------------------------------------------------------------------
    |
    | Este método crea una asignación entre un estudiante y un tutor.
    |
    | Regla de negocio:
    | - Un estudiante solo puede tener un tutor activo a la vez.
    | - Si el estudiante ya tiene un tutor activo diferente, esa asignación
    |   anterior se marca como inactiva.
    | - Si el estudiante ya está activo con el mismo tutor, se devuelve error 409.
    |
    */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'tutor_id' => ['required', 'integer', 'exists:tutors,id'],
        ]);

        return DB::transaction(function () use ($validated) {
            $studentId = $validated['student_id'];
            $tutorId = $validated['tutor_id'];

            /*
            Consulta base para encontrar asignaciones activas.
            Soporta dos posibles diseños de tabla:
            - status = active / inactive
            - is_active = true / false
            */
            $activeAssignmentsQuery = StudentTutorAssignment::where('student_id', $studentId);

            if (Schema::hasColumn('student_tutor_assignments', 'status')) {
                $activeAssignmentsQuery->where('status', 'active');
            }

            if (Schema::hasColumn('student_tutor_assignments', 'is_active')) {
                $activeAssignmentsQuery->where('is_active', true);
            }

            /*
            Validamos si el estudiante ya está asignado activamente
            al mismo tutor.
            */
            $sameTutorActiveQuery = StudentTutorAssignment::where('student_id', $studentId)
                ->where('tutor_id', $tutorId);

            if (Schema::hasColumn('student_tutor_assignments', 'status')) {
                $sameTutorActiveQuery->where('status', 'active');
            }

            if (Schema::hasColumn('student_tutor_assignments', 'is_active')) {
                $sameTutorActiveQuery->where('is_active', true);
            }

            if ($sameTutorActiveQuery->exists()) {
                return response()->json([
                    'message' => 'This student is already actively assigned to this tutor.',
                ], 409);
            }

            /*
            Desactivamos cualquier asignación activa anterior del estudiante.
            Así evitamos que tenga dos tutores activos al mismo tiempo.
            */
            $inactiveData = [];

            if (Schema::hasColumn('student_tutor_assignments', 'status')) {
                $inactiveData['status'] = 'inactive';
            }

            if (Schema::hasColumn('student_tutor_assignments', 'is_active')) {
                $inactiveData['is_active'] = false;
            }

            if (Schema::hasColumn('student_tutor_assignments', 'ended_at')) {
                $inactiveData['ended_at'] = now();
            }

            if (Schema::hasColumn('student_tutor_assignments', 'end_date')) {
                $inactiveData['end_date'] = now()->toDateString();
            }

            if (!empty($inactiveData)) {
                $activeAssignmentsQuery->update($inactiveData);
            }

            /*
            Creamos la nueva asignación activa.
            */
            $newAssignmentData = [
                'student_id' => $studentId,
                'tutor_id' => $tutorId,
            ];

            if (Schema::hasColumn('student_tutor_assignments', 'status')) {
                $newAssignmentData['status'] = 'active';
            }

            if (Schema::hasColumn('student_tutor_assignments', 'is_active')) {
                $newAssignmentData['is_active'] = true;
            }

            if (Schema::hasColumn('student_tutor_assignments', 'assigned_at')) {
                $newAssignmentData['assigned_at'] = now();
            }

            if (Schema::hasColumn('student_tutor_assignments', 'start_date')) {
                $newAssignmentData['start_date'] = now()->toDateString();
            }

            $assignment = StudentTutorAssignment::create($newAssignmentData);

            return response()->json([
                'message' => 'Student assigned to tutor successfully.',
                'assignment' => $assignment,
            ], 201);
        });
    }
}