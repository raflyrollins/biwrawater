<?php

namespace Database\Factories;

use App\Enums\DeliveryStatus;
use App\Models\Delivery;
use App\Models\Driver;
use App\Models\Order;
use App\Models\Truck;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Delivery>
 */
class DeliveryFactory extends Factory
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
            'truck_id' => Truck::factory(),
            'driver_id' => Driver::factory(),
            'status' => DeliveryStatus::Scheduled,
            'scheduled_at' => fake()->dateTimeBetween('+1 hour', '+2 days'),
            'departed_at' => null,
            'delivered_at' => null,
            'note' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Indicate that the delivery has been completed.
     */
    public function delivered(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => DeliveryStatus::Delivered,
            'departed_at' => now()->subHours(2),
            'delivered_at' => now(),
        ]);
    }
}
