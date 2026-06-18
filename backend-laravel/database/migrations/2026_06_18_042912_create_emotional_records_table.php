<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emotional_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('emotion_id')
                ->constrained('emotions')
                ->restrictOnDelete();

            $table->foreignId('event_category_id')
                ->nullable()
                ->constrained('event_categories')
                ->nullOnDelete();

            $table->integer('intensity_level');
            $table->text('event_description')->nullable();
            $table->text('personal_note')->nullable();
            $table->date('record_date');

            $table->timestamps();

            $table->unique(['student_id', 'record_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emotional_records');
    }
};