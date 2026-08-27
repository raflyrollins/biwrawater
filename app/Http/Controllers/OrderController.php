<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\Permission;
use App\Events\OrderStatusChanged;
use App\Models\Driver;
use App\Models\Order;
use App\Models\Truck;
use App\Services\DeliveryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;
use RuntimeException;

class OrderController extends Controller
{
    public function __construct(private readonly DeliveryService $deliveryService) {}

    public function index(Request $request): Response
    {
        Head::title('Pesanan');

        $statusQuery = $request->query('status');
        $statuses = is_array($statusQuery)
            ? array_values(array_filter(
                $statusQuery,
                fn ($value) => is_string($value) && OrderStatus::tryFrom($value) !== null,
            ))
            : (is_string($statusQuery) && OrderStatus::tryFrom($statusQuery) !== null
                ? [$statusQuery]
                : []);
        $search = $request->query('search');

        $orders = Order::query()
            ->with(['user:id,name', 'delivery', 'items'])
            ->when($statuses !== [], fn ($query) => $query->whereIn('status', $statuses))
            ->when(is_string($search) && $search !== '', fn ($query) => $query
                ->where(function ($q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
                }))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('dashboard/orders/Index', [
            'orders' => $orders,
            'filters' => [
                'status' => $statuses,
                'search' => $search,
            ],
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        $user = $request->user();

        if (! $user->hasPermissionTo(Permission::DashboardView)) {
            abort_unless($order->user_id === $user->id, 404);
        }

        Head::title('Detail Pesanan');

        $order->load(['user', 'delivery.truck', 'delivery.driver.user', 'items', 'payments']);

        $order->setAttribute(
            'payment_due_passed',
            $order->payment_due_at !== null && $order->payment_due_at->isPast(),
        );

        $totalLiters = $order->items->sum(fn ($item) => ($item->volume_liters ?? 0) * $item->quantity);

        return Inertia::render('dashboard/orders/Show', [
            'order' => $order,
            'assignOptions' => [
                'trucks' => Truck::query()
                    ->active()
                    ->where('capacity_liters', $totalLiters)
                    ->with('defaultDriver.user:id,name')
                    ->orderBy('name')
                    ->get(['id', 'name', 'plate_number', 'capacity_liters', 'default_driver_id']),
                'drivers' => Driver::query()
                    ->available()
                    ->with('user:id,name')
                    ->orderBy('user_id')
                    ->get(['id', 'user_id']),
            ],
        ]);
    }

    public function assign(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'truck_id' => ['required', 'exists:trucks,id'],
            'driver_id' => ['nullable', 'exists:drivers,id'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $truck = Truck::query()->whereKey($validated['truck_id'])->firstOrFail();

        $driver = null;
        if (! empty($validated['driver_id'])) {
            $driver = Driver::query()->whereKey($validated['driver_id'])->firstOrFail();
        }

        try {
            $this->deliveryService->assign(
                $order,
                $truck,
                $validated['note'] ?? null,
                $driver,
            );
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Pengiriman ditugaskan dan pesanan dikonfirmasi.');
    }

    public function confirm(Request $request, Order $order): RedirectResponse
    {
        if (! $order->status->is(OrderStatus::Pending)) {
            return back()->with('error', 'Hanya pesanan berstatus menunggu yang dapat dikonfirmasi.');
        }

        $order->update([
            'status' => OrderStatus::Confirmed,
            'payment_due_at' => now()->addMinutes((int) config('midtrans.payment_timeout_minutes', 20)),
        ]);

        OrderStatusChanged::dispatch($order, OrderStatus::Pending);

        return back()->with('success', 'Pesanan dikonfirmasi. Pelanggan kini dapat melakukan pembayaran.');
    }

    public function cancel(Request $request, Order $order): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasPermissionTo(Permission::DashboardView)) {
            abort_unless($order->user_id === $user->id, 404);

            if (! $order->status->is(OrderStatus::Pending)) {
                return back()->with('error', 'Hanya pesanan berstatus menunggu yang dapat dibatalkan.');
            }
        }

        if ($order->status->is(OrderStatus::Cancelled)) {
            return back()->with('error', 'Pesanan sudah dibatalkan.');
        }

        $previousStatus = $order->status;

        $order->update([
            'status' => OrderStatus::Cancelled,
        ]);

        OrderStatusChanged::dispatch($order, $previousStatus);

        return back()->with('success', 'Pesanan dibatalkan.');
    }
}
