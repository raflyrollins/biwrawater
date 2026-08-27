<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        $admin = User::updateOrCreate(
            ['email' => 'admin@biwrawater.test'],
            [
                'name' => 'Admin Biwrawater',
                'phone' => '081234567890',
                'role' => UserRole::Admin,
                'password' => Hash::make('password'),
            ],
        );
        $admin->assignRole(RoleEnum::Admin);

        $this->call(DemoSeeder::class);
    }
}
