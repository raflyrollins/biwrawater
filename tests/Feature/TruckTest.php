<?php

use App\Enums\TruckStatus;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin dapat membuat armada', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post('/dashboard/trucks', [
            'plate_number' => 'B 1234 CDE',
            'name' => 'Truk Tangki 1',
            'capacity_liters' => 5000,
            'notes' => 'Servis rutin',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('trucks', [
        'plate_number' => 'B 1234 CDE',
        'name' => 'Truk Tangki 1',
        'capacity_liters' => 5000,
        'status' => TruckStatus::Available,
    ]);
});

test('admin dapat mengubah armada', function () {
    $admin = User::factory()->admin()->create();
    $truck = Truck::factory()->create();

    $this->actingAs($admin)
        ->post("/dashboard/trucks/{$truck->uuid}", [
            'plate_number' => 'D 5678 FGH',
            'name' => 'Truk Baru',
            'capacity_liters' => 8000,
            'notes' => null,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($truck->refresh())
        ->plate_number->toBe('D 5678 FGH')
        ->name->toBe('Truk Baru')
        ->capacity_liters->toBe(8000);
});

test('status armada dapat dialihkan antara tersedia dan perbaikan', function () {
    $admin = User::factory()->admin()->create();
    $truck = Truck::factory()->create();

    $this->actingAs($admin)
        ->post("/dashboard/trucks/{$truck->uuid}/toggle")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($truck->refresh()->status)->toBe(TruckStatus::Maintenance);

    $this->actingAs($admin)
        ->post("/dashboard/trucks/{$truck->uuid}/toggle")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($truck->refresh()->status)->toBe(TruckStatus::Available);
});

test('status armada yang sedang bertugas tidak dapat diubah', function () {
    $admin = User::factory()->admin()->create();
    $truck = Truck::factory()->create(['status' => TruckStatus::Assigned]);

    $this->actingAs($admin)
        ->post("/dashboard/trucks/{$truck->uuid}/toggle")
        ->assertRedirect()
        ->assertSessionHas('error');
});

test('armada yang sedang bertugas tidak dapat dinonaktifkan', function () {
    $admin = User::factory()->admin()->create();
    $truck = Truck::factory()->create(['status' => TruckStatus::Assigned]);

    $this->actingAs($admin)
        ->delete("/dashboard/trucks/{$truck->uuid}")
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($truck->refresh()->status)->toBe(TruckStatus::Assigned);
});

test('armada dinonaktifkan menjadi status retired', function () {
    $admin = User::factory()->admin()->create();
    $truck = Truck::factory()->create();

    $this->actingAs($admin)
        ->delete("/dashboard/trucks/{$truck->uuid}")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($truck->refresh()->status)->toBe(TruckStatus::Retired);
});

test('pelanggan tidak dapat mengelola armada', function () {
    $this->actingAs(User::factory()->create())
        ->post('/dashboard/trucks', [
            'plate_number' => 'B 9999 ZZ',
            'name' => 'X',
            'capacity_liters' => 1,
        ])
        ->assertForbidden();
});
