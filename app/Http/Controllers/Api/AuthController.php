<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GoogleOAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class AuthController extends Controller
{
    public function __construct(
        private readonly GoogleOAuthService $googleOAuth,
    ) {}

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => $validated['password'],
            'role' => UserRole::Customer,
        ]);

        $user->assignRole(Role::Customer);

        return response()->json([
            'token' => $user->createToken('mobile')->plainTextToken,
            'user' => $this->userPayload($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        return response()->json([
            'token' => $user->createToken('mobile')->plainTextToken,
            'user' => $this->userPayload($user),
        ]);
    }

    public function socialGoogle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'access_token' => ['required', 'string'],
        ]);

        try {
            $socialUser = $this->googleOAuth->userFromToken($validated['access_token']);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'access_token' => __('Gagal memverifikasi akun Google.'),
            ]);
        }

        try {
            $user = $this->googleOAuth->resolveUser($socialUser);
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages([
                'access_token' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'token' => $user->createToken('mobile')->plainTextToken,
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        $payload = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'role' => $user->role->value,
        ];

        $driver = $user->driver;

        if ($driver !== null) {
            $payload['driver_status'] = $driver->status->value;
        }

        return $payload;
    }
}
