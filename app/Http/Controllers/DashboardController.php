<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\DeliveryStatus;
use App\Enums\OrderStatus;
use App\Enums\Permission;
use App\Enums\TruckStatus;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\PromoCode;
use App\Models\Promotion;
use App\Models\Truck;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->hasPermissionTo(Permission::DeliveriesView)) {
            return $this->deliveries();
        }

        if ($user->hasPermissionTo(Permission::DashboardView)) {
            return $this->summary();
        }

        return $this->customerOrders();
    }

    private function customerOrders(): Response
    {
        $user = auth()->user();

        Head::title('Dashboard');

        $orders = Order::query()
            ->where('user_id', $user->id)
            ->with(['delivery', 'items'])
            ->latest()
            ->paginate(10);

        return Inertia::render('dashboard/Index', [
            'orders' => $orders,
            'stats' => [
                'total_orders' => Order::query()->where('user_id', $user->id)->count(),
                'pending_count' => Order::query()
                    ->where('user_id', $user->id)
                    ->where('status', OrderStatus::Pending)
                    ->count(),
            ],
        ]);
    }

    private function summary(): Response
    {
        Head::title('Ringkasan');

        $revenue = (int) Order::query()
            ->where('status', OrderStatus::Delivered)
            ->sum('grand_total');

        return Inertia::render('dashboard/Summary', [
            'stats' => [
                'revenue' => $revenue,
                'pending_orders' => Order::query()->where('status', OrderStatus::Pending)->count(),
                'today_deliveries' => Delivery::query()
                    ->whereDate('scheduled_at', today())
                    ->whereIn('status', [DeliveryStatus::Scheduled, DeliveryStatus::OnTheWay])
                    ->count(),
                'active_promos' => Promotion::query()->active()->count() + PromoCode::query()->active()->count(),
                'trucks_available' => Truck::query()->active()->where('status', TruckStatus::Available)->count(),
            ],
            'recentOrders' => Order::query()
                ->with(['user:id,name', 'delivery'])
                ->latest()
                ->limit(6)
                ->get(),
            'todaySchedule' => Delivery::query()
                ->with(['order:id,order_number,status', 'truck:id,name,plate_number', 'driver:id,user_id', 'driver.user:id,name'])
                ->whereDate('scheduled_at', today())
                ->orderBy('scheduled_at')
                ->get(),
        ]);
    }

    private function deliveries(): Response
    {
        Head::title('Jadwal Pengiriman');

        $driverId = auth()->user()->driver->id;

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
}
