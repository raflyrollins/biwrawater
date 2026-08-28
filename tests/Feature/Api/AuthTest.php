<?php

use App\Enums\UserRole;
use App\Models\Driver;
use App\Models\User;

test('register membuat akun pelanggan dengan token API', function () {
    $this->postJson('/api/v1/auth/register', [
        'name' => 'Budi Sopir',
        'email' => 'budi@biwrawater.id',
        'phone' => '081234567890',
        'password' => 'rahasia123',
        'password_confirmation' => 'rahasia123',
    ])
        ->assertCreated()
        ->assertJsonStructure([
            'token',
            'user' => ['id', 'name', 'email', 'phone', 'role'],
        ])
        ->assertJsonPath('user.role', UserRole::Customer->value);

    $this->assertDatabaseHas('users', [
        'email' => 'budi@biwrawater.id',
        'role' => UserRole::Customer->value,
    ]);

    $user = User::query()->where('email', 'budi@biwrawater.id')->firstOrFail();
    expect($user->hasRole('customer'))->toBeTrue()
        ->and($user->tokens)->toHaveCount(1);
});

test('login pelanggan mengembalikan token API', function () {
    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])
        ->assertOk()
        ->assertJsonStructure(['token', 'user'])
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.role', UserRole::Customer->value);
});

test('login driver mengembalikan status driver', function () {
    $user = User::factory()->driver()->create();
    Driver::factory()->for($user)->create();

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])
        ->assertOk()
        ->assertJsonPath('user.role', UserRole::Driver->value)
        ->assertJsonPath('user.driver_status', 'available');
});

test('login dengan password yang salah ditolak', function () {
    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'salahsekali',
    ])->assertStatus(422);
});

test('endpoint me membutuhkan token', function () {
    $this->getJson('/api/v1/me')->assertStatus(401);
});

test('me mengembalikan profil pengguna yang terautentikasi', function () {
    $user = User::factory()->create();

    $this->withToken(apiTokenFor($user))
        ->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.email', $user->email);
});

test('logout mencabut token', function () {
    $user = User::factory()->create();
    $token = apiTokenFor($user);
    $tokenId = $user->tokens()->first()->id;

    $this->withToken($token)
        ->postJson('/api/v1/auth/logout')
        ->assertOk();

    expect($user->tokens()->where('id', $tokenId)->exists())->toBeFalse();

    app('auth')->forgetGuards();

    $this->withToken($token)
        ->getJson('/api/v1/me')
        ->assertStatus(401);
});
