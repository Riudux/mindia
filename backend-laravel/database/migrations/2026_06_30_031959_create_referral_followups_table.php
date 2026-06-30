<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| Migration: referral_followups
|--------------------------------------------------------------------------
|
| Esta tabla registra las atenciones realizadas por el personal de apoyo
| sobre un caso canalizado.
|
| Importante:
| No guarda diagnósticos clínicos. Solo registra seguimiento institucional.
|
*/
return new class extends Migration
{
    /*
     * Crea la tabla referral_followups.
     */
    public function up(): void
    {
        Schema::create('referral_followups', function (Blueprint $table) {
            $table->id();

            /*
             * Canalización relacionada.
             */
            $table->foreignId('referral_id')
                ->constrained('referrals')
                ->cascadeOnDelete();

            /*
             * Personal de apoyo que registra la atención.
             */
            $table->foreignId('support_staff_id')
                ->constrained('support_staff')
                ->cascadeOnDelete();

            /*
             * Tipo de atención realizada.
             * Ejemplos:
             * - orientation
             * - interview
             * - follow_up
             * - internal_referral
             */
            $table->string('attention_type', 100);

            /*
             * Notas descriptivas del seguimiento.
             */
            $table->text('notes');

            /*
             * Resultado o conclusión institucional del seguimiento.
             */
            $table->text('result')->nullable();

            /*
             * Estado del registro de atención.
             */
            $table->string('status', 50)->default('registered');

            /*
             * Fecha y hora en la que se realizó la atención.
             */
            $table->timestamp('attended_at')->nullable();

            $table->timestamps();
        });
    }

    /*
     * Elimina la tabla referral_followups.
     */
    public function down(): void
    {
        Schema::dropIfExists('referral_followups');
    }
};