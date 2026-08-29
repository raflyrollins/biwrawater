<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Role;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Laravel\Socialite\Two\User as SocialUser;
use RuntimeException;

class GoogleOAuthService
{
    /**
     * Alihkan pengguna ke halaman login Google.
     */
    public function redirect(): RedirectResponse
    {
        $driver = $this->driver();

        return $driver->stateless()->redirect();
    }

    /**
     * Ambil profil pengguna Google setelah callback.
     *
     * @throws RuntimeException ketika verifikasi gagal
     */
    public function user(): SocialUser
    {
        $user = $this->driver()->stateless()->user();

        if (! $user instanceof SocialUser) {
            throw new RuntimeException('Respons verifikasi Google tidak valid.');
        }

        return $user;
    }

    /**
     * Verifikasi access token Google dan kembalikan data pengguna Google.
     *
     * @throws RuntimeException ketika token tidak valid
     */
    public function userFromToken(string $accessToken): SocialUser
    {
        return $this->driver()->stateless()->userFromToken($accessToken);
    }

    /**
     * Cari user berdasarkan email Google; buat akun baru bila belum ada.
     */
    public function resolveUser(SocialUser $socialUser): User
    {
        $email = $socialUser->getEmail();

        if ($email === null) {
            throw new RuntimeException('Akun Google tidak memiliki alamat email.');
        }

        $user = User::query()->where('email', $email)->first();

        if ($user === null) {
            $user = User::create([
                'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? $email,
                'email' => $email,
                'password' => Str::password(),
                'role' => UserRole::Customer,
                'google_id' => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar(),
            ]);

            $user->assignRole(Role::Customer);
        } else {
            $user->update([
                'google_id' => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar() ?? $user->avatar,
            ]);
        }

        return $user;
    }

    private function driver(): GoogleProvider
    {
        $driver = Socialite::driver('google');

        if (! $driver instanceof GoogleProvider) {
            throw new RuntimeException('Provider Google tidak tersedia.');
        }

        return $driver;
    }
}
