<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'method' => PaymentMethod::Cod,
            'amount' => fake()->randomElement([120000, 150000, 200000]),
            'status' => PaymentStatus::Unpaid,
            'reference' => null,
            'paid_at' => null,
            'note' => fake()->optional()->sentence(),
        ];
    }
}
