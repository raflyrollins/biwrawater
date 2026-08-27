<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\DeliveryStatus;
use App\Enums\Permission;
use App\Enums\PhotoType;
use App\Models\Delivery;
use App\Models\Driver;
use App\Services\DeliveryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;
use RuntimeException;

class DeliveryController extends Controller
{
    public function __construct(private readonly DeliveryService $deliveryService) {}

    public function index(): Response
    {
        Head::title('Jadwal Pengiriman');

        return Inertia::render(
            'dashboard/Deliveries',
            $this->deliveryService->scheduleFor($this->currentDriver()),
        );
    }

    public function fill(Delivery $delivery): RedirectResponse
    {
        $this->authorizeDelivery($delivery);

        try {
            $this->deliveryService->startFilling($delivery);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Pengisian air dimulai.');
    }

    public function depart(Delivery $delivery): RedirectResponse
    {
        $this->authorizeDelivery($delivery);

        try {
            $this->deliveryService->depart($delivery);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Perjalanan dimulai.');
    }

    public function unload(Delivery $delivery): RedirectResponse
    {
        $this->authorizeDelivery($delivery);

        try {
            $this->deliveryService->startUnloading($delivery);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Penurunan air dimulai.');
    }

    public function deliver(Delivery $delivery): RedirectResponse
    {
        $this->authorizeDelivery($delivery);

        try {
            $this->deliveryService->deliver($delivery);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Pengiriman selesai.');
    }

    public function fail(Delivery $delivery): RedirectResponse
    {
        $this->authorizeDelivery($delivery);

        try {
            $this->deliveryService->fail($delivery);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('error', 'Pengiriman ditandai gagal. Pesanan dikembalikan ke antrean.');
    }

    public function cancelScheduled(Delivery $delivery): RedirectResponse
    {
        $this->authorizeAdmin();

        try {
            $this->deliveryService->cancelScheduled($delivery);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Tugas dibatalkan. Pesanan dikembalikan ke antrean.');
    }

    public function reassignDriver(Delivery $delivery, Request $request): RedirectResponse
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'driver_id' => ['required', 'exists:drivers,id'],
        ]);

        /** @var Driver $newDriver */
        $newDriver = Driver::findOrFail($validated['driver_id']);

        try {
            $this->deliveryService->reassignDriver($delivery, $newDriver);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Driver berhasil diganti.');
    }

    public function storePhoto(Request $request, Delivery $delivery): RedirectResponse
    {
        $this->authorizeDelivery($delivery);

        $validated = $request->validate([
            'type' => ['required', Rule::enum(PhotoType::class)],
            'photo' => ['required', 'image', 'max:4096'],
        ]);

        $type = PhotoType::from($validated['type']);

        $allowed = ($type === PhotoType::Filling && $delivery->status->is(DeliveryStatus::Filling))
            || ($type !== PhotoType::Filling && $delivery->status->is(DeliveryStatus::Unloading));

        if (! $allowed) {
            return back()->with('error', 'Foto hanya dapat diunggah pada tahap pengisian atau penurunan.');
        }

        /** @var UploadedFile|null $photo */
        $photo = $request->file('photo');

        if (! $photo instanceof UploadedFile) {
            return back()->with('error', 'Foto tidak ditemukan.');
        }

        $path = $photo->store("deliveries/{$delivery->uuid}", 'public');

        if ($path === false) {
            return back()->with('error', 'Gagal menyimpan foto. Silakan coba lagi.');
        }

        $delivery->photos()->create([
            'type' => $type,
            'path' => $path,
        ]);

        return back()->with('success', 'Foto bukti berhasil diunggah.');
    }

    private function currentDriver(): Driver
    {
        return auth()->user()->driver;
    }

    private function authorizeDelivery(Delivery $delivery): void
    {
        $user = auth()->user();

        if ($user->hasPermissionTo(Permission::DashboardView)) {
            return;
        }

        abort_unless($delivery->driver_id === $this->currentDriver()->id, 404);
    }

    private function authorizeAdmin(): void
    {
        abort_unless(auth()->user()->hasPermissionTo(Permission::DeliveriesUpdateStatus), 403);
    }
}
