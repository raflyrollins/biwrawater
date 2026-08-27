<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\DeliveryStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Truck;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;

class QueueController extends Controller
{
    public function index(Request $request): Response
    {
        Head::title('Antrian Pengiriman');

        $activeDeliveries = [
            DeliveryStatus::Scheduled,
            DeliveryStatus::Filling,
            DeliveryStatus::OnTheWay,
            DeliveryStatus::Unloading,
        ];

        $pendingOrders = Order::query()
            ->with(['user:id,name,phone', 'zone:id,name,delivery_fee', 'items'])
            ->where('status', OrderStatus::Confirmed)
            ->where('payment_status', PaymentStatus::Paid)
            ->whereDoesntHave('delivery', fn (Builder $q) => $q->whereIn('status', $activeDeliveries))
            ->orderBy('updated_at')
            ->get();

        $assignedOrders = Order::query()
            ->with([
                'user:id,name,phone',
                'zone:id,name,delivery_fee',
                'items',
                'delivery' => fn ($q) => $q->whereIn('status', $activeDeliveries)
                    ->with([
                        'truck:id,name,plate_number,capacity_liters',
                        'driver.user:id,name',
                    ]),
            ])
            ->where('status', OrderStatus::Confirmed)
            ->where('payment_status', PaymentStatus::Paid)
            ->whereHas('delivery', fn (Builder $q) => $q->whereIn('status', $activeDeliveries))
            ->orderBy('updated_at')
            ->get();

        foreach ([$pendingOrders, $assignedOrders] as $collection) {
            $collection->each(function ($order) {
                $totalLiters = $order->items->sum(fn ($item) => ($item->volume_liters ?? 0) * $item->quantity);
                $order->setAttribute('total_liters', $totalLiters);
                $order->setRelation('items', $order->items->only(['id', 'volume_liters', 'quantity', 'service_name']));
            });
        }

        $truckUnits = Truck::query()
            ->active()
            ->with([
                'defaultDriver.user:id,name',
                'deliveries' => fn ($q) => $q->whereIn('status', $activeDeliveries)
                    ->with([
                        'order:id,order_number',
                        'driver.user:id,name',
                    ]),
            ])
            ->withCount(['deliveries' => fn ($q) => $q->whereIn('status', $activeDeliveries)])
            ->orderBy('name')
            ->get();

        return Inertia::render('dashboard/Queue', [
            'pendingOrders' => $pendingOrders,
            'assignedOrders' => $assignedOrders,
            'truckUnits' => $truckUnits,
        ]);
    }
}
