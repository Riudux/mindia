<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\EmotionalRecord;
use App\Models\PrivacyConsent;
use App\Models\Referral;
use App\Models\Student;
use App\Models\SupportStaff;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    /*
     * Valida que el usuario autenticado tenga rol admin.
     *
     * Este endpoint es exclusivo para el dashboard administrativo,
     * por eso no debe ser consultado por estudiantes, tutores o soporte.
     */
    private function ensureAdmin(Request $request)
    {
        // Carga el rol del usuario autenticado.
        $user = $request->user()->load('role');

        // Si el usuario no tiene rol o no es admin, se bloquea el acceso.
        if (!$user->role || $user->role->name !== 'admin') {
            return response()->json([
                'message' => 'Access denied. Only administrators can perform this action.',
            ], 403);
        }

        return null;
    }

    /*
     * Cuenta registros agrupados por una columna.
     *
     * Ejemplo:
     * - Alertas agrupadas por status.
     * - Alertas agrupadas por risk_level.
     * - Canalizaciones agrupadas por priority.
     *
     * Esto ayuda a que el frontend reciba datos ya listos para gráficas,
     * tarjetas o indicadores del dashboard.
     */
    private function countByColumn(string $modelClass, string $column)
    {
        return $modelClass::select($column)
            ->selectRaw('COUNT(*) as total')
            ->groupBy($column)
            ->pluck('total', $column);
    }

    /*
     * Devuelve un resumen general del sistema para el dashboard web.
     *
     * Endpoint:
     * GET /api/admin/dashboard-summary
     *
     * Este endpoint entrega métricas globales del MVP:
     * usuarios, estudiantes, tutores, soporte, registros emocionales,
     * alertas, canalizaciones y consentimientos.
     */
    public function summary(Request $request)
    {
        /*
         * Verifica que el usuario autenticado sea administrador.
         */
        if ($response = $this->ensureAdmin($request)) {
            return $response;
        }

        /*
         * Métricas principales del sistema.
         *
         * Estas métricas pueden mostrarse como tarjetas en el dashboard.
         */
        $mainSummary = [
            'total_users' => User::count(),
            'total_students' => Student::count(),
            'total_tutors' => Tutor::count(),
            'total_support_staff' => SupportStaff::count(),
            'total_emotional_records' => EmotionalRecord::count(),
            'total_alerts' => Alert::count(),
            'total_referrals' => Referral::count(),
            'accepted_privacy_consents' => PrivacyConsent::where('accepted', true)->count(),
        ];

        /*
         * Métricas agrupadas de alertas.
         *
         * Sirven para saber cuántas alertas están abiertas,
         * revisadas o con distintos niveles de riesgo.
         */
        $alertSummary = [
            'by_status' => $this->countByColumn(Alert::class, 'status'),
            'by_risk_level' => $this->countByColumn(Alert::class, 'risk_level'),
        ];

        /*
         * Métricas agrupadas de canalizaciones.
         *
         * Sirven para mostrar el estado de los casos enviados
         * a soporte institucional.
         */
        $referralSummary = [
            'by_status' => $this->countByColumn(Referral::class, 'status'),
            'by_priority' => $this->countByColumn(Referral::class, 'priority'),
        ];

        /*
         * Últimas alertas registradas.
         *
         * Se limitan a 5 para que el dashboard no cargue información excesiva.
         */
        $latestAlerts = Alert::select([
                'id',
                'student_id',
                'emotional_record_id',
                'risk_level',
                'title',
                'general_reason',
                'status',
                'generated_by',
                'reviewed_by',
                'reviewed_at',
                'created_at',
            ])
            ->latest('created_at')
            ->limit(5)
            ->get();

        /*
         * Últimas canalizaciones registradas.
         *
         * Se limitan a 5 para mostrar actividad reciente del sistema.
         */
        $latestReferrals = Referral::select([
                'id',
                'student_id',
                'tutor_id',
                'alert_id',
                'referred_to',
                'reason',
                'priority',
                'status',
                'referral_date',
                'created_at',
            ])
            ->latest('created_at')
            ->limit(5)
            ->get();

        /*
         * Respuesta final para el frontend.
         */
        return response()->json([
            'message' => 'Admin dashboard summary retrieved successfully.',
            'summary' => $mainSummary,
            'alerts' => $alertSummary,
            'referrals' => $referralSummary,
            'latest_alerts' => $latestAlerts,
            'latest_referrals' => $latestReferrals,
            'generated_at' => now(),
        ]);
    }
}