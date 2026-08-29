<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\GoogleOAuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class GoogleOAuthController extends Controller
{
    public function __construct(
        private readonly GoogleOAuthService $googleOAuth,
    ) {}

    /**
     * Alihkan pengguna ke halaman login Google.
     *
     * Parameter `redirect` (opsional) digunakan untuk alur aplikasi mobile:
     * sebuah deep link (skema kustom) yang akan menerima token setelah login.
     */
    public function redirect(Request $request): RedirectResponse
    {
        $mobileRedirect = $request->query('redirect');

        if (is_string($mobileRedirect) && $mobileRedirect !== '') {
            if (! $this->isAllowedMobileRedirect($mobileRedirect)) {
                abort(400, 'Redirect tidak diizinkan.');
            }

            $request->session()->put('google_redirect', $mobileRedirect);
        } else {
            $request->session()->forget('google_redirect');
        }

        return $this->googleOAuth->redirect();
    }

    /**
     * Proses callback setelah login Google berhasil.
     */
    public function callback(Request $request): RedirectResponse
    {
        try {
            $socialUser = $this->googleOAuth->user();
            $user = $this->googleOAuth->resolveUser($socialUser);
        } catch (RuntimeException $e) {
            return redirect()->route('login')
                ->withErrors(['email' => $e->getMessage()]);
        }

        $mobileRedirect = $request->session()->pull('google_redirect');

        if (is_string($mobileRedirect)) {
            $token = $user->createToken('mobile')->plainTextToken;

            return redirect()->away($this->appendToken($mobileRedirect, $token));
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard.index'));
    }

    private function isAllowedMobileRedirect(string $redirect): bool
    {
        $scheme = (string) config('services.google.mobile_redirect_scheme');

        return str_starts_with($redirect, $scheme.'://');
    }

    private function appendToken(string $redirect, string $token): string
    {
        return $redirect.(str_contains($redirect, '?') ? '&' : '?').'token='.$token;
    }
}
