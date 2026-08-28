<?php

use App\Enums\DiscountType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Address;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PromoCode;
use App\Models\Service;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\OperatingHoursSeeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    Carbon::setTestNow(Carbon::parse('2026-08-26 10:00:00', 'Asia/Jakarta'));
    $this->seed(OperatingHoursSeeder::class);
});

afterEach(fn () => Carbon::setTestNow());

test('checkout membutuhkan autentikasi', function () {
    $this->postJson('/api/v1/checkout', ['service_id' => 1])->assertStatus(401);
});

test('order saya ditolak tanpa token', function () {
    $this->getJson('/api/v1/orders')->assertStatus(401);
});

test('pelanggan membuat pesanan dengan alamat tersimpan', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create(['price' => 200000]);
    $zone = Zone::factory()->create(['delivery_fee' => 0]);
    $address = Address::factory()->for($user)->for($zone)->create();

    $this->withToken(apiTokenFor($user))
        ->postJson('/api/v1/checkout', [
            'service_id' => $service->id,
            'address_id' => $address->id,
        ])
        ->assertCreated()
        ->assertJsonPath('order.status', OrderStatus::Pending->value)
        ->assertJsonPath('order.subtotal', 200000)
        ->assertJsonPath('order.grand_total', 200000)
        ->assertJsonPath('order.items.0.service_name', $service->name)
        ->assertJsonPath('order.address.street_address', $address->street_address);

    $order = $user->orders()->first();

    expect($order)->not->toBeNull()
        ->and($order->payment_method)->toBe(PaymentMethod::Midtrans)
        ->and($order->payment_status)->toBe(PaymentStatus::Unpaid);
});

test('pelanggan membuat pesanan dengan alamat baru', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create();
    $zone = Zone::factory()->create(['delivery_fee' => 0]);

    $this->withToken(apiTokenFor($user))
        ->postJson('/api/v1/checkout', [
            'service_id' => $service->id,
            'label' => 'Rumah',
            'recipient_name' => 'Budi',
            'phone' => '081234567890',
            'street_address' => 'Jl. Marelan Raya No. 1',
            'district' => 'Medan Marelan',
            'subdistrict' => 'Marelan',
            'city' => 'Medan',
            'postal_code' => '20256',
            'zone_id' => $zone->id,
        ])
        ->assertCreated();

    expect($user->addresses)->toHaveCount(1)
        ->and($user->addresses->first()->is_default)->toBeTrue()
        ->and($user->orders)->toHaveCount(1);
});

test('kode promo diterapkan saat checkout', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create(['price' => 200000]);
    $zone = Zone::factory()->create(['delivery_fee' => 0]);
    $address = Address::factory()->for($user)->for($zone)->create();
    $promo = PromoCode::factory()->create([
        'type' => DiscountType::Percentage,
        'value' => 10,
    ]);

    $this->withToken(apiTokenFor($user))
        ->postJson('/api/v1/checkout', [
            'service_id' => $service->id,
            'address_id' => $address->id,
            'promo_code' => $promo->code,
        ])
        ->assertCreated()
        ->assertJsonPath('order.discount_total', 20000)
        ->assertJsonPath('order.grand_total', 180000);

    expect($promo->refresh()->used_count)->toBe(1);
});

test('validasi kode promo mengembalikan pratinjau diskon', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create(['price' => 200000]);
    $promo = PromoCode::factory()->create([
        'type' => DiscountType::Percentage,
        'value' => 10,
    ]);

    $this->withToken(apiTokenFor($user))
        ->postJson('/api/v1/checkout/validate-promo', [
            'service_id' => $service->id,
            'promo_code' => $promo->code,
        ])
        ->assertOk()
        ->assertJsonPath('preview.code', $promo->code)
        ->assertJsonPath('preview.discount_total', 20000);

    expect($promo->refresh()->used_count)->toBe(0);
});

test('validasi kode promo tidak valid ditolak', function () {
    $user = User::factory()->create();
    $service = Service::factory()->create();

    $this->withToken(apiTokenFor($user))
        ->postJson('/api/v1/checkout/validate-promo', [
            'service_id' => $service->id,
            'promo_code' => 'TIDAKADA',
        ])
        ->assertStatus(422);
});

