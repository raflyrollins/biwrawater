<?php

namespace Database\Seeders;

use App\Models\Truck;
use Illuminate\Database\Seeder;

class TruckSeeder extends Seeder
{
    /**
     * Seed the application's trucks.
     */
    public function run(): void
    {
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
            Truck::updateOrCreate(
                ['plate_number' => $truck['plate_number']],
                $truck,
            );
        }
    }
}
