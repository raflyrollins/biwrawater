<?php

use App\Enums\DeliveryStatus;
use App\Enums\DriverStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\TruckStatus;
use App\Models\Delivery;
use App\Models\Driver;
use App\Models\Order;
use App\Models\Truck;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('admin menugaskan truk dan driver ke pesanan yang sudah dibayar', function () {
    $admin = User::factory()->admin()->create();
    $zone = Zone::factory()->create(['delivery_fee' => 0]);
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
        'zone_id' => $zone->id,
    ]);
    $truck = Truck::factory()->create();
    $driver = Driver::factory()->create();

    $this->actingAs($admin)
        ->post("/dashboard/orders/{$order->uuid}/assign", [
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'note' => 'Hubungi pelanggan sebelum tiba',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $order->refresh();

    expect($order->status)->toBe(OrderStatus::Confirmed)
        ->and($order->delivery)->not->toBeNull()
        ->and($order->delivery->status)->toBe(DeliveryStatus::Scheduled)
        ->and($order->delivery->truck_id)->toBe($truck->id)
        ->and($order->delivery->driver_id)->toBe($driver->id);
});

test('penugasan ditolak ketika pesanan sudah memiliki pengiriman aktif', function () {
    $admin = User::factory()->admin()->create();
    $zone = Zone::factory()->create(['delivery_fee' => 0]);
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
        'zone_id' => $zone->id,
    ]);
    $truck = Truck::factory()->create();
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Accepted,
        'scheduled_at' => now()->addHour(),
    ]);

    $otherTruck = Truck::factory()->create();
    $otherDriverUser = User::factory()->driver()->create();
    $otherDriver = Driver::factory()->for($otherDriverUser)->create();

    $this->actingAs($admin)
        ->post("/dashboard/orders/{$order->uuid}/assign", [
            'truck_id' => $otherTruck->id,
            'driver_id' => $otherDriver->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($order->refresh()->delivery->id)->toBe($delivery->id)
        ->and($order->delivery->driver_id)->toBe($driver->id)
        ->and($order->delivery()->count())->toBe(1);
});

test('driver memproses rantai pengiriman COD sampai selesai dengan foto bukti', function () {
    Storage::fake('public');

    $customer = User::factory()->create();
    $order = Order::factory()->for($customer)->create([
        'status' => OrderStatus::Confirmed,
        'payment_method' => PaymentMethod::Cod,
        'payment_status' => PaymentStatus::Unpaid,
    ]);
    $truck = Truck::factory()->create();
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now()->addHour(),
    ]);

    $this->actingAs($driverUser)
        ->post("/dashboard/deliveries/{$delivery->uuid}/accept")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($delivery->refresh()->status)->toBe(DeliveryStatus::Accepted)
        ->and($order->refresh()->status)->toBe(OrderStatus::Confirmed)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Assigned)
        ->and($driver->refresh()->status)->toBe(DriverStatus::OnDuty);

    $this->post("/dashboard/deliveries/{$delivery->uuid}/fill")
        ->assertRedirect()
        ->assertSessionHas('success');
    $this->post("/dashboard/deliveries/{$delivery->uuid}/depart")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($delivery->refresh()->status)->toBe(DeliveryStatus::OnTheWay)
        ->and($order->refresh()->status)->toBe(OrderStatus::InDelivery);

    $this->post("/dashboard/deliveries/{$delivery->uuid}/unload")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($delivery->refresh()->status)->toBe(DeliveryStatus::Unloading);

    $this->post("/dashboard/deliveries/{$delivery->uuid}/deliver")
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($delivery->refresh()->status)->toBe(DeliveryStatus::Unloading)
        ->and($order->refresh()->status)->toBe(OrderStatus::InDelivery);

    foreach (['completion_tank', 'completion_person'] as $type) {
        $this->post("/dashboard/deliveries/{$delivery->uuid}/photos", [
            'type' => $type,
            'photo' => UploadedFile::fake()->image("{$type}.jpg"),
        ])
            ->assertRedirect()
            ->assertSessionHas('success');
    }

    expect($delivery->photos()->count())->toBe(2);

    $this->post("/dashboard/deliveries/{$delivery->uuid}/deliver")
        ->assertRedirect()
        ->assertSessionHas('success');

    $order->refresh();
    $delivery->refresh();

    expect($delivery->status)->toBe(DeliveryStatus::Delivered)
        ->and($order->status)->toBe(OrderStatus::Delivered)
        ->and($order->payment_status)->toBe(PaymentStatus::Paid)
        ->and($order->payments()->count())->toBe(1)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Available)
        ->and($driver->refresh()->status)->toBe(DriverStatus::Available);
});

