<?php

use App\Enums\DiscountType;
use App\Models\Promotion;
use App\Models\Service;
use App\Models\Zone;
use Database\Seeders\OperatingHoursSeeder;
use Illuminate\Support\Carbon;

beforeEach(function (): void {
    Carbon::setTestNow(Carbon::parse('2026-08-26 10:00:00', 'Asia/Jakarta'));
    $this->seed(OperatingHoursSeeder::class);
});

afterEach(fn () => Carbon::setTestNow());

test('layanan yang aktif ditampilkan', function () {
    $active = Service::factory()->create(['is_active' => true, 'sort_order' => 1]);
    Service::factory()->create(['is_active' => false]);

    $this->getJson('/api/v1/services')
        ->assertOk()
        ->assertJsonCount(1, 'services')
        ->assertJsonPath('services.0.id', $active->id)
        ->assertJsonPath('services.0.price', $active->price)
        ->assertJsonPath('services.0.volume_liters', $active->volume_liters);
});

test('promosi yang aktif ditampilkan', function () {
    Promotion::factory()->create([
        'type' => DiscountType::Percentage,
        'value' => 15,
    ]);
    Promotion::factory()->create(['is_active' => false]);

    $this->getJson('/api/v1/promotions')
        ->assertOk()
        ->assertJsonCount(1, 'promotions')
        ->assertJsonPath('promotions.0.type', DiscountType::Percentage->value);
});

test('config berisi status buka, jam operasional, dan hari libur', function () {
    $this->getJson('/api/v1/config')
        ->assertOk()
        ->assertJsonStructure([
            'schedule_status' => ['is_open', 'message'],
            'operating_hours',
            'holidays',
        ])
        ->assertJsonPath('schedule_status.is_open', true);
});

test('zona aktif ditampilkan', function () {
    Zone::query()->delete();

    $zone = Zone::factory()->create([
        'is_active' => true,
        'delivery_fee' => 15000,
    ]);
    Zone::factory()->create(['is_active' => false]);

    $this->getJson('/api/v1/zones')
        ->assertOk()
        ->assertJsonCount(1, 'zones')
        ->assertJsonPath('zones.0.id', $zone->id)
        ->assertJsonPath('zones.0.delivery_fee', 15000);
});

test('lookup zona ditemukan berdasarkan kecamatan dan kelurahan', function () {
    $zone = Zone::factory()->create([
        'kecamatan' => 'Medan Marelan',
        'kelurahan' => 'Marelan',
        'city' => 'Medan',
        'delivery_fee' => 20000,
        'is_active' => true,
    ]);

    $this->postJson('/api/v1/zones/lookup', [
        'kecamatan' => 'Medan Marelan',
        'kelurahan' => 'Marelan',
    ])
        ->assertOk()
        ->assertJsonPath('found', true)
        ->assertJsonPath('zone.id', $zone->id)
        ->assertJsonPath('zone.delivery_fee', 20000);
});

test('lookup zona tidak ditemukan mengembalikan 404', function () {
    $this->postJson('/api/v1/zones/lookup', [
        'kecamatan' => 'Tidak Ada',
        'kelurahan' => 'Tidak Ada',
    ])
        ->assertNotFound()
        ->assertJsonPath('found', false);
});

test('pencarian area mengembalikan kecamatan yang cocok', function () {
    Zone::factory()->create([
        'kecamatan' => 'Medan Marelan',
        'kelurahan' => 'Marelan',
        'city' => 'Medan',
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/areas/search?q=marelan')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.kecamatan', 'Medan Marelan')
        ->assertJsonPath('0.kelurahan', 'Marelan');
});

test('pencarian area kosong mengembalikan daftar kosong', function () {
    $this->getJson('/api/v1/areas/search?q=')
        ->assertOk()
        ->assertExactJson([]);
});
