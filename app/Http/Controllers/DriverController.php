<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\DriverStatus;
use App\Enums\Role;
use App\Enums\UserRole;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;

class DriverController extends Controller
{
    public function index(): Response
    {
        Head::title('Driver');

        return Inertia::render('dashboard/drivers/Index', [
            'drivers' => Driver::query()
                ->with('user:id,name,email,phone')
                ->latest()
                ->paginate(15),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateDriver($request);

        DB::transaction(function () use ($validated): void {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => $validated['password'],
                'role' => UserRole::Driver,
            ]);

            $user->assignRole(Role::Driver);

            Driver::create([
                'user_id' => $user->id,
                'license_number' => $validated['license_number'] ?? null,
                'status' => DriverStatus::Available,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return back()->with('success', 'Driver ditambahkan.');
    }

    public function update(Request $request, Driver $driver): RedirectResponse
    {
        $validated = $this->validateDriver($request, $driver);

        $driver->user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            ...(isset($validated['password'])
                ? ['password' => $validated['password']]
                : []),
        ]);

        $driver->update([
            'license_number' => $validated['license_number'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Driver diperbarui.');
    }

    public function toggle(Driver $driver): RedirectResponse
    {
        if ($driver->status->is(DriverStatus::OnDuty)) {
            return back()->with('error', 'Driver sedang bertugas, status tidak dapat diubah.');
        }

        $driver->update([
            'status' => $driver->status->is(DriverStatus::Available)
                ? DriverStatus::OffDuty
                : DriverStatus::Available,
        ]);

        return back()->with('success', 'Status driver diperbarui.');
    }

    public function destroy(Driver $driver): RedirectResponse
    {
        if ($driver->status->is(DriverStatus::OnDuty)) {
            return back()->with('error', 'Driver sedang bertugas, tidak dapat dinonaktifkan.');
        }

        $driver->update([
            'status' => DriverStatus::OffDuty,
        ]);

        return back()->with('success', 'Driver dinonaktifkan.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateDriver(Request $request, ?Driver $driver = null): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($driver?->user_id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'license_number' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];

        if ($driver === null) {
            $rules['password'] = ['required', Password::min(8)];
        } else {
            $rules['password'] = ['nullable', Password::min(8)];
        }

        return $request->validate($rules);
    }
}
