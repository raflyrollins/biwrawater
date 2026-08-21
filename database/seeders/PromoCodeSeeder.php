<?php

namespace Database\Seeders;

use App\Enums\DiscountType;
use App\Models\PromoCode;
use App\Models\User;
use Illuminate\Database\Seeder;

class PromoCodeSeeder extends Seeder
{
    /**
     * Isi kode promo demo yang siap dipakai di halaman checkout.
     */
    public function run(): void
    {
        $adminId = User::query()->where('email', 'admin@biwrawater.test')->value('id');

        PromoCode::updateOrCreate(
            ['code' => 'BWR10'],
            [
                'name' => 'Diskon 10%',
                'description' => 'Potongan 10% untuk semua varian tangki, maksimal Rp 25.000.',
                'type' => DiscountType::Percentage,
                'value' => 10,
                'min_order_total' => 0,
                'max_discount_amount' => 25000,
                'is_active' => true,
                'created_by' => $adminId,
            ],
        );

        PromoCode::updateOrCreate(
            ['code' => 'HEMAT15K'],
            [
                'name' => 'Potongan Rp 15.000',
                'description' => 'Potongan langsung Rp 15.000 dengan minimal pembelian Rp 100.000.',
                'type' => DiscountType::Fixed,
                'value' => 15000,
                'min_order_total' => 100000,
                'is_active' => true,
                'created_by' => $adminId,
            ],
        );
    }
}
