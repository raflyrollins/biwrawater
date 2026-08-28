<?php

use App\Models\Address;
use App\Models\User;

test('daftar alamat membutuhkan token', function () {
    $this->getJson('/api/v1/addresses')->assertStatus(401);
});

test('daftar alamat hanya menampilkan milik sendiri', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $mine = Address::factory()->for($user)->create(['label' => 'Rumah']);
    Address::factory()->for($other)->create(['label' => 'Kantor']);

    $this->withToken(apiTokenFor($user))
        ->getJson('/api/v1/addresses')
        ->assertOk()
        ->assertJsonCount(1, 'addresses')
        ->assertJsonPath('addresses.0.id', $mine->id);
});

test('pelanggan menambah alamat baru lewat API', function () {
    $user = User::factory()->create();

    $this->withToken(apiTokenFor($user))
        ->postJson('/api/v1/addresses', [
            'label' => 'Rumah',
            'recipient_name' => 'Budi',
            'phone' => '081234567890',
            'street_address' => 'Jl. Marelan Raya No. 1',
            'district' => 'Medan Marelan',
            'subdistrict' => 'Marelan',
            'city' => 'Medan',
            'postal_code' => '20256',
            'is_default' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('address.label', 'Rumah')
        ->assertJsonPath('address.is_default', true);

    expect($user->addresses)->toHaveCount(1)
        ->and($user->addresses->first()->is_default)->toBeTrue();
});

test('alamat baru default menonaktifkan alamat default lama', function () {
    $user = User::factory()->create();
    $oldDefault = Address::factory()->for($user)->create(['is_default' => true]);

    $this->withToken(apiTokenFor($user))
        ->postJson('/api/v1/addresses', [
            'label' => 'Kantor',
            'recipient_name' => 'Budi',
            'phone' => '081234567890',
            'street_address' => 'Jl. Marelan Raya No. 2',
            'district' => 'Medan Labuhan',
            'subdistrict' => 'Pekan Labuhan',
            'city' => 'Medan',
            'postal_code' => '20251',
            'is_default' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('address.is_default', true);

    expect($oldDefault->refresh()->is_default)->toBeFalse();
});

test('validasi alamat menolak kolom wajib yang kosong', function () {
    $user = User::factory()->create();

    $this->withToken(apiTokenFor($user))
        ->postJson('/api/v1/addresses', ['label' => 'Rumah'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['recipient_name', 'phone', 'street_address', 'district', 'city']);
});

test('pelanggan mengubah alamat miliknya lewat API', function () {
    $user = User::factory()->create();
    $address = Address::factory()->for($user)->create(['label' => 'Rumah']);

    $this->withToken(apiTokenFor($user))
        ->putJson("/api/v1/addresses/{$address->id}", [
            'label' => 'Kantor',
            'recipient_name' => $address->recipient_name,
            'phone' => $address->phone,
            'street_address' => $address->street_address,
            'district' => $address->district,
            'subdistrict' => $address->subdistrict,
            'city' => $address->city,
            'postal_code' => $address->postal_code,
        ])
        ->assertOk()
        ->assertJsonPath('address.label', 'Kantor');

    expect($address->refresh()->label)->toBe('Kantor');
});

test('pelanggan tidak dapat mengubah alamat orang lain lewat API', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $address = Address::factory()->for($owner)->create();

    $this->withToken(apiTokenFor($intruder))
        ->putJson("/api/v1/addresses/{$address->id}", [
            'label' => 'Kantor',
            'recipient_name' => $address->recipient_name,
            'phone' => $address->phone,
            'street_address' => $address->street_address,
            'district' => $address->district,
            'subdistrict' => $address->subdistrict,
            'city' => $address->city,
            'postal_code' => $address->postal_code,
        ])
        ->assertNotFound();
});

test('pelanggan menghapus alamat miliknya lewat API', function () {
    $user = User::factory()->create();
    $address = Address::factory()->for($user)->create();

    $this->withToken(apiTokenFor($user))
        ->deleteJson("/api/v1/addresses/{$address->id}")
        ->assertOk()
        ->assertJsonPath('message', 'Alamat berhasil dihapus.');

    expect($user->addresses)->toHaveCount(0);
});

test('menghapus alamat default mengangkat alamat lain menjadi default', function () {
    $user = User::factory()->create();
    $default = Address::factory()->for($user)->create(['is_default' => true]);
    $other = Address::factory()->for($user)->create(['is_default' => false]);

    $this->withToken(apiTokenFor($user))
        ->deleteJson("/api/v1/addresses/{$default->id}")
        ->assertOk();

    expect($other->refresh()->is_default)->toBeTrue();
});

test('pelanggan tidak dapat menghapus alamat orang lain lewat API', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $address = Address::factory()->for($owner)->create();

    $this->withToken(apiTokenFor($intruder))
        ->deleteJson("/api/v1/addresses/{$address->id}")
        ->assertNotFound();
});
