<?php

use App\Enums\UserRole;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('halaman login dapat diakses', function () {
    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/Auth')
            ->where('mode', 'login'));
});

test('halaman register dapat diakses', function () {
    $this->get('/register')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/Auth')
            ->where('mode', 'register'));
});

test('user dapat mendaftar', function () {
    $this->post('/register', [
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'password' => 'rahasia123',
        'password_confirmation' => 'rahasia123',
    ])->assertRedirect(route('dashboard.index'));

    $this->assertDatabaseHas('users', ['email' => 'budi@example.com']);
    $this->assertAuthenticated();
});

test('pelanggan dapat login dan diarahkan ke dashboard', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('dashboard.index'));

    $this->assertAuthenticatedAs($user);
});

test('admin dapat login dan diarahkan ke dashboard', function () {
    $user = User::factory()->admin()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('dashboard.index'));

    $this->assertAuthenticatedAs($user);
});

test('driver dapat login dan diarahkan ke dashboard', function () {
    $user = User::factory()->driver()->create();
    Driver::factory()->for($user)->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('dashboard.index'));

    $this->assertAuthenticatedAs($user);
});

test('login gagal dengan kredensial salah', function () {
    $this->post('/login', [
        'email' => 'tidakada@example.com',
        'password' => 'salah',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('user dapat logout', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/logout')
        ->assertRedirect(route('home'));

    $this->assertGuest();
});

test('user tanpa role terdaftar selalu menjadi pelanggan', function () {
    $this->post('/register', [
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'password' => 'rahasia123',
        'password_confirmation' => 'rahasia123',
    ]);

    $this->assertDatabaseHas('users', [
        'email' => 'budi@example.com',
        'role' => UserRole::Customer,
    ]);
});
