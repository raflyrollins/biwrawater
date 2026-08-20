<?php

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Enums\UserRole;
use App\Models\Driver;
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

        $customer = User::updateOrCreate(
            ['email' => 'customer@biwrawater.test'],
            [
                'name' => 'Customer Demo',
                'phone' => '081298765432',
                'password' => Hash::make('password'),
            ],
        );
        $customer->assignRole(RoleEnum::Customer);

        $driverUser = User::updateOrCreate(
            ['email' => 'driver@biwrawater.test'],
            [
                'name' => 'Driver Demo',
                'phone' => '081234567891',
                'role' => UserRole::Driver,
                'password' => Hash::make('password'),
            ],
        );
        $driverUser->assignRole(RoleEnum::Driver);

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
