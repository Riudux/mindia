<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EventCategorySeeder extends Seeder
{
    public function run(): void
    {
        DB::table('event_categories')->upsert([
            [
                'name' => 'Academic',
                'description' => 'Events related to school, classes, exams, homework, grades, or academic pressure.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Family',
                'description' => 'Events related to family situations or home environment.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Social',
                'description' => 'Events related to friends, classmates, relationships, or social interactions.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Health',
                'description' => 'Events related to physical health, tiredness, illness, or general well-being.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Personal',
                'description' => 'Personal situations, thoughts, decisions, or individual concerns.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Economic',
                'description' => 'Events related to money, work, transportation, or financial concerns.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Other',
                'description' => 'Any event that does not fit into the previous categories.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ], ['name'], ['description', 'is_active', 'updated_at']);
    }
}