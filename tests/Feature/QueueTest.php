<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Driver;
use App\Models\Order;
use App\Models\Truck;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('admin dapat melihat halaman antrian', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('dashboard.queue.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard/Queue'));
});

test('pelanggan tidak dapat mengakses halaman antrian', function () {
    $customer = User::factory()->create();

    $this->actingAs($customer)
        ->get(route('dashboard.queue.index'))
        ->assertForbidden();
});

test('hanya pesanan confirmed + paid + tanpa delivery aktif yang muncul di antrian', function () {
    $admin = User::factory()->admin()->create();
    $zone = Zone::factory()->create(['delivery_fee' => 0]);

    $orderReady = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
        'zone_id' => $zone->id,
    ]);

    Order::factory()->create([
        'status' => OrderStatus::Pending,
        'payment_status' => PaymentStatus::Unpaid,
    ]);

    Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Unpaid,
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard.queue.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/Queue')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.id', $orderReady->id)
        );
});

test('pesanan dengan delivery aktif dipindahkan ke daftar sudah ditugaskan', function () {
    $admin = User::factory()->admin()->create();
    $zone = Zone::factory()->create(['delivery_fee' => 0]);
    $truck = Truck::factory()->create(['default_driver_id' => Driver::factory()->create()->id]);
    $driver = Driver::factory()->create();

    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
        'zone_id' => $zone->id,
    ]);

    $order->delivery()->create([
        'truck_id' => $truck->id,
        'driver_id' => $driver->id,
        'status' => 'scheduled',
        'scheduled_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard.queue.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/Queue')
            ->has('pendingOrders', 0)
            ->has('assignedOrders', 1)
            ->where('assignedOrders.0.id', $order->id)
            ->where('assignedOrders.0.delivery.status', 'scheduled')
            ->where('assignedOrders.0.delivery.truck.id', $truck->id)
            ->where('assignedOrders.0.delivery.driver.user.name', $driver->user->name)
        );
});

test('antrian menyertakan data armada dengan driver default', function () {
    $admin = User::factory()->admin()->create();
    $driver = Driver::factory()->create();
    Truck::factory()->create(['status' => 'available', 'default_driver_id' => $driver->id]);
    Truck::factory()->create(['status' => 'available']);
    Truck::factory()->create(['status' => 'maintenance']);

    $this->actingAs($admin)
        ->get(route('dashboard.queue.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/Queue')
            ->has('truckUnits', 3)
            ->has('drivers', 1)
            ->where('drivers.0.user.name', $driver->user->name)
        );
});
