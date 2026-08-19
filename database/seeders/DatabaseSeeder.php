<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        User::updateOrCreate(
            ['email' => 'admin@biwrawater.test'],
            [
                'name' => 'Admin Biwrawater',
                'phone' => '081234567890',
                'role' => UserRole::Admin,
            ],
        );

        User::updateOrCreate(
            ['email' => 'customer@biwrawater.test'],
            [
                'name' => 'Customer Demo',
                'phone' => '081298765432',
            ],
        );

        $driverUser = User::updateOrCreate(
            ['email' => 'driver@biwrawater.test'],
            [
                'name' => 'Driver Demo',
                'phone' => '081234567891',
                'role' => UserRole::Driver,
            ],
        );

        Driver::updateOrCreate(
            ['user_id' => $driverUser->id],
            ['license_number' => '610110018253'],
        );

        $this->call([
            ServiceSeeder::class,
            TruckSeeder::class,
        ]);
    }
}