test('driver menolak tugas sehingga pesanan kembali ke antrean penugasan', function () {
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);
    $truck = Truck::factory()->create();
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now()->addHour(),
    ]);

    $this->actingAs($driverUser)
        ->post("/dashboard/deliveries/{$delivery->uuid}/reject")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($delivery->refresh()->status)->toBe(DeliveryStatus::Failed)
        ->and($order->refresh()->status)->toBe(OrderStatus::Confirmed)
        ->and($order->payment_status)->toBe(PaymentStatus::Paid)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Available)
        ->and($driver->refresh()->status)->toBe(DriverStatus::Available);
});

test('pengiriman gagal mengembalikan pesanan ke antrean penugasan', function () {
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);
    $truck = Truck::factory()->create();
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::OnTheWay,
        'scheduled_at' => now()->addHour(),
    ]);

    $this->actingAs($driverUser)
        ->post("/dashboard/deliveries/{$delivery->uuid}/fail")
        ->assertRedirect()
        ->assertSessionHas('error');

    $order->refresh();
    $delivery->refresh();

    expect($delivery->status)->toBe(DeliveryStatus::Failed)
        ->and($order->status)->toBe(OrderStatus::Confirmed)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Available)
        ->and($driver->refresh()->status)->toBe(DriverStatus::Available);
});

test('pengiriman gagal lama digantikan saat penugasan ulang', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);
    $truck = Truck::factory()->create();
    $driver = Driver::factory()->create();

    Delivery::factory()->for($order)->create([
        'status' => DeliveryStatus::Failed,
    ]);

    $this->actingAs($admin)
        ->post("/dashboard/orders/{$order->uuid}/assign", [
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'scheduled_at' => now()->addHour()->format('Y-m-d H:i:s'),
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Delivery::query()->where('order_id', $order->id)->count())->toBe(1)
        ->and($order->delivery->status)->toBe(DeliveryStatus::Scheduled);
});

test('driver tidak dapat mengubah pengiriman milik driver lain', function () {
    $order = Order::factory()->create();
    $truck = Truck::factory()->create();
    $otherDriver = Driver::factory()->create();
    $otherUser = $otherDriver->user;
    $intruder = Driver::factory()->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($otherDriver)->create([
        'status' => DeliveryStatus::Scheduled,
    ]);

    $this->actingAs($intruder->user)
        ->post("/dashboard/deliveries/{$delivery->uuid}/accept")
        ->assertNotFound();
});

test('pelanggan tidak dapat membatalkan pesanan orang lain', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $order = Order::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->post("/dashboard/orders/{$order->uuid}/cancel")
        ->assertNotFound();
});

test('pelanggan dapat membatalkan pesanan yang masih menunggu', function () {
    $owner = User::factory()->create();
    $order = Order::factory()->for($owner)->create();

    $this->actingAs($owner)
        ->post("/dashboard/orders/{$order->uuid}/cancel")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($order->refresh()->status)->toBe(OrderStatus::Cancelled);
});

test('penugasan ditolak untuk pesanan yang belum dibayar', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Unpaid,
    ]);
    $truck = Truck::factory()->create();
    $driver = Driver::factory()->create();

    $this->actingAs($admin)
        ->post("/dashboard/orders/{$order->uuid}/assign", [
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'scheduled_at' => now()->addHour()->format('Y-m-d H:i:s'),
        ])
        ->assertRedirect()
        ->assertSessionHas('error');
});
