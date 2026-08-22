<?php

namespace Database\Factories;

use App\Enums\DayOfWeek;
use App\Models\OperatingHour;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OperatingHour>
 */
class OperatingHourFactory extends Factory
{
    protected $model = OperatingHour::class;

    public function definition(): array
    {
        return [
            'day_of_week' => DayOfWeek::Monday,
            'is_closed' => false,
            'opens_at' => '08:00:00',
            'closes_at' => '17:00:00',
        ];
    }
}
