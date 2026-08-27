<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\Truck;
use Illuminate\Database\Seeder;

class TruckSeeder extends Seeder
{
    /**
     * Seed the application's trucks.
     */
    public function run(): void
    {
        $driverMap = [
            'BK 1234 AB' => 'driver@biwrawater.test',
            'BK 5678 CD' => 'andi@biwrawater.test',
            'BK 9012 EF' => 'rina@biwrawater.test',
        ];

        $trucks = [
            [
                'plate_number' => 'BK 1234 AB',
                'name' => 'Tangki 1',
                'capacity_liters' => 8000,
                'notes' => 'Tangki utama pengiriman Marelan.',
            ],
            [
                'plate_number' => 'BK 5678 CD',
                'name' => 'Tangki 2',
                'capacity_liters' => 5000,
                'notes' => 'Tangki cadangan untuk pesanan kecil.',
            ],
            [
                'plate_number' => 'BK 9012 EF',
                'name' => 'Tangki 3',
                'capacity_liters' => 11000,
                'notes' => 'Tangki besar untuk kebutuhan usaha.',
            ],
        ];

        foreach ($trucks as $truck) {
            $driverEmail = $driverMap[$truck['plate_number']];
            $driverId = Driver::whereHas('user', fn ($q) => $q->where('email', $driverEmail))->value('id');

            Truck::updateOrCreate(
                ['plate_number' => $truck['plate_number']],
                array_merge($truck, ['default_driver_id' => $driverId]),
            );
        }
    }
}
