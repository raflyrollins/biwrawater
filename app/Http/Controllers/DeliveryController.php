<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\DeliveryStatus;
use App\Models\Delivery;
use App\Models\Driver;
use App\Services\DeliveryService;
use Illuminate\Http\RedirectResponse;
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

        $driverId = $this->currentDriver()->id;

        return Inertia::render('dashboard/Deliveries', [
            'active' => Delivery::query()
                ->with(['order:id,order_number,address_snapshot,status', 'truck:id,name,plate_number'])
                ->where('driver_id', $driverId)
                ->whereIn('status', [DeliveryStatus::Scheduled, DeliveryStatus::OnTheWay])
                ->orderBy('scheduled_at')
                ->get(),
            'history' => Delivery::query()
                ->with(['order:id,order_number,status'])
                ->where('driver_id', $driverId)
                ->whereIn('status', [DeliveryStatus::Delivered, DeliveryStatus::Failed])
                ->latest()
                ->limit(10)
                ->get(),
        ]);
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

    private function currentDriver(): Driver
    {
        return auth()->user()->driver;
    }

    private function authorizeDelivery(Delivery $delivery): void
    {
        abort_unless($delivery->driver_id === $this->currentDriver()->id, 404);
    }
}