test('alamat milik orang lain ditolak saat checkout', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $service = Service::factory()->create();
    $address = Address::factory()->for($other)->create();

    $this->withToken(apiTokenFor($user))
        ->postJson('/api/v1/checkout', [
            'service_id' => $service->id,
            'address_id' => $address->id,
        ])
        ->assertNotFound();
});

test('daftar order hanya menampilkan pesanan saya', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $mine = Order::factory()->for($user)->create();
    Order::factory()->for($other)->create();

    $this->withToken(apiTokenFor($user))
        ->getJson('/api/v1/orders')
        ->assertOk()
        ->assertJsonCount(1, 'orders')
        ->assertJsonPath('orders.0.uuid', $mine->uuid);

    $this->withToken(apiTokenFor($user))
        ->getJson("/api/v1/orders/{$mine->uuid}")
        ->assertOk()
        ->assertJsonPath('order.order_number', $mine->order_number);
});

test('order milik pengguna lain tidak dapat diakses', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $order = Order::factory()->for($owner)->create();

    $this->withToken(apiTokenFor($intruder))
        ->getJson("/api/v1/orders/{$order->uuid}")
        ->assertNotFound();
});

test('pelanggan dapat membatalkan pesanan yang masih menunggu', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create(['status' => OrderStatus::Pending]);

    $this->withToken(apiTokenFor($user))
        ->postJson("/api/v1/orders/{$order->uuid}/cancel")
        ->assertOk()
        ->assertJsonPath('order.status', OrderStatus::Cancelled->value);
});

test('pesanan terkonfirmasi tidak dapat dibatalkan', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create(['status' => OrderStatus::Confirmed]);

    $this->withToken(apiTokenFor($user))
        ->postJson("/api/v1/orders/{$order->uuid}/cancel")
        ->assertStatus(422);
});

test('pelanggan mendapatkan token snap Midtrans untuk pesanan dikonfirmasi', function () {
    Http::fake([
        'app.sandbox.midtrans.com/*' => Http::response(['token' => 'snap-token-123']),
    ]);

    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create([
        'status' => OrderStatus::Confirmed,
        'payment_method' => PaymentMethod::Midtrans,
        'payment_status' => PaymentStatus::Unpaid,
        'payment_due_at' => Carbon::parse('2026-08-26 10:30:00', 'Asia/Jakarta'),
        'grand_total' => 200000,
    ]);

    $this->withToken(apiTokenFor($user))
        ->postJson("/api/v1/orders/{$order->uuid}/pay")
        ->assertOk()
        ->assertJsonPath('snap_token', 'snap-token-123')
        ->assertJsonPath('client_key', config('midtrans.client_key'));

    expect($order->payments()->count())->toBe(1);
});

test('pesanan yang belum dikonfirmasi tidak dapat dibayar', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create(['status' => OrderStatus::Pending]);

    $this->withToken(apiTokenFor($user))
        ->postJson("/api/v1/orders/{$order->uuid}/pay")
        ->assertStatus(422);
});

test('cek status pembayaran mengonfirmasi lunas', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Unpaid,
        'payment_due_at' => Carbon::parse('2026-08-26 10:30:00', 'Asia/Jakarta'),
    ]);
    Payment::factory()->for($order)->create([
        'method' => PaymentMethod::Midtrans,
        'amount' => $order->grand_total,
        'status' => PaymentStatus::Unpaid,
    ]);

    Http::fake([
        'api.sandbox.midtrans.com/*' => Http::response([
            'order_id' => $order->order_number,
            'transaction_id' => 'trx-001',
            'transaction_status' => 'capture',
            'fraud_status' => 'accept',
        ]),
    ]);

    $this->withToken(apiTokenFor($user))
        ->getJson("/api/v1/orders/{$order->uuid}/pay-status")
        ->assertOk()
        ->assertJsonPath('payment_status', PaymentStatus::Paid->value)
        ->assertJsonPath('order.payment_status', PaymentStatus::Paid->value);
});
