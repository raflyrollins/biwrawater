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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('endpoint driver menolak token pelanggan', function () {
    $customer = User::factory()->create();

    $this->withToken(apiTokenFor($customer))
        ->getJson('/api/v1/driver/deliveries')
        ->assertForbidden();
});

test('jadwal driver diurutkan FIFO melalui API', function () {
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();
    $truck = Truck::factory()->create();

    $firstOrder = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);
    $secondOrder = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);

    Delivery::factory()->for($firstOrder)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now()->subHour(),
    ]);
    Delivery::factory()->for($secondOrder)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $this->withToken(apiTokenFor($driverUser))
        ->getJson('/api/v1/driver/deliveries')
        ->assertOk()
        ->assertJsonPath('driver_status', DriverStatus::Available->value)
        ->assertJsonCount(2, 'active')
        ->assertJsonPath('active.0.queue_position', 1)
        ->assertJsonPath('active.0.is_current', true)
        ->assertJsonPath('active.0.order.order_number', $firstOrder->order_number)
        ->assertJsonPath('active.1.queue_position', 2)
        ->assertJsonPath('active.1.is_current', false)
        ->assertJsonPath('active.1.order.order_number', $secondOrder->order_number);
});

test('driver hanya dapat mengerjakan tugas paling awal via API', function () {
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();
    $truck = Truck::factory()->create();

    $firstOrder = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);
    $secondOrder = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);

    $first = Delivery::factory()->for($firstOrder)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now()->subHour(),
    ]);
    $second = Delivery::factory()->for($secondOrder)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $this->withToken(apiTokenFor($driverUser))
        ->postJson("/api/v1/driver/deliveries/{$second->uuid}/fill")
        ->assertStatus(422)
        ->assertJsonPath('message', 'Selesaikan tugas paling awal terlebih dahulu (FIFO).');

    expect($second->refresh()->status)->toBe(DeliveryStatus::Scheduled);

    $this->postJson("/api/v1/driver/deliveries/{$first->uuid}/fill")
        ->assertOk()
        ->assertJsonPath('delivery.status', DeliveryStatus::Filling->value);

    expect($first->refresh()->status)->toBe(DeliveryStatus::Filling);
});

test('driver tidak dapat mengubah pengiriman milik driver lain', function () {
    $order = Order::factory()->create();
    $truck = Truck::factory()->create();
    $driverUser = User::factory()->driver()->create();
    Driver::factory()->for($driverUser)->create();
    $otherDriver = Driver::factory()->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($otherDriver)->create([
        'status' => DeliveryStatus::Scheduled,
    ]);

    $this->withToken(apiTokenFor($driverUser))
        ->postJson("/api/v1/driver/deliveries/{$delivery->uuid}/fill")
        ->assertNotFound();
});

test('driver menyelesaikan rantai pengiriman COD dengan foto via API', function () {
    Storage::fake('public');

    $customer = User::factory()->create();
    $order = Order::factory()->for($customer)->create([
        'status' => OrderStatus::Confirmed,
        'payment_method' => PaymentMethod::Cod,
        'payment_status' => PaymentStatus::Unpaid,
    ]);
    $truck = Truck::factory()->create(['status' => TruckStatus::Assigned]);
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $this->withToken(apiTokenFor($driverUser))
        ->postJson("/api/v1/driver/deliveries/{$delivery->uuid}/fill")
        ->assertOk()
        ->assertJsonPath('delivery.status', DeliveryStatus::Filling->value);

    expect($truck->refresh()->status)->toBe(TruckStatus::Assigned)
        ->and($driver->refresh()->status)->toBe(DriverStatus::OnDuty);

    $this->postJson("/api/v1/driver/deliveries/{$delivery->uuid}/depart")
        ->assertOk()
        ->assertJsonPath('delivery.status', DeliveryStatus::OnTheWay->value);

    expect($order->refresh()->status)->toBe(OrderStatus::InDelivery);

    $this->postJson("/api/v1/driver/deliveries/{$delivery->uuid}/unload")
        ->assertOk()
        ->assertJsonPath('delivery.status', DeliveryStatus::Unloading->value);

    $this->postJson("/api/v1/driver/deliveries/{$delivery->uuid}/deliver")
        ->assertStatus(422);

    expect($delivery->refresh()->status)->toBe(DeliveryStatus::Unloading);

    foreach (['completion_tank', 'completion_person'] as $type) {
        $this->post("/api/v1/driver/deliveries/{$delivery->uuid}/photos", [
            'type' => $type,
            'photo' => UploadedFile::fake()->image("{$type}.jpg"),
        ])
            ->assertCreated()
            ->assertJsonPath('photo.type', $type);
    }

    expect($delivery->photos()->count())->toBe(2);

    $this->postJson("/api/v1/driver/deliveries/{$delivery->uuid}/deliver")
        ->assertOk()
        ->assertJsonPath('delivery.status', DeliveryStatus::Delivered->value);

    $order->refresh();
    $delivery->refresh();

    expect($delivery->status)->toBe(DeliveryStatus::Delivered)
        ->and($order->status)->toBe(OrderStatus::Delivered)
        ->and($order->payment_status)->toBe(PaymentStatus::Paid)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Available)
        ->and($driver->refresh()->status)->toBe(DriverStatus::Available);
});

