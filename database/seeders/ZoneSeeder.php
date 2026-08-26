<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Zone;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ZoneSeeder extends Seeder
{
    public function run(): void
    {
        $zones = [
            // Dalam area (gratis ongkir) — Medan Marelan
            ['kecamatan' => 'Medan Marelan', 'kelurahan' => 'Tanah Enam Ratus', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],
            ['kecamatan' => 'Medan Marelan', 'kelurahan' => 'Paya Pasir', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],
            ['kecamatan' => 'Medan Marelan', 'kelurahan' => 'Serdang', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],
            ['kecamatan' => 'Medan Marelan', 'kelurahan' => 'Terjun', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],
            ['kecamatan' => 'Medan Marelan', 'kelurahan' => 'Labuhan Deli', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],

            // Dalam area (gratis ongkir) — Medan Helvetia
            ['kecamatan' => 'Medan Helvetia', 'kelurahan' => 'Helvetia', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],
            ['kecamatan' => 'Medan Helvetia', 'kelurahan' => 'Helvetia Tengah', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],
            ['kecamatan' => 'Medan Helvetia', 'kelurahan' => 'Helvetia Timur', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],
            ['kecamatan' => 'Medan Helvetia', 'kelurahan' => 'Simpang Selayang', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],

            // Dalam area (gratis ongkir) — Medan Barat
            ['kecamatan' => 'Medan Barat', 'kelurahan' => 'Glugur Kota', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],
            ['kecamatan' => 'Medan Barat', 'kelurahan' => 'Pulo Brayan Kota', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],
            ['kecamatan' => 'Medan Barat', 'kelurahan' => 'Sei Agul', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],
            ['kecamatan' => 'Medan Barat', 'kelurahan' => 'Karang Berombak', 'city' => 'Medan', 'is_within_area' => true, 'delivery_fee' => 0],

            // Luar area (bayar ongkir Rp 15.000) — Medan Timur
            ['kecamatan' => 'Medan Timur', 'kelurahan' => 'Perintis', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 15000],
            ['kecamatan' => 'Medan Timur', 'kelurahan' => 'P. Brayan Bengkel', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 15000],
            ['kecamatan' => 'Medan Timur', 'kelurahan' => 'Sidodadi', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 15000],
            ['kecamatan' => 'Medan Timur', 'kelurahan' => 'Sumber Rejo', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 15000],

            // Luar area (bayar ongkir Rp 15.000) — Medan Deli
            ['kecamatan' => 'Medan Deli', 'kelurahan' => 'Tanjung Mulia', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 15000],
            ['kecamatan' => 'Medan Deli', 'kelurahan' => 'Tanjung Muda', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 15000],
            ['kecamatan' => 'Medan Deli', 'kelurahan' => 'Mabar Hilir', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 15000],
            ['kecamatan' => 'Medan Deli', 'kelurahan' => 'Kota Besi', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 15000],

            // Luar area (bayar ongkir Rp 20.000) — Medan Kota
            ['kecamatan' => 'Medan Kota', 'kelurahan' => 'Kesawan', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 20000],
            ['kecamatan' => 'Medan Kota', 'kelurahan' => 'Pusat Pasar', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 20000],
            ['kecamatan' => 'Medan Kota', 'kelurahan' => 'Titipapan', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 20000],
            ['kecamatan' => 'Medan Kota', 'kelurahan' => 'Tegal Rejo', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 20000],

            // Luar area (bayar ongkir Rp 25.000) — Medan Sunggal
            ['kecamatan' => 'Medan Sunggal', 'kelurahan' => 'Sunggal', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 25000],
            ['kecamatan' => 'Medan Sunggal', 'kelurahan' => 'Sei Sikambing', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 25000],
            ['kecamatan' => 'Medan Sunggal', 'kelurahan' => 'Petisah Tengah', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 25000],
            ['kecamatan' => 'Medan Sunggal', 'kelurahan' => 'Babura', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 25000],

            // Luar area (bayar ongkir Rp 30.000) — Medan Johor
            ['kecamatan' => 'Medan Johor', 'kelurahan' => 'Johor', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 30000],
            ['kecamatan' => 'Medan Johor', 'kelurahan' => 'Kedai Durian', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 30000],
            ['kecamatan' => 'Medan Johor', 'kelurahan' => 'Simpang Selayang', 'city' => 'Medan', 'is_within_area' => false, 'delivery_fee' => 30000],

            // Luar kota Medan — Binjai
            ['kecamatan' => 'Binjai Kota', 'kelurahan' => 'Tanjung Rejo', 'city' => 'Binjai', 'is_within_area' => false, 'delivery_fee' => 50000],
            ['kecamatan' => 'Binjai Kota', 'kelurahan' => 'Pahlawan', 'city' => 'Binjai', 'is_within_area' => false, 'delivery_fee' => 50000],
            ['kecamatan' => 'Binjai Kota', 'kelurahan' => 'Jati Negara', 'city' => 'Binjai', 'is_within_area' => false, 'delivery_fee' => 50000],
        ];

        foreach ($zones as $zone) {
            $name = $zone['kelurahan'].', '.$zone['kecamatan'];
            $slug = Str::slug($name);

            Zone::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'kecamatan' => $zone['kecamatan'],
                    'kelurahan' => $zone['kelurahan'],
                    'city' => $zone['city'],
                    'is_within_area' => $zone['is_within_area'],
                    'delivery_fee' => $zone['delivery_fee'],
                    'is_active' => true,
                ],
            );
        }
    }
}
