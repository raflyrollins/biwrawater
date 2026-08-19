<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Seed the application's services.
     */
    public function run(): void
    {
        $services = [
            [
                'name' => 'Tangki 5.000 Liter',
                'slug' => 'tangki-5000-liter',
                'description' => 'Pengisian air tangki bersih 5.000 liter untuk kebutuhan rumah tangga dan usaha kecil.',
                'volume_liters' => 5000,
                'price' => 150000,
                'sort_order' => 1,
            ],
            [
                'name' => 'Tangki 8.000 Liter',
                'slug' => 'tangki-8000-liter',
                'description' => 'Pengisian air tangki bersih 8.000 liter, pilihan paling populer untuk rumah tangga.',
                'volume_liters' => 8000,
                'price' => 200000,
                'sort_order' => 2,
            ],
            [
                'name' => 'Tangki 11.000 Liter',
                'slug' => 'tangki-11000-liter',
                'description' => 'Pengisian air tangki bersih 11.000 liter untuk kebutuhan besar seperti kos, kantor, dan usaha.',
                'volume_liters' => 11000,
                'price' => 260000,
                'sort_order' => 3,
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(
                ['slug' => $service['slug']],
                $service,
            );
        }
    }
}
