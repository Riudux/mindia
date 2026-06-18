<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('followups', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('tutor_id')
                ->constrained('tutors')
                ->cascadeOnDelete();

            $table->foreignId('alert_id')
                ->nullable()
                ->constrained('alerts')
                ->nullOnDelete();

            $table->string('title', 150);
            $table->text('description');

            $table->string('action_taken', 120)->nullable();
            // Example: call, meeting, observation, referral

            $table->string('status', 30)->default('open');
            // open, in_progress, closed

            $table->date('followup_date');

            $table->timestamps();

            $table->index('status');
            $table->index('followup_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('followups');
    }
};