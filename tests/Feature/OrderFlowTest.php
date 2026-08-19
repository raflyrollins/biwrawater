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
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin menugaskan truk dan driver ke pesanan', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create();
    $truck = Truck::factory()->create();
    $driver = Driver::factory()->create();

    $this->actingAs($admin)
        ->post("/dashboard/orders/{$order->uuid}/assign", [
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'scheduled_at' => now()->addHour()->format('Y-m-d H:i:s'),
            'note' => 'Hubungi pelanggan sebelum tiba',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $order->refresh();

    expect($order->status)->toBe(OrderStatus::Confirmed);
    expect($order->delivery)->not->toBeNull()
        ->and($order->delivery->status)->toBe(DeliveryStatus::Scheduled)
        ->and($order->delivery->truck_id)->toBe($truck->id)
        ->and($order->delivery->driver_id)->toBe($driver->id);
});

test('driver memulai dan menyelesaikan pengiriman COD', function () {
    $customer = User::factory()->create();
    $order = Order::factory()->for($customer)->create([
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
        ->post("/dashboard/deliveries/{$delivery->uuid}/depart")
        ->assertRedirect()
        ->assertSessionHas('success');

    $order->refresh();
    $delivery->refresh();

    expect($delivery->status)->toBe(DeliveryStatus::OnTheWay)
        ->and($order->status)->toBe(OrderStatus::InDelivery)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Assigned)
        ->and($driver->refresh()->status)->toBe(DriverStatus::OnDuty);

    $this->actingAs($driverUser)
        ->post("/dashboard/deliveries/{$delivery->uuid}/deliver")
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

test('pengiriman gagal mengembalikan pesanan ke antrean', function () {
    $order = Order::factory()->create();
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
        ->and($order->status)->toBe(OrderStatus::Pending)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Available)
        ->and($driver->refresh()->status)->toBe(DriverStatus::Available);
});

test('pengiriman gagal lama digantikan saat penugasan ulang', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create();
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
        ->post("/dashboard/deliveries/{$delivery->uuid}/depart")
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

test('penugasan ditolak untuk pesanan yang tidak menunggu', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['status' => OrderStatus::Confirmed]);
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
