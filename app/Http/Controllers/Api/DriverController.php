<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\DeliveryStatus;
use App\Enums\DriverStatus;
use App\Enums\PhotoType;
use App\Http\Controllers\Api\Concerns\SerializesDeliveries;
use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Driver;
use App\Services\DeliveryService;
use App\Services\DriverStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use RuntimeException;

class DriverController extends Controller
{
    use SerializesDeliveries;

    public function __construct(
        private readonly DeliveryService $deliveryService,
        private readonly DriverStatusService $driverStatus,
    ) {}

    public function deliveries(Request $request): JsonResponse
    {
        $schedule = $this->deliveryService->scheduleFor($this->currentDriver($request));

        $active = $schedule['active']
            ->map(fn (Delivery $delivery): array => $this->serializeDelivery(
                $delivery,
                (int) $delivery->getAttribute('queue_position'),
                (bool) $delivery->getAttribute('is_current'),
            ))
            ->values();

        $history = $schedule['history']
            ->map(fn (Delivery $delivery): array => $this->serializeDelivery($delivery))
            ->values();

        return response()->json([
            'driver_status' => $schedule['driver_status'],
            'active' => $active,
            'history' => $history,
        ]);
    }

    public function updateStatus(Request $request): JsonResponse
    {
        $driver = $this->currentDriver($request);

        $validated = $request->validate([
            'status' => ['required', Rule::in([
                DriverStatus::Available->value,
                DriverStatus::OffDuty->value,
            ])],
        ]);

        $newStatus = DriverStatus::from($validated['status']);

        $error = $this->driverStatus->change($driver, $newStatus);

        if ($error !== null) {
            return response()->json(['message' => $error], 422);
        }

        return response()->json([
            'message' => 'Status Anda diperbarui.',
            'driver_status' => $driver->getAttribute('status')->value,
        ]);
    }

    public function fill(Request $request, Delivery $delivery): JsonResponse
    {
        return $this->transition($request, $delivery, 'startFilling', 'Pengisian air dimulai.');
    }

    public function depart(Request $request, Delivery $delivery): JsonResponse
    {
        return $this->transition($request, $delivery, 'depart', 'Perjalanan dimulai.');
    }

    public function unload(Request $request, Delivery $delivery): JsonResponse
    {
        return $this->transition($request, $delivery, 'startUnloading', 'Penurunan air dimulai.');
    }

    public function deliver(Request $request, Delivery $delivery): JsonResponse
    {
        return $this->transition($request, $delivery, 'deliver', 'Pengiriman selesai.');
    }

    public function fail(Request $request, Delivery $delivery): JsonResponse
    {
        $this->authorizeDelivery($request, $delivery);

        try {
            $this->ensureFifo($request, $delivery);
            $this->deliveryService->fail($delivery);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Pengiriman ditandai gagal. Pesanan dikembalikan ke antrean.',
            'delivery' => $this->serializeDelivery($delivery->refresh()),
        ]);
    }

    public function photos(Request $request, Delivery $delivery): JsonResponse
    {
        $this->authorizeDelivery($request, $delivery);

        try {
            $this->ensureFifo($request, $delivery);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $validated = $request->validate([
            'type' => ['required', Rule::enum(PhotoType::class)],
            'photo' => ['required', 'image', 'max:4096'],
        ]);

        $type = PhotoType::from($validated['type']);

        $allowed = ($type === PhotoType::Filling && $delivery->status->is(DeliveryStatus::Filling))
            || ($type !== PhotoType::Filling && $delivery->status->is(DeliveryStatus::Unloading));

        if (! $allowed) {
            return response()->json([
                'message' => 'Foto hanya dapat diunggah pada tahap pengisian atau penurunan.',
            ], 422);
        }

        /** @var UploadedFile|null $photo */
        $photo = $request->file('photo');

        if (! $photo instanceof UploadedFile) {
            return response()->json(['message' => 'Foto tidak ditemukan.'], 422);
        }

        $path = $photo->store("deliveries/{$delivery->uuid}", 'public');

        if ($path === false) {
            return response()->json(['message' => 'Gagal menyimpan foto. Silakan coba lagi.'], 422);
        }

        $photoModel = $delivery->photos()->create([
            'type' => $type,
            'path' => $path,
        ]);

        return response()->json([
            'message' => 'Foto bukti berhasil diunggah.',
            'photo' => [
                'id' => $photoModel->id,
                'type' => $photoModel->type->value,
                'type_label' => $photoModel->type->label(),
                'url' => $photoModel->photo_url,
            ],
        ], 201);
    }

    private function transition(
        Request $request,
        Delivery $delivery,
        string $method,
        string $message,
    ): JsonResponse {
        $this->authorizeDelivery($request, $delivery);

        try {
            $this->ensureFifo($request, $delivery);
            $this->deliveryService->{$method}($delivery);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => $message,
            'delivery' => $this->serializeDelivery($delivery->refresh()),
        ]);
    }

    private function currentDriver(Request $request): Driver
    {
        $driver = $request->user()->driver;

        if ($driver === null) {
            abort(403, 'Akun ini bukan driver.');
        }

        return $driver;
    }

    private function authorizeDelivery(Request $request, Delivery $delivery): void
    {
        abort_unless($delivery->driver_id === $this->currentDriver($request)->id, 404);
    }

    private function ensureFifo(Request $request, Delivery $delivery): void
    {
        $driver = $this->currentDriver($request);

        $current = Delivery::query()
            ->where('driver_id', $driver->id)
            ->active()
            ->orderBy('scheduled_at')
            ->orderBy('id')
            ->first();

        if ($current === null || $current->id !== $delivery->id) {
            throw new RuntimeException('Selesaikan tugas paling awal terlebih dahulu (FIFO).');
        }
    }
}
