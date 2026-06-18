<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('title', 150);
            $table->text('message');

            $table->string('type', 50)->default('system');
            // alert, appointment, referral, support_attention, system

            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();

            $table->json('data')->nullable();
            // Optional extra data, for example alert_id, referral_id, appointment_id

            $table->timestamps();

            $table->index('type');
            $table->index('is_read');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};