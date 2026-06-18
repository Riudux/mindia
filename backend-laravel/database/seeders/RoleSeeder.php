<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('roles')->upsert([
            [
                'name' => 'admin',
                'description' => 'System administrator with access to user management, assignments, reports, and general platform configuration.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'tutor',
                'description' => 'Tutor user responsible for monitoring assigned students, reviewing alerts, and registering follow-up records.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'support',
                'description' => 'Institutional support staff responsible for managing referred cases and registering support attention records.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'student',
                'description' => 'Student user who can access the mobile app, submit emotional records, and check support information.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ], ['name'], ['description', 'updated_at']);
    }
}