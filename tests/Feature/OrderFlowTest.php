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

test('admin menugaskan truk ke pesanan yang sudah dibayar', function () {
    $admin = User::factory()->admin()->create();
    $zone = Zone::factory()->create(['delivery_fee' => 0]);
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
        'zone_id' => $zone->id,
    ]);
    $driver = Driver::factory()->create();
    $truck = Truck::factory()->create(['default_driver_id' => $driver->id]);

    $this->actingAs($admin)
        ->post("/dashboard/orders/{$order->uuid}/assign", [
            'truck_id' => $truck->id,
            'note' => 'Hubungi pelanggan sebelum tiba',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $order->refresh();

    expect($order->status)->toBe(OrderStatus::Confirmed)
        ->and($order->delivery)->not->toBeNull()
        ->and($order->delivery->status)->toBe(DeliveryStatus::Scheduled)
        ->and($order->delivery->truck_id)->toBe($truck->id)
        ->and($order->delivery->driver_id)->toBe($driver->id)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Available);
});

test('truk tetap dapat menerima pesanan berikutnya setelah pre-assign (multi-tugas)', function () {
    $admin = User::factory()->admin()->create();
    $zone = Zone::factory()->create(['delivery_fee' => 0]);
    $driver = Driver::factory()->create();

    $truck = Truck::factory()->create([
        'capacity_liters' => 5000,
        'default_driver_id' => $driver->id,
    ]);

    $orderOne = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
        'zone_id' => $zone->id,
    ]);
    $orderTwo = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
        'zone_id' => $zone->id,
    ]);

    foreach ([$orderOne, $orderTwo] as $order) {
        $this->actingAs($admin)
            ->post("/dashboard/orders/{$order->uuid}/assign", [
                'truck_id' => $truck->id,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');
    }

    expect($orderOne->refresh()->delivery->status)->toBe(DeliveryStatus::Scheduled)
        ->and($orderTwo->refresh()->delivery->status)->toBe(DeliveryStatus::Scheduled)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Available);
});

test('admin dapat memilih driver selain driver default saat menugaskan', function () {
    $admin = User::factory()->admin()->create();
    $zone = Zone::factory()->create(['delivery_fee' => 0]);
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
        'zone_id' => $zone->id,
    ]);
    $defaultDriver = Driver::factory()->create();
    $chosenDriver = Driver::factory()->create();
    $truck = Truck::factory()->create(['default_driver_id' => $defaultDriver->id]);

    $this->actingAs($admin)
        ->post("/dashboard/orders/{$order->uuid}/assign", [
            'truck_id' => $truck->id,
            'driver_id' => $chosenDriver->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($order->refresh()->delivery->driver_id)->toBe($chosenDriver->id);
});

test('startFilling mengunci truk dan driver setelah pre-assign', function () {
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();
    $truck = Truck::factory()->create(['default_driver_id' => $driver->id]);
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $this->actingAs($driverUser)
        ->post("/dashboard/deliveries/{$delivery->uuid}/fill")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($truck->refresh()->status)->toBe(TruckStatus::Assigned)
        ->and($driver->refresh()->status)->toBe(DriverStatus::OnDuty);
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
    $driver = Driver::factory()->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $otherTruck = Truck::factory()->create();

    $this->actingAs($admin)
        ->post("/dashboard/orders/{$order->uuid}/assign", [
            'truck_id' => $otherTruck->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($order->refresh()->delivery->id)->toBe($delivery->id)
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
        'scheduled_at' => now(),
    ]);

    // In real flow, assign() locks the truck
    $truck->update(['status' => TruckStatus::Assigned]);

    // Driver langsung mulai pengisian (tidak perlu accept)
    $this->actingAs($driverUser)
        ->post("/dashboard/deliveries/{$delivery->uuid}/fill")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($delivery->refresh()->status)->toBe(DeliveryStatus::Filling)
        ->and($delivery->filling_started_at)->not->toBeNull()
        ->and($order->refresh()->status)->toBe(OrderStatus::Confirmed)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Assigned)
        ->and($driver->refresh()->status)->toBe(DriverStatus::OnDuty);

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
        'scheduled_at' => now(),
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
    $driver = Driver::factory()->create();
    $truck = Truck::factory()->create(['default_driver_id' => $driver->id]);

    Delivery::factory()->for($order)->create([
        'status' => DeliveryStatus::Failed,
    ]);

    $this->actingAs($admin)
        ->post("/dashboard/orders/{$order->uuid}/assign", [
            'truck_id' => $truck->id,
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
    $intruder = Driver::factory()->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($otherDriver)->create([
        'status' => DeliveryStatus::Scheduled,
    ]);

    $this->actingAs($intruder->user)
        ->post("/dashboard/deliveries/{$delivery->uuid}/fill")
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

    $this->actingAs($admin)
        ->post("/dashboard/orders/{$order->uuid}/assign", [
            'truck_id' => $truck->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');
});

test('admin membatalkan delivery scheduled', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);
    $truck = Truck::factory()->create();
    $driver = Driver::factory()->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $truck->update(['status' => TruckStatus::Assigned]);

    $this->actingAs($admin)
        ->post("/dashboard/deliveries/{$delivery->uuid}/cancel-scheduled")
        ->assertRedirect()
        ->assertSessionHas('success');

    $order->refresh();
    $delivery->refresh();

    expect($delivery->status)->toBe(DeliveryStatus::Failed)
        ->and($delivery->note)->toContain('Dibatalkan admin')
        ->and($order->status)->toBe(OrderStatus::Confirmed)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Available);
});

test('admin tidak dapat membatalkan delivery yang sudah filling', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create();
    $truck = Truck::factory()->create();
    $driver = Driver::factory()->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Filling,
        'scheduled_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post("/dashboard/deliveries/{$delivery->uuid}/cancel-scheduled")
        ->assertRedirect()
        ->assertSessionHas('error');
});

test('admin mengganti driver pada delivery scheduled', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create();
    $truck = Truck::factory()->create();
    $driver1 = Driver::factory()->create();
    $driver2 = Driver::factory()->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver1)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post("/dashboard/deliveries/{$delivery->uuid}/reassign-driver", [
            'driver_id' => $driver2->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($delivery->refresh()->driver_id)->toBe($driver2->id);
});
