<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('tutor_id')
                ->nullable()
                ->constrained('tutors')
                ->nullOnDelete();

            $table->foreignId('support_staff_id')
                ->nullable()
                ->constrained('support_staff')
                ->nullOnDelete();

            $table->foreignId('referral_id')
                ->nullable()
                ->constrained('referrals')
                ->nullOnDelete();

            $table->foreignId('requested_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->date('appointment_date');
            $table->time('start_time');
            $table->time('end_time')->nullable();

            $table->string('modality', 30)->default('in_person');
            // in_person, virtual, phone

            $table->text('reason')->nullable();

            $table->string('status', 30)->default('pending');
            // pending, confirmed, rescheduled, completed, cancelled

            $table->timestamps();

            $table->index('appointment_date');
            $table->index('status');
            $table->index('modality');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};