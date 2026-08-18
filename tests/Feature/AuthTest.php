<?php

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
    ])->assertRedirect(route('home'));

    $this->assertDatabaseHas('users', ['email' => 'budi@example.com']);
    $this->assertAuthenticated();
});

test('user dapat login', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('home'));

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
