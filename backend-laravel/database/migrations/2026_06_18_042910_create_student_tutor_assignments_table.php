<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_tutor_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('tutor_id')
                ->constrained('tutors')
                ->cascadeOnDelete();

            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('status', 20)->default('active');
            $table->timestamp('assigned_at')->nullable();

            $table->timestamps();

            $table->unique(['student_id', 'tutor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_tutor_assignments');
    }
};