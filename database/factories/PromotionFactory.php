<?php

namespace Database\Factories;

use App\Enums\DiscountType;
use App\Models\Promotion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Promotion>
 */
class PromotionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'type' => DiscountType::Percentage,
            'value' => fake()->randomElement([5, 10, 15, 20]),
            'min_order_total' => 0,
            'max_discount_amount' => null,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(7),
            'is_active' => true,
            'created_by' => User::factory()->admin(),
        ];
    }
}