test('driver dapat menggagalkan pengiriman yang sedang berjalan', function () {
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);
    $truck = Truck::factory()->create(['status' => TruckStatus::Assigned]);
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $this->withToken(apiTokenFor($driverUser))
        ->postJson("/api/v1/driver/deliveries/{$delivery->uuid}/fill")
        ->assertOk();

    $this->postJson("/api/v1/driver/deliveries/{$delivery->uuid}/fail")
        ->assertOk()
        ->assertJsonPath('delivery.status', DeliveryStatus::Failed->value);

    expect($order->refresh()->status)->toBe(OrderStatus::Confirmed)
        ->and($truck->refresh()->status)->toBe(TruckStatus::Available)
        ->and($driver->refresh()->status)->toBe(DriverStatus::Available);
});

test('pengiriman yang belum mulai tidak dapat digagalkan', function () {
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();
    $truck = Truck::factory()->create();
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $this->withToken(apiTokenFor($driverUser))
        ->postJson("/api/v1/driver/deliveries/{$delivery->uuid}/fail")
        ->assertStatus(422)
        ->assertJsonPath('message', 'Hanya pengiriman yang sedang berjalan dapat digagalkan.');

    expect($delivery->refresh()->status)->toBe(DeliveryStatus::Scheduled);
});

test('driver yang sedang bertugas tidak dapat mengubah statusnya', function () {
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();
    $truck = Truck::factory()->create();
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);

    $delivery = Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $this->withToken(apiTokenFor($driverUser))
        ->postJson("/api/v1/driver/deliveries/{$delivery->uuid}/fill")
        ->assertOk();

    expect($driver->refresh()->status)->toBe(DriverStatus::OnDuty);

    app('auth')->forgetGuards();

    $this->postJson('/api/v1/driver/status', ['status' => DriverStatus::OffDuty->value])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Driver sedang bertugas, status tidak dapat diubah.');

    expect($driver->refresh()->status)->toBe(DriverStatus::OnDuty);
});

test('status driver yang tidak valid ditolak', function () {
    $driverUser = User::factory()->driver()->create();
    Driver::factory()->for($driverUser)->create();

    $this->withToken(apiTokenFor($driverUser))
        ->postJson('/api/v1/driver/status', ['status' => 'on_duty'])
        ->assertStatus(422);
});

test('driver yang masih punya tugas aktif tidak dapat memilih istirahat', function () {
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();
    $truck = Truck::factory()->create();
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);

    Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $this->withToken(apiTokenFor($driverUser))
        ->postJson('/api/v1/driver/status', ['status' => DriverStatus::OffDuty->value])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Driver masih memiliki tugas aktif, selesaikan atau alihkan tugasnya terlebih dahulu.');

    expect($driver->refresh()->status)->toBe(DriverStatus::Available);
});

test('driver dapat mengubah statusnya sendiri', function () {
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();

    $this->withToken(apiTokenFor($driverUser))
        ->postJson('/api/v1/driver/status', ['status' => DriverStatus::OffDuty->value])
        ->assertOk()
        ->assertJsonPath('driver_status', DriverStatus::OffDuty->value);

    expect($driver->refresh()->status)->toBe(DriverStatus::OffDuty);

    $this->postJson('/api/v1/driver/status', ['status' => DriverStatus::Available->value])
        ->assertOk()
        ->assertJsonPath('driver_status', DriverStatus::Available->value);

    expect($driver->refresh()->status)->toBe(DriverStatus::Available);
});
