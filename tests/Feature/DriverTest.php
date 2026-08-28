<?php

use App\Enums\DeliveryStatus;
use App\Enums\DriverStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\Role;
use App\Enums\UserRole;
use App\Models\Delivery;
use App\Models\Driver;
use App\Models\Order;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin dapat membuat driver beserta akunnya', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post('/dashboard/drivers', [
            'name' => 'Budi Sopir',
            'email' => 'budi.sopir@biwrawater.id',
            'phone' => '081234567890',
            'license_number' => '1234-567890',
            'password' => 'rahasia123',
            'notes' => 'Rute Bandung selatan',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('users', [
        'email' => 'budi.sopir@biwrawater.id',
        'role' => UserRole::Driver,
    ]);
    $this->assertDatabaseHas('drivers', [
        'license_number' => '1234-567890',
        'status' => DriverStatus::Available,
    ]);

    $user = User::query()->where('email', 'budi.sopir@biwrawater.id')->firstOrFail();
    $this->assertTrue($user->hasRole(Role::Driver));
});

test('admin dapat mengubah driver tanpa mengganti password', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->driver()->create();
    $driver = Driver::factory()->for($user)->create();

    $this->actingAs($admin)
        ->post("/dashboard/drivers/{$driver->uuid}", [
            'name' => 'Budi Baru',
            'email' => 'budi.baru@biwrawater.id',
            'phone' => null,
            'license_number' => '9999-0000',
            'password' => '',
            'notes' => null,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($user->refresh())
        ->name->toBe('Budi Baru')
        ->email->toBe('budi.baru@biwrawater.id')
        ->and($driver->refresh()->license_number)->toBe('9999-0000');
});

test('admin dapat mengatur status driver antara tersedia dan istirahat', function () {
    $admin = User::factory()->admin()->create();
    $driver = Driver::factory()->create();

    $this->actingAs($admin)
        ->post("/dashboard/drivers/{$driver->uuid}/status", [
            'status' => DriverStatus::OffDuty->value,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($driver->refresh()->status)->toBe(DriverStatus::OffDuty);

    $this->post("/dashboard/drivers/{$driver->uuid}/status", [
        'status' => DriverStatus::Available->value,
    ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($driver->refresh()->status)->toBe(DriverStatus::Available);
});

test('status driver yang sedang bertugas tidak dapat diubah', function () {
    $admin = User::factory()->admin()->create();
    $driver = Driver::factory()->create(['status' => DriverStatus::OnDuty]);

    $this->actingAs($admin)
        ->post("/dashboard/drivers/{$driver->uuid}/status", [
            'status' => DriverStatus::Available->value,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($driver->refresh()->status)->toBe(DriverStatus::OnDuty);
});

test('admin tidak dapat mengistirahatkan driver yang masih punya tugas aktif', function () {
    $admin = User::factory()->admin()->create();
    $driverUser = User::factory()->driver()->create();
    $driver = Driver::factory()->for($driverUser)->create();
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);
    $truck = Truck::factory()->create();

    Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post("/dashboard/drivers/{$driver->uuid}/status", [
            'status' => DriverStatus::OffDuty->value,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($driver->refresh()->status)->toBe(DriverStatus::Available);
});

test('driver dapat mengatur statusnya sendiri antara tersedia dan istirahat', function () {
    $user = User::factory()->driver()->create();
    $driver = Driver::factory()->for($user)->create();

    $this->actingAs($user)
        ->post('/dashboard/driver/status', [
            'status' => DriverStatus::OffDuty->value,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($driver->refresh()->status)->toBe(DriverStatus::OffDuty);

    $this->post('/dashboard/driver/status', [
        'status' => DriverStatus::Available->value,
    ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($driver->refresh()->status)->toBe(DriverStatus::Available);
});

test('driver yang sedang bertugas tidak dapat mengubah statusnya sendiri', function () {
    $user = User::factory()->driver()->create();
    $driver = Driver::factory()->for($user)->create([
        'status' => DriverStatus::OnDuty,
    ]);

    $this->actingAs($user)
        ->post('/dashboard/driver/status', [
            'status' => DriverStatus::OffDuty->value,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($driver->refresh()->status)->toBe(DriverStatus::OnDuty);
});

test('driver dengan tugas aktif tidak dapat memilih istirahat', function () {
    $user = User::factory()->driver()->create();
    $driver = Driver::factory()->for($user)->create();
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Paid,
    ]);
    $truck = Truck::factory()->create();

    Delivery::factory()->for($order)->for($truck)->for($driver)->create([
        'status' => DeliveryStatus::Scheduled,
        'scheduled_at' => now(),
    ]);

    $this->actingAs($user)
        ->post('/dashboard/driver/status', [
            'status' => DriverStatus::OffDuty->value,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($driver->refresh()->status)->toBe(DriverStatus::Available);
});

test('pelanggan tidak dapat mengubah statusnya sendiri', function () {
    $this->actingAs(User::factory()->create())
        ->post('/dashboard/driver/status', [
            'status' => DriverStatus::OffDuty->value,
        ])
        ->assertForbidden();
});

test('driver yang sedang bertugas tidak dapat dinonaktifkan', function () {
    $admin = User::factory()->admin()->create();
    $driver = Driver::factory()->create(['status' => DriverStatus::OnDuty]);

    $this->actingAs($admin)
        ->delete("/dashboard/drivers/{$driver->uuid}")
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($driver->refresh()->status)->toBe(DriverStatus::OnDuty);
});

test('driver dinonaktifkan menjadi status istirahat', function () {
    $admin = User::factory()->admin()->create();
    $driver = Driver::factory()->create();

    $this->actingAs($admin)
        ->delete("/dashboard/drivers/{$driver->uuid}")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($driver->refresh()->status)->toBe(DriverStatus::OffDuty);
});

test('email driver tidak boleh duplikat', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->create(['email' => 'ada@biwrawater.id']);

    $this->actingAs($admin)
        ->post('/dashboard/drivers', [
            'name' => 'X',
            'email' => 'ada@biwrawater.id',
            'password' => 'rahasia123',
        ])
        ->assertSessionHasErrors('email');

    expect(Driver::query()->count())->toBe(0);
});

test('pelanggan tidak dapat mengelola driver', function () {
    $this->actingAs(User::factory()->create())
        ->post('/dashboard/drivers', [
            'name' => 'X',
            'email' => 'x@biwrawater.id',
            'password' => 'rahasia123',
        ])
        ->assertForbidden();
});
