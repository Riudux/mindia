<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('tutor_id')
                ->nullable()
                ->constrained('tutors')
                ->nullOnDelete();

            $table->foreignId('alert_id')
                ->nullable()
                ->constrained('alerts')
                ->nullOnDelete();

            $table->foreignId('referred_to')
                ->nullable()
                ->constrained('support_staff')
                ->nullOnDelete();

            $table->text('reason');

            $table->string('priority', 20)->default('medium');
            // low, medium, high

            $table->string('status', 30)->default('pending');
            // pending, in_attention, scheduled, closed

            $table->date('referral_date');

            $table->timestamps();

            $table->index('priority');
            $table->index('status');
            $table->index('referral_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};