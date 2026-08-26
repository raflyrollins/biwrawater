<?php

namespace Database\Factories;

use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Zone>
 */
class ZoneFactory extends Factory
{
    protected $model = Zone::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->city().' Zona',
            'slug' => fake()->unique()->slug(2),
            'is_within_area' => true,
            'delivery_fee' => fake()->numberBetween(0, 50000),
            'is_active' => true,
        ];
    }
}
