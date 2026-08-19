<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
class AddressFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => fake()->randomElement(['Rumah', 'Kantor']),
            'recipient_name' => fake()->name(),
            'phone' => fake()->numerify('08##########'),
            'street_address' => fake()->streetAddress(),
            'district' => 'Medan Marelan',
            'subdistrict' => 'Marelan',
            'city' => 'Medan',
            'postal_code' => fake()->numerify('20###'),
            'notes' => fake()->optional()->sentence(),
            'is_default' => false,
        ];
    }
}
