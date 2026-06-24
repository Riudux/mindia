<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentTutorAssignment;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
     * Crea una nueva asignación estudiante-tutor.
     *
     * Recibe:
     * - student_id: ID del registro en la tabla students.
     * - tutor_id: ID del registro en la tabla tutors.
     * - status: estado de la asignación, por defecto active.
     *
     * También registra:
     * - assigned_by: usuario admin que hizo la asignación.
     * - assigned_at: fecha y hora de la asignación.
     */
    public function store(Request $request)
    {
        // Verifica que el usuario autenticado sea admin.
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        /*
         * Valida que el estudiante y el tutor existan.
         * El status solo puede ser active o inactive.
         */
        $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'tutor_id' => ['required', 'exists:tutors,id'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        /*
         * Obtiene el estudiante y su usuario relacionado.
         * Esto permite validar que la cuenta del estudiante esté activa.
         */
        $student = Student::with('user')->findOrFail($request->student_id);

        /*
         * Obtiene el tutor y su usuario relacionado.
         * Esto permite validar que la cuenta del tutor esté activa.
         */
        $tutor = Tutor::with('user')->findOrFail($request->tutor_id);

        /*
         * No se debe asignar un estudiante cuya cuenta esté inactiva.
         * Esto evita que el tutor reciba estudiantes desactivados.
         */
        if (!$student->user || $student->user->status !== 'active') {
            return response()->json([
                'message' => 'The selected student user account is not active.',
            ], 422);
        }

        /*
         * No se debe asignar un tutor cuya cuenta esté inactiva.
         * Esto asegura que solo tutores activos reciban estudiantes.
         */
        if (!$tutor->user || $tutor->user->status !== 'active') {
            return response()->json([
                'message' => 'The selected tutor user account is not active.',
            ], 422);
        }

        /*
         * Evita duplicar una asignación activa entre el mismo estudiante y tutor.
         * Si ya existe una asignación activa igual, se responde con conflicto.
         */
        $alreadyAssigned = StudentTutorAssignment::where('student_id', $request->student_id)
            ->where('tutor_id', $request->tutor_id)
            ->where('status', 'active')
            ->exists();

        if ($alreadyAssigned) {
            return response()->json([
                'message' => 'This student is already actively assigned to this tutor.',
            ], 409);
        }

        /*
         * Transacción para asegurar integridad.
         * Si algo falla, Laravel revierte la operación.
         */
        $assignment = DB::transaction(function () use ($request) {
            return StudentTutorAssignment::create([
                'student_id' => $request->student_id,
                'tutor_id' => $request->tutor_id,
                'assigned_by' => $request->user()->id,
                'status' => $request->status ?? 'active',
                'assigned_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Student assigned to tutor successfully.',
            'assignment' => $assignment->load([
                'student.user',
                'tutor.user',
                'assignedBy',
            ]),
        ], 201);
    }
}