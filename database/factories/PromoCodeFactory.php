<?php

namespace Database\Factories;

use App\Enums\DiscountType;
use App\Models\PromoCode;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PromoCode>
 */
class PromoCodeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => Str::upper(fake()->unique()->bothify('??####')),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'type' => DiscountType::Fixed,
            'value' => fake()->randomElement([10000, 20000, 50000]),
            'min_order_total' => 0,
            'max_discount_amount' => null,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(30),
            'max_uses' => fake()->optional()->numberBetween(10, 100),
            'used_count' => 0,
            'is_active' => true,
            'created_by' => User::factory()->admin(),
        ];
    }
}
