<?php

use App\Enums\DeliveryStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Delivery;
use App\Models\Driver;
use App\Models\Order;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('tamu diarahkan ke login saat mengakses dashboard', function () {
    $this->get('/dashboard')->assertRedirect(route('login'));
    $this->get('/dashboard/orders')->assertRedirect(route('login'));
    $this->get('/dashboard/orders/1')->assertRedirect(route('login'));
    $this->get('/dashboard/deliveries')->assertRedirect(route('login'));
    $this->get('/dashboard/promotions')->assertRedirect(route('login'));
});

test('pelanggan diarahkan ke daftar pesanannya sendiri di dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard/Index'));
});

test('pelanggan dapat melihat detail pesanannya sendiri', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create();

    $this->actingAs($user)
        ->get("/dashboard/orders/{$order->uuid}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard/orders/Show'));
});

test('pelanggan tidak dapat melihat detail pesanan orang lain', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $order = Order::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->get("/dashboard/orders/{$order->uuid}")
        ->assertNotFound();
});

test('pelanggan tidak dapat mengakses daftar pesanan admin', function () {
    $this->actingAs(User::factory()->create())
        ->get('/dashboard/orders')
        ->assertForbidden();
});

test('pelanggan tidak dapat mengakses jadwal pengiriman', function () {
    $this->actingAs(User::factory()->create())
        ->get('/dashboard/deliveries')
        ->assertForbidden();
});

test('admin diarahkan ke ringkasan di dashboard', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard/Summary'));
});

test('jadwal pengiriman di ringkasan menyertakan uuid pesanan', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);
    Delivery::factory()
        ->for($order)
        ->for(Truck::factory()->create())
        ->for(Driver::factory()->create())
        ->create([
            'status' => DeliveryStatus::Scheduled,
            'scheduled_at' => now()->addHour(),
        ]);

    $this->actingAs($admin)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/Summary')
            ->has('todaySchedule', 1)
            ->where('todaySchedule.0.order.uuid', $order->uuid));
});

test('admin dapat mengakses daftar pesanan', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get('/dashboard/orders')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard/orders/Index'));
});

test('admin dapat melihat detail pesanan pelanggan', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create();

    $this->actingAs($admin)
        ->get("/dashboard/orders/{$order->uuid}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard/orders/Show'));
});

test('admin tidak dapat mengakses jadwal pengiriman', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get('/dashboard/deliveries')
        ->assertForbidden();
});

test('driver diarahkan ke jadwal pengiriman di dashboard', function () {
    $user = User::factory()->driver()->create();
    Driver::factory()->for($user)->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard/Deliveries'));
});

test('driver dapat mengakses jadwal pengiriman', function () {
    $user = User::factory()->driver()->create();
    Driver::factory()->for($user)->create();

    $this->actingAs($user)
        ->get('/dashboard/deliveries')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard/Deliveries'));
});

test('pengiriman yang sudah diterima driver tetap tampil di dashboard', function () {
    $user = User::factory()->driver()->create();
    $driver = Driver::factory()->for($user)->create();
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);
    Delivery::factory()->for($order)->for(Truck::factory()->create())->for($driver)->create([
        'status' => DeliveryStatus::Accepted,
        'scheduled_at' => now()->addHour(),
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/Deliveries')
            ->has('active', 1)
            ->where('active.0.status', DeliveryStatus::Accepted->value)
            ->has('history', 0));
});

test('driver tidak dapat mengakses daftar pesanan', function () {
    $user = User::factory()->driver()->create();
    Driver::factory()->for($user)->create();

    $this->actingAs($user)
        ->get('/dashboard/orders')
        ->assertForbidden();
});

test('driver tidak dapat melihat detail pesanan', function () {
    $user = User::factory()->driver()->create();
    Driver::factory()->for($user)->create();
    $order = Order::factory()->create();

    $this->actingAs($user)
        ->get("/dashboard/orders/{$order->uuid}")
        ->assertForbidden();
});
