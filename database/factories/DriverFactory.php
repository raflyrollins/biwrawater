<?php

namespace Database\Factories;

use App\Enums\DriverStatus;
use App\Enums\UserRole;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Driver>
 */
class DriverFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->create([
                'role' => UserRole::Driver,
            ]),
            'license_number' => strtoupper(fake()->unique()->bothify('##########')),
            'status' => DriverStatus::Available,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
