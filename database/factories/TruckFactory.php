<?php

namespace Database\Factories;

use App\Enums\TruckStatus;
use App\Models\Truck;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Truck>
 */
class TruckFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'plate_number' => strtoupper(fake()->unique()->bothify('BK #### ??')),
            'name' => 'Tangki '.fake()->numberBetween(1, 9),
            'capacity_liters' => fake()->randomElement([5000, 8000, 11000]),
            'status' => TruckStatus::Available,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Indicate that the truck is under maintenance.
     */
    public function maintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TruckStatus::Maintenance,
        ]);
    }
}
