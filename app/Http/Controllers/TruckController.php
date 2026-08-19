<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\TruckStatus;
use App\Models\Truck;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;

class TruckController extends Controller
{
    public function index(): Response
    {
        Head::title('Armada');

        return Inertia::render('dashboard/trucks/Index', [
            'trucks' => Truck::query()
                ->latest()
                ->paginate(15),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateTruck($request);

        Truck::create($validated);

        return back()->with('success', 'Armada ditambahkan.');
    }

    public function update(Request $request, Truck $truck): RedirectResponse
    {
        $validated = $this->validateTruck($request, $truck);

        $truck->update($validated);

        return back()->with('success', 'Armada diperbarui.');
    }

    public function toggle(Truck $truck): RedirectResponse
    {
        if ($truck->status->is(TruckStatus::Assigned)) {
            return back()->with('error', 'Armada sedang bertugas, status tidak dapat diubah.');
        }

        $truck->update([
            'status' => $truck->status->is(TruckStatus::Available)
                ? TruckStatus::Maintenance
                : TruckStatus::Available,
        ]);

        return back()->with('success', 'Status armada diperbarui.');
    }

    public function destroy(Truck $truck): RedirectResponse
    {
        if ($truck->status->is(TruckStatus::Assigned)) {
            return back()->with('error', 'Armada sedang bertugas, tidak dapat dinonaktifkan.');
        }

        $truck->update([
            'status' => TruckStatus::Retired,
        ]);

        return back()->with('success', 'Armada dinonaktifkan.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateTruck(Request $request, ?Truck $truck = null): array
    {
        return $request->validate([
            'plate_number' => ['required', 'string', 'max:15', Rule::unique('trucks', 'plate_number')->ignore($truck)],
            'name' => ['required', 'string', 'max:255'],
            'capacity_liters' => ['required', 'integer', 'min:1'],
            'status' => ['sometimes', Rule::enum(TruckStatus::class)],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);
    }
}
