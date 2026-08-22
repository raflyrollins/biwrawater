<?php

namespace Database\Seeders;

use App\Enums\DayOfWeek;
use App\Models\OperatingHour;
use Illuminate\Database\Seeder;

class OperatingHoursSeeder extends Seeder
{
    /**
     * Jam operasional awal: Senin-Sabtu 08:00-17:00, Minggu tutup.
     */
    public function run(): void
    {
        foreach (DayOfWeek::cases() as $day) {
            $isClosed = $day === DayOfWeek::Sunday;

            OperatingHour::query()->updateOrCreate(
                ['day_of_week' => $day->value],
                [
                    'is_closed' => $isClosed,
                    'opens_at' => $isClosed ? null : '08:00:00',
                    'closes_at' => $isClosed ? null : '17:00:00',
                ],
            );
        }
    }
}
