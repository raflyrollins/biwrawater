<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = 'Tangki '.fake()->numberBetween(5000, 11000).' Liter';

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'volume_liters' => fake()->randomElement([5000, 8000, 11000]),
            'price' => fake()->randomElement([120000, 150000, 200000]),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
