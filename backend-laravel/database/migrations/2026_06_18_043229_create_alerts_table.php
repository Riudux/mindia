<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('emotional_record_id')
                ->nullable()
                ->constrained('emotional_records')
                ->nullOnDelete();

            $table->string('risk_level', 20); 
            // low, medium, high

            $table->string('title', 150);

            $table->text('general_reason');
            // Important: this should be an indicator, not a diagnosis.

            $table->string('status', 30)->default('pending');
            // pending, reviewed, in_followup, referred, closed

            $table->string('generated_by', 30)->default('system');
            // system, tutor, admin

            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            $table->index('risk_level');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};