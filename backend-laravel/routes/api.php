<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StudentTutorAssignmentController;
// Controlador para que el tutor consulte sus estudiantes asignados.
use App\Http\Controllers\Api\TutorStudentController;
// Controlador para registrar y consultar el consentimiento de privacidad del estudiante.
use App\Http\Controllers\Api\PrivacyConsentController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\EmotionalRecordController;
// Controlador para calcular indicadores básicos de riesgo emocional.
use App\Http\Controllers\Api\RiskAnalysisController;
// Controlador para generar, listar y revisar alertas de riesgo.
use App\Http\Controllers\Api\AlertController;
// Controlador para registrar y consultar seguimientos del tutor.
use App\Http\Controllers\Api\FollowupController;
// Controlador para canalizaciones a soporte institucional.
use App\Http\Controllers\Api\ReferralController;
// Controlador para el resumen del dashboard administrativo.
use App\Http\Controllers\Api\AdminDashboardController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // Devuelve la información del usuario autenticado.
    Route::get('/me', [AuthController::class, 'me']);

    // Cierra sesión eliminando el token actual.
    Route::post('/logout', [AuthController::class, 'logout']);

    // Lista los usuarios registrados.
    Route::get('/users', [UserController::class, 'index']);

    // Crea un nuevo usuario.
    Route::post('/users', [UserController::class, 'store']);

    // Muestra la información de un usuario específico.
    Route::get('/users/{user}', [UserController::class, 'show']);

    // Actualiza la información de un usuario.
    Route::put('/users/{user}', [UserController::class, 'update']);

    // Activa o desactiva una cuenta de usuario.
    Route::patch('/users/{user}/status', [UserController::class, 'updateStatus']);

    /*
    |--------------------------------------------------------------------------
    | Student-Tutor Assignment Routes
    |--------------------------------------------------------------------------
    | Estas rutas permiten que un administrador asigne estudiantes a tutores.
    | Están protegidas con Sanctum y requieren token Bearer.
    */

    // Lista todas las asignaciones estudiante-tutor.
    Route::get('/student-tutor-assignments', [StudentTutorAssignmentController::class, 'index']);

    // Crea una nueva asignación entre un estudiante y un tutor.
    Route::post('/student-tutor-assignments', [StudentTutorAssignmentController::class, 'store']);

    // Lista los estudiantes asignados al tutor autenticado.
    Route::get('/tutor/students', [TutorStudentController::class, 'index']);
    /*
    * Permite que un tutor consulte el historial emocional
    * de un estudiante que tiene asignado.
    */
    Route::get('/tutor/students/{student}/emotional-records', [TutorStudentController::class, 'emotionalRecords']);
    /*
    * Permite que el tutor consulte una tendencia emocional resumida
    * de un estudiante que tiene asignado.
    */
    Route::get('/tutor/students/{student}/emotional-trends', [TutorStudentController::class, 'emotionalTrends']);
    /*
    |--------------------------------------------------------------------------
    | Privacy Consent Routes
    |--------------------------------------------------------------------------
    | Estas rutas permiten que un estudiante acepte y consulte su consentimiento
    | de privacidad antes de registrar información emocional.
    */

    // Consulta si el estudiante autenticado ya aceptó el consentimiento.
    Route::get('/privacy-consents/me', [PrivacyConsentController::class, 'me']);

    // Registra o actualiza el consentimiento del estudiante autenticado.
    Route::post('/privacy-consents', [PrivacyConsentController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | Emotional Catalog Routes
    |--------------------------------------------------------------------------
    | Estas rutas devuelven catálogos usados por la app móvil
    | para registrar emociones y eventos diarios.
    */

    // Lista emociones activas.
    Route::get('/emotions', [CatalogController::class, 'emotions']);

    // Lista categorías de eventos activas.
    Route::get('/event-categories', [CatalogController::class, 'eventCategories']);

    /*
    |--------------------------------------------------------------------------
    | Emotional Record Routes
    |--------------------------------------------------------------------------
    | Estas rutas permiten que un estudiante registre y consulte
    | sus registros emocionales diarios.
    */

    // Crea un nuevo registro emocional del estudiante autenticado.
    Route::post('/emotional-records', [EmotionalRecordController::class, 'store']);

    // Lista los registros emocionales del estudiante autenticado.
    Route::get('/emotional-records/me', [EmotionalRecordController::class, 'myRecords']);

    /*
    |--------------------------------------------------------------------------
    | Risk Analysis Routes
    |--------------------------------------------------------------------------
    | Esta ruta calcula un indicador básico de riesgo emocional.
    | No genera diagnósticos clínicos; solo produce señales de apoyo.
    */

    // Consulta el indicador de riesgo emocional de un estudiante asignado.
    Route::get('/tutor/students/{student}/risk-summary', [RiskAnalysisController::class, 'summary']);
    /*
    |--------------------------------------------------------------------------
    | Alert Routes
    |--------------------------------------------------------------------------
    | Estas rutas permiten generar y consultar alertas de riesgo emocional.
    | Las alertas son indicadores de apoyo, no diagnósticos clínicos.
    */

    // Genera una alerta para un estudiante asignado si el indicador es medium o high.
    Route::post('/tutor/students/{student}/alerts/generate', [AlertController::class, 'generate']);

    // Lista las alertas de los estudiantes asignados al tutor autenticado.
    Route::get('/tutor/alerts', [AlertController::class, 'index']);

    // Marca una alerta como revisada.
    Route::patch('/tutor/alerts/{alert}/review', [AlertController::class, 'review']);
    /*
    |--------------------------------------------------------------------------
    | Follow-up Routes
    |--------------------------------------------------------------------------
    | Estas rutas permiten que el tutor registre y consulte acciones
    | de seguimiento relacionadas con una alerta.
    */

    // Registra un seguimiento sobre una alerta.
    Route::post('/tutor/alerts/{alert}/followups', [FollowupController::class, 'store']);

    // Lista los seguimientos registrados sobre una alerta.
    Route::get('/tutor/alerts/{alert}/followups', [FollowupController::class, 'index']);
    /*
    |--------------------------------------------------------------------------
    | Referral Routes
    |--------------------------------------------------------------------------
    | Estas rutas permiten canalizar alertas a soporte institucional.
    */

    // El tutor crea una canalización desde una alerta.
    Route::post('/tutor/alerts/{alert}/referrals', [ReferralController::class, 'storeFromAlert']);

    // El tutor consulta las canalizaciones que ha creado.
    Route::get('/tutor/referrals', [ReferralController::class, 'tutorIndex']);

    // Soporte institucional consulta las canalizaciones asignadas.
    Route::get('/support/referrals', [ReferralController::class, 'supportIndex']);

    // Soporte institucional actualiza el estado de una canalización.
    Route::patch('/support/referrals/{referral}/status', [ReferralController::class, 'updateStatus']);
    /*
    |--------------------------------------------------------------------------
    | Admin Dashboard Routes
    |--------------------------------------------------------------------------
    | Esta ruta entrega métricas generales para el dashboard web administrativo.
    */

    // Resumen general del sistema para el administrador.
    Route::get('/admin/dashboard-summary', [AdminDashboardController::class, 'summary']);
});