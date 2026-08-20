<?php

use App\Models\Address;
use App\Models\User;

test('pelanggan menambah alamat baru', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('dashboard.addresses.store'), [
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
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($user->addresses)->toHaveCount(1)
        ->and($user->addresses->first()->is_default)->toBeTrue();
});

test('pelanggan mengubah alamat miliknya', function () {
    $user = User::factory()->create();
    $address = Address::factory()->for($user)->create(['label' => 'Rumah']);

    $this->actingAs($user)
        ->post(route('dashboard.addresses.update', $address), [
            'label' => 'Kantor',
            'recipient_name' => $address->recipient_name,
            'phone' => $address->phone,
            'street_address' => $address->street_address,
            'district' => $address->district,
            'subdistrict' => $address->subdistrict,
            'city' => $address->city,
            'postal_code' => $address->postal_code,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($address->refresh()->label)->toBe('Kantor');
});

test('pelanggan tidak dapat mengubah alamat orang lain', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $address = Address::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->post(route('dashboard.addresses.update', $address), [
            'label' => 'Hacked',
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

test('menghapus alamat default mengangkat alamat lain menjadi default', function () {
    $user = User::factory()->create();
    $default = Address::factory()->for($user)->create(['is_default' => true]);
    $other = Address::factory()->for($user)->create(['is_default' => false]);

    $this->actingAs($user)
        ->delete(route('dashboard.addresses.destroy', $default))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($other->refresh()->is_default)->toBeTrue();
});

test('tamu tidak dapat mengakses halaman alamat', function () {
    $this->get(route('dashboard.addresses.index'))->assertRedirect(route('login'));
});
