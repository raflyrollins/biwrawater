<?php

use App\Models\User;
use App\Models\Zone;

test('pencarian area web mengembalikan kecamatan yang cocok tanpa peka huruf', function () {
    Zone::factory()->create([
        'kecamatan' => 'Medan Marelan',
        'kelurahan' => 'Marelan',
        'city' => 'Medan',
        'is_active' => true,
    ]);

    $this->actingAs(User::factory()->create())
        ->getJson('/area/search?q=MAReLAN')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.kecamatan', 'Medan Marelan');
});

test('pencarian area web kosong mengembalikan daftar kosong', function () {
    $this->actingAs(User::factory()->create())
        ->getJson('/area/search?q=')
        ->assertOk()
        ->assertExactJson([]);
});
