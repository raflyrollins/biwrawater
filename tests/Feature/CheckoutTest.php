<?php

use App\Enums\DiscountType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Address;
use App\Models\PromoCode;
use App\Models\Promotion;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\OperatingHoursSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Carbon::setTestNow(Carbon::parse('2026-08-26 10:00:00', 'Asia/Jakarta'));
    $this->seed(OperatingHoursSeeder::class);
});

afterEach(fn () => Carbon::setTestNow());

test('tamu diarahkan ke login saat membuka halaman pesan', function () {
    $this->get(route('checkout.index'))->assertRedirect(route('login'));
});

test('pelanggan membuat pesanan dengan alamat tersimpan', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create(['price' => 200000]);
    $address = Address::factory()->for($user)->create();

    $this->actingAs($user)
        ->post(route('checkout.store'), [
            'service_id' => $service->id,
            'address_id' => $address->id,
        ])
        ->assertRedirect();

    $order = $user->orders()->first();

    expect($order)->not->toBeNull()
        ->and($order->status)->toBe(OrderStatus::Pending)
        ->and($order->payment_method)->toBe(PaymentMethod::Midtrans)
        ->and($order->payment_status)->toBe(PaymentStatus::Unpaid)
        ->and($order->subtotal)->toBe(200000)
        ->and($order->grand_total)->toBe(200000)
        ->and($order->address_snapshot['street_address'])->toBe($address->street_address)
        ->and($order->items)->toHaveCount(1)
        ->and($order->items->first()->service_name)->toBe($service->name)
        ->and($order->items->first()->quantity)->toBe(1)
        ->and($order->items->first()->line_total)->toBe(200000);
});

test('pelanggan membuat pesanan dengan alamat baru', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create();

    $this->actingAs($user)
        ->post(route('checkout.store'), [
            'service_id' => $service->id,
            'label' => 'Rumah',
            'recipient_name' => 'Budi',
            'phone' => '081234567890',
            'street_address' => 'Jl. Marelan Raya No. 1',
            'district' => 'Medan Marelan',
            'subdistrict' => 'Marelan',
            'city' => 'Medan',
            'postal_code' => '20256',
        ])
        ->assertRedirect();

    expect($user->addresses)->toHaveCount(1)
        ->and($user->addresses->first()->is_default)->toBeTrue()
        ->and($user->orders)->toHaveCount(1);
});

test('kode promo diterapkan dan diskon dihitung', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create(['price' => 200000]);
    $address = Address::factory()->for($user)->create();
    $promo = PromoCode::factory()->create([
        'type' => DiscountType::Percentage,
        'value' => 10,
    ]);

    $this->actingAs($user)
        ->post(route('checkout.store'), [
            'service_id' => $service->id,
            'address_id' => $address->id,
            'promo_code' => $promo->code,
        ])
        ->assertRedirect();

    $order = $user->orders()->first();

    expect($order->discount_total)->toBe(20000)
        ->and($order->grand_total)->toBe(180000)
        ->and($order->discount_snapshot[0]['type'])->toBe('promo_code')
        ->and($promo->refresh()->used_count)->toBe(1);
});

test('kode promo tidak valid ditolak', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create();
    $address = Address::factory()->for($user)->create();

    $this->actingAs($user)
        ->post(route('checkout.store'), [
            'service_id' => $service->id,
            'address_id' => $address->id,
            'promo_code' => 'TIDAKADA',
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('promo_code');

    expect($user->orders()->count())->toBe(0);
});

test('promosi otomatis diterapkan saat memenuhi minimal pembelian', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create(['price' => 200000]);
    $address = Address::factory()->for($user)->create();
    Promotion::factory()->create([
        'type' => DiscountType::Percentage,
        'value' => 15,
        'min_order_total' => 100000,
    ]);

    $this->actingAs($user)
        ->post(route('checkout.store'), [
            'service_id' => $service->id,
            'address_id' => $address->id,
        ])
        ->assertRedirect();

    $order = $user->orders()->first();

    expect($order->discount_total)->toBe(30000)
        ->and($order->grand_total)->toBe(170000)
        ->and($order->discount_snapshot[0]['type'])->toBe('promotion');
});

test('alamat milik orang lain ditolak saat checkout', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $service = Service::factory()->create();
    $address = Address::factory()->for($other)->create();

    $this->actingAs($user)
        ->post(route('checkout.store'), [
            'service_id' => $service->id,
            'address_id' => $address->id,
        ])
        ->assertNotFound();
});

test('cek kupon valid mengembalikan pratinjau diskon tanpa mencatat pemakaian', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create(['price' => 200000]);
    $promo = PromoCode::factory()->create([
        'type' => DiscountType::Percentage,
        'value' => 10,
    ]);

    $this->actingAs($user)
        ->post(route('checkout.promo'), [
            'service_id' => $service->id,
            'promo_code' => strtolower($promo->code),
        ])
        ->assertRedirect()
        ->assertSessionHas('promo_preview', function (array $preview) use ($promo) {
            expect($preview['code'])->toBe($promo->code)
                ->and($preview['discount_total'])->toBe(20000);

            return true;
        });

    expect($promo->refresh()->used_count)->toBe(0)
        ->and($user->orders()->count())->toBe(0);
});

test('cek kupon tidak valid menampilkan pesan error', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create();

    $this->actingAs($user)
        ->post(route('checkout.promo'), [
            'service_id' => $service->id,
            'promo_code' => 'TIDAKADA',
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('promo_code');
});

test('cek kupon di bawah minimal pembelian ditolak', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create(['price' => 200000]);
    $promo = PromoCode::factory()->create([
        'type' => DiscountType::Fixed,
        'value' => 25000,
        'min_order_total' => 500000,
    ]);

    $this->actingAs($user)
        ->post(route('checkout.promo'), [
            'service_id' => $service->id,
            'promo_code' => $promo->code,
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('promo_code');
});
