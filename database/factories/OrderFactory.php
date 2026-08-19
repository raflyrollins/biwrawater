<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomElement([120000, 150000, 200000, 300000]);

        return [
            'order_number' => Order::generateOrderNumber(),
            'user_id' => User::factory(),
            'address_id' => null,
            'address_snapshot' => [
                'recipient_name' => fake()->name(),
                'phone' => fake()->numerify('08##########'),
                'street_address' => fake()->streetAddress(),
                'district' => 'Medan Marelan',
                'subdistrict' => 'Marelan',
                'city' => 'Medan',
                'postal_code' => '20256',
            ],
            'status' => OrderStatus::Pending,
            'payment_method' => PaymentMethod::Cod,
            'payment_status' => PaymentStatus::Unpaid,
            'subtotal' => $subtotal,
            'discount_total' => 0,
            'grand_total' => $subtotal,
            'discount_snapshot' => null,
            'customer_note' => fake()->optional()->sentence(),
        ];
    }
}
