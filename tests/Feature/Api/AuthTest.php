<?php

use App\Enums\UserRole;
use App\Models\Driver;
use App\Models\User;
use App\Services\GoogleOAuthService;
use Laravel\Socialite\Two\User as SocialUser;

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

test('login google membuat akun pelanggan baru dengan token', function () {
    $fake = SocialUser::fake([
        'id' => 'google-123',
        'name' => 'Budi Google',
        'email' => 'budi.google@gmail.com',
        'avatar' => 'https://example.com/avatar.png',
        'token' => 'valid-google-token',
    ]);

    $this->mock(GoogleOAuthService::class)
        ->shouldReceive('userFromToken')
        ->with('valid-google-token')
        ->andReturn($fake)
        ->shouldReceive('resolveUser')
        ->with($fake)
        ->passthru();

    $this->postJson('/api/v1/auth/social/google', [
        'access_token' => 'valid-google-token',
    ])
        ->assertOk()
        ->assertJsonStructure([
            'token',
            'user' => ['id', 'name', 'email', 'role'],
        ])
        ->assertJsonPath('user.role', UserRole::Customer->value)
        ->assertJsonPath('user.avatar', 'https://example.com/avatar.png');

    $this->assertDatabaseHas('users', [
        'email' => 'budi.google@gmail.com',
        'google_id' => 'google-123',
        'role' => UserRole::Customer->value,
    ]);

    $user = User::query()->where('email', 'budi.google@gmail.com')->firstOrFail();
    expect($user->hasRole('customer'))->toBeTrue()
        ->and($user->tokens)->toHaveCount(1);
});

test('login google menghubungkan google_id ke akun yang sudah ada', function () {
    $user = User::factory()->create(['email' => 'budi.google@gmail.com']);

    $fake = SocialUser::fake([
        'id' => 'google-456',
        'name' => 'Budi Google',
        'email' => 'budi.google@gmail.com',
        'token' => 'another-google-token',
    ]);

    $this->mock(GoogleOAuthService::class)
        ->shouldReceive('userFromToken')
        ->with('another-google-token')
        ->andReturn($fake)
        ->shouldReceive('resolveUser')
        ->with($fake)
        ->passthru();

    $this->postJson('/api/v1/auth/social/google', [
        'access_token' => 'another-google-token',
    ])
        ->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.role', UserRole::Customer->value);

    expect($user->refresh()->google_id)->toBe('google-456');
    expect($user->tokens)->toHaveCount(1);
});

test('login google dengan akun tanpa email ditolak', function () {
    $fake = SocialUser::fake([
        'id' => 'google-null-email',
        'name' => 'Tanpa Email',
        'email' => null,
        'token' => 'token-tanpa-email',
    ]);

    $this->mock(GoogleOAuthService::class)
        ->shouldReceive('userFromToken')
        ->with('token-tanpa-email')
        ->andReturn($fake)
        ->shouldReceive('resolveUser')
        ->with($fake)
        ->passthru();

    $this->postJson('/api/v1/auth/social/google', [
        'access_token' => 'token-tanpa-email',
    ])->assertStatus(422);
});

test('login google mewajibkan access_token', function () {
    $this->postJson('/api/v1/auth/social/google', [])
        ->assertStatus(422);
});
