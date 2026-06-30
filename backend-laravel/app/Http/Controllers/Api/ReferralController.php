<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Referral;
use App\Models\Student;
use App\Models\StudentTutorAssignment;
use App\Models\SupportStaff;
use App\Models\Tutor;
use App\Models\ReferralFollowup;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    /*
     * Valida que el usuario autenticado tenga rol tutor.
     *
     * Este rol puede crear canalizaciones para estudiantes asignados.
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
     * Valida que el usuario autenticado tenga rol support.
     *
     * Este rol puede consultar y actualizar las canalizaciones asignadas.
     */
    private function ensureSupport(Request $request)
    {
        $user = $request->user()->load('role');

        if (!$user->role || $user->role->name !== 'support') {
            return response()->json([
                'message' => 'Access denied. Only support staff can perform this action.',
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
     * Obtiene el perfil de soporte relacionado con el usuario autenticado.
     */
    private function getAuthenticatedSupportStaff(Request $request)
    {
        $supportStaff = SupportStaff::where('user_id', $request->user()->id)->first();

        if (!$supportStaff) {
            return response()->json([
                'message' => 'Support staff profile not found for authenticated user.',
            ], 404);
        }

        return $supportStaff;
    }

    /*
     * Valida que una alerta pertenezca a un estudiante asignado al tutor.
     *
     * Esto evita que un tutor canalice casos de estudiantes que no le corresponden.
     */
    private function ensureAlertBelongsToTutor(Alert $alert, Tutor $tutor)
    {
        $student = Student::find($alert->student_id);

        if (!$student) {
            return response()->json([
                'message' => 'Student related to this alert was not found.',
            ], 404);
        }

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
     * Crea una canalización desde una alerta hacia soporte institucional.
     *
     * Endpoint:
     * POST /api/tutor/alerts/{alert}/referrals
     */
    public function storeFromAlert(Request $request, Alert $alert)
    {
        /*
         * Verifica que el usuario autenticado sea tutor.
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
         * Verifica que la alerta sea de un estudiante asignado al tutor.
         */
        if ($response = $this->ensureAlertBelongsToTutor($alert, $tutor)) {
            return $response;
        }

        /*
         * Valida la información enviada desde Postman, app móvil o dashboard.
         *
         * referred_to debe ser el ID de la tabla support_staff.
         */
        $validated = $request->validate([
            'referred_to' => ['required', 'exists:support_staff,id'],
            'reason' => ['required', 'string', 'max:1000'],
            'priority' => ['nullable', 'string', 'in:low,medium,high'],
            'status' => ['nullable', 'string', 'in:pending,in_review,completed,cancelled'],
            'referral_date' => ['nullable', 'date'],
        ]);

        /*
         * Evita duplicar una canalización pendiente o en revisión
         * para la misma alerta y el mismo personal de soporte.
         */
        $existingReferral = Referral::where('alert_id', $alert->id)
            ->where('referred_to', $validated['referred_to'])
            ->whereIn('status', ['pending', 'in_review'])
            ->first();

        if ($existingReferral) {
            return response()->json([
                'message' => 'A pending or in-review referral already exists for this alert and support staff.',
                'referral' => $existingReferral->load([
                    'student.user',
                    'tutor.user',
                    'alert',
                    'referredTo.user',
                ]),
            ], 409);
        }

        /*
         * Crea la canalización.
         *
         * student_id y alert_id vienen de la alerta.
         * tutor_id viene del tutor autenticado.
         */
        $referral = Referral::create([
            'student_id' => $alert->student_id,
            'tutor_id' => $tutor->id,
            'alert_id' => $alert->id,
            'referred_to' => $validated['referred_to'],
            'reason' => $validated['reason'],
            'priority' => $validated['priority'] ?? 'medium',
            'status' => $validated['status'] ?? 'pending',
            'referral_date' => $validated['referral_date'] ?? now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Referral created successfully.',
            'referral' => $referral->load([
                'student.user',
                'tutor.user',
                'alert',
                'referredTo.user',
            ]),
        ], 201);
    }

    /*
     * Lista las canalizaciones creadas por el tutor autenticado.
     *
     * Endpoint:
     * GET /api/tutor/referrals
     *
     * Filtro opcional:
     * GET /api/tutor/referrals?status=pending
     */
    public function tutorIndex(Request $request)
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
         * Consulta canalizaciones creadas por ese tutor.
         */
        $query = Referral::with([
                'student.user',
                'tutor.user',
                'alert',
                'referredTo.user',
            ])
            ->where('tutor_id', $tutor->id)
            ->orderBy('created_at', 'desc');

        /*
         * Permite filtrar por estado si se manda query param.
         */
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'referrals' => $query->get(),
        ]);
    }

    /*
     * Lista las canalizaciones asignadas al usuario de soporte autenticado.
     *
     * Endpoint:
     * GET /api/support/referrals
     */
    public function supportIndex(Request $request)
    {
        /*
         * Verifica que el usuario autenticado sea support.
         */
        if ($response = $this->ensureSupport($request)) {
            return $response;
        }

        /*
         * Obtiene el perfil de soporte autenticado.
         */
        $supportStaff = $this->getAuthenticatedSupportStaff($request);

        if ($supportStaff instanceof \Illuminate\Http\JsonResponse) {
            return $supportStaff;
        }

        /*
         * Consulta únicamente las canalizaciones asignadas a este soporte.
         */
        $query = Referral::with([
                'student.user',
                'tutor.user',
                'alert',
                'referredTo.user',
            ])
            ->where('referred_to', $supportStaff->id)
            ->orderBy('created_at', 'desc');

        /*
         * Filtro opcional por estado.
         */
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'support_staff' => $supportStaff->load('user'),
            'referrals' => $query->get(),
        ]);
    }

    /*
     * Actualiza el estado de una canalización desde soporte institucional.
     *
     * Endpoint:
     * PATCH /api/support/referrals/{referral}/status
     */
    public function updateStatus(Request $request, Referral $referral)
    {
        /*
         * Verifica que el usuario autenticado sea support.
         */
        if ($response = $this->ensureSupport($request)) {
            return $response;
        }

        /*
         * Obtiene el perfil de soporte autenticado.
         */
        $supportStaff = $this->getAuthenticatedSupportStaff($request);

        if ($supportStaff instanceof \Illuminate\Http\JsonResponse) {
            return $supportStaff;
        }

        /*
         * Evita que un usuario de soporte actualice canalizaciones
         * asignadas a otro miembro del área.
         */
        if ((int) $referral->referred_to !== (int) $supportStaff->id) {
            return response()->json([
                'message' => 'Access denied. This referral is not assigned to the authenticated support staff.',
            ], 403);
        }

        /*
         * Valida el nuevo estado.
         */
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,in_review,completed,cancelled'],
        ]);

        /*
         * Actualiza el estado de la canalización.
         */
        $referral->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message' => 'Referral status updated successfully.',
            'referral' => $referral->load([
                'student.user',
                'tutor.user',
                'alert',
                'referredTo.user',
            ]),
        ]);
    }

    /*
    * Valida que una canalización pertenezca al personal de apoyo autenticado.
    *
    * Esto evita que un usuario de apoyo consulte o registre atención
    * en casos asignados a otra persona.
    */
    private function ensureReferralBelongsToSupportStaff(Referral $referral, SupportStaff $supportStaff)
    {
        if ((int) $referral->referred_to !== (int) $supportStaff->id) {
            return response()->json([
                'message' => 'Access denied. This referral is not assigned to the authenticated support staff.',
            ], 403);
        }

        return null;
    }

    /*
    * Lista las atenciones registradas para una canalización.
    *
    * Endpoint:
    * GET /api/support/referrals/{referral}/followups
    */
    public function supportFollowupsIndex(Request $request, Referral $referral)
    {
        if ($response = $this->ensureSupport($request)) {
            return $response;
        }

        $supportStaff = $this->getAuthenticatedSupportStaff($request);

        if ($supportStaff instanceof \Illuminate\Http\JsonResponse) {
            return $supportStaff;
        }

        if ($response = $this->ensureReferralBelongsToSupportStaff($referral, $supportStaff)) {
            return $response;
        }

        $followups = ReferralFollowup::with([
                'supportStaff.user',
                'referral.student.user',
                'referral.tutor.user',
                'referral.alert',
            ])
            ->where('referral_id', $referral->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'referral' => $referral->load([
                'student.user',
                'tutor.user',
                'alert',
                'referredTo.user',
            ]),
            'followups' => $followups,
        ]);
    }

    /*
    * Registra una atención realizada por personal de apoyo.
    *
    * Endpoint:
    * POST /api/support/referrals/{referral}/followups
    */
    public function storeSupportFollowup(Request $request, Referral $referral)
    {
        if ($response = $this->ensureSupport($request)) {
            return $response;
        }

        $supportStaff = $this->getAuthenticatedSupportStaff($request);

        if ($supportStaff instanceof \Illuminate\Http\JsonResponse) {
            return $supportStaff;
        }

        if ($response = $this->ensureReferralBelongsToSupportStaff($referral, $supportStaff)) {
            return $response;
        }

        /*
        * Valida los datos enviados desde React.
        *
        * close_case permite cerrar el caso al mismo tiempo que se registra
        * la atención.
        */
        $validated = $request->validate([
            'attention_type' => ['required', 'string', 'in:orientation,interview,follow_up,internal_referral,other'],
            'notes' => ['required', 'string', 'max:2000'],
            'result' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'string', 'in:registered,completed'],
            'attended_at' => ['nullable', 'date'],
            'close_case' => ['nullable', 'boolean'],
        ]);

        $followup = ReferralFollowup::create([
            'referral_id' => $referral->id,
            'support_staff_id' => $supportStaff->id,
            'attention_type' => $validated['attention_type'],
            'notes' => $validated['notes'],
            'result' => $validated['result'] ?? null,
            'status' => $validated['status'] ?? 'registered',
            'attended_at' => $validated['attended_at'] ?? now(),
        ]);

        /*
        * Actualiza el estado del caso:
        * - Si close_case es true, el caso se cierra.
        * - Si estaba pendiente y no se cierra, pasa a revisión.
        */
        if (($validated['close_case'] ?? false) === true) {
            $referral->update([
                'status' => 'completed',
            ]);
        } elseif ($referral->status === 'pending') {
            $referral->update([
                'status' => 'in_review',
            ]);
        }

        return response()->json([
            'message' => 'Referral follow-up registered successfully.',
            'followup' => $followup->load([
                'supportStaff.user',
                'referral.student.user',
                'referral.tutor.user',
                'referral.alert',
            ]),
            'referral' => $referral->fresh()->load([
                'student.user',
                'tutor.user',
                'alert',
                'referredTo.user',
            ]),
        ], 201);
    }
}