<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_attentions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('referral_id')
                ->constrained('referrals')
                ->cascadeOnDelete();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('support_staff_id')
                ->constrained('support_staff')
                ->cascadeOnDelete();

            $table->string('attention_type', 50);
            // first_attention, followup, review, closure

            $table->string('modality', 30)->default('in_person');
            // in_person, virtual, phone

            $table->text('description');

            $table->string('agreement', 150)->nullable();
            // Example: schedule_followup, keep_observation, close_case

            $table->string('case_status', 30)->default('in_attention');
            // in_attention, scheduled, closed

            $table->date('attention_date');

            $table->timestamps();

            $table->index('attention_type');
            $table->index('case_status');
            $table->index('attention_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_attentions');
    }
};