<?php

declare(strict_types=1);

use App\Models\User;
use App\Services\GoogleOAuthService;
use Laravel\Socialite\Two\User as SocialUser;

test('route google redirect mengarahkan ke halaman login Google', function () {
    $this->mock(GoogleOAuthService::class)
        ->shouldReceive('redirect')
        ->once()
        ->andReturn(
            redirect()->away('https://accounts.google.com/o/oauth2/auth?client_id=x'),
        );

    $this->get(route('auth.google.redirect'))
        ->assertRedirect('https://accounts.google.com/o/oauth2/auth?client_id=x');
});

test('route google callback login web dan mengarahkan ke dashboard', function () {
    $user = User::factory()->create(['email' => 'budi.google@gmail.com']);

    $fake = SocialUser::fake([
        'id' => 'google-789',
        'name' => 'Budi Google',
        'email' => 'budi.google@gmail.com',
    ]);

    $this->mock(GoogleOAuthService::class)
        ->shouldReceive('user')->once()->andReturn($fake)
        ->shouldReceive('resolveUser')->once()->with($fake)->andReturn($user);

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('dashboard.index'));

    $this->assertAuthenticatedAs($user);
});

test('route google callback dengan redirect mobile menghasilkan token deep link', function () {
    $user = User::factory()->create(['email' => 'budi.google@gmail.com']);

    $fake = SocialUser::fake([
        'id' => 'google-101',
        'name' => 'Budi Google',
        'email' => 'budi.google@gmail.com',
    ]);

    $this->mock(GoogleOAuthService::class)
        ->shouldReceive('redirect')->once()
        ->andReturn(redirect()->away('https://accounts.google.com/'))
        ->shouldReceive('user')->once()->andReturn($fake)
        ->shouldReceive('resolveUser')->once()->with($fake)->andReturn($user);

    $this->get(route('auth.google.redirect', ['redirect' => 'myapp://auth']));

    $response = $this->get(route('auth.google.callback'));
    $location = (string) $response->headers->get('Location');

    expect($location)->toStartWith('myapp://auth?token=');

    $this->assertDatabaseCount('personal_access_tokens', 1);
});

test('route google redirect menolak skema deep link yang tidak diizinkan', function () {
    $this->mock(GoogleOAuthService::class)
        ->shouldReceive('redirect')->never();

    $this->get(route('auth.google.redirect', ['redirect' => 'https://evil.example/auth']))
        ->assertStatus(400);
});
