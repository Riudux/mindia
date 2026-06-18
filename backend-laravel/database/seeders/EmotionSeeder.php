<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmotionSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('emotions')->upsert([
            [
                'name' => 'Happy',
                'color' => '#22C55E',
                'icon' => 'smile',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Calm',
                'color' => '#14B8A6',
                'icon' => 'leaf',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sad',
                'color' => '#3B82F6',
                'icon' => 'cloud-rain',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Angry',
                'color' => '#EF4444',
                'icon' => 'flame',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Anxious',
                'color' => '#F59E0B',
                'icon' => 'alert-circle',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Stressed',
                'color' => '#F97316',
                'icon' => 'zap',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Tired',
                'color' => '#64748B',
                'icon' => 'moon',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Motivated',
                'color' => '#8B5CF6',
                'icon' => 'star',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ], ['name'], ['color', 'icon', 'is_active', 'updated_at']);
    }
}