<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Models\OperatingHour;
use App\Models\Promotion;
use App\Models\Service;
use App\Services\OperatingScheduleService;
use Illuminate\Http\JsonResponse;

class CatalogController extends Controller
{
    public function __construct(private readonly OperatingScheduleService $schedule) {}

    public function services(): JsonResponse
    {
        $services = Service::query()
            ->active()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Service $service): array => [
                'id' => $service->id,
                'name' => $service->name,
                'slug' => $service->slug,
                'description' => $service->description,
                'volume_liters' => $service->volume_liters,
                'price' => $service->price,
            ])
            ->values();

        return response()->json(['services' => $services]);
    }

    public function promotions(): JsonResponse
    {
        $promotions = Promotion::query()
            ->active()
            ->orderByDesc('value')
            ->get()
            ->map(fn (Promotion $promotion): array => [
                'id' => $promotion->id,
                'name' => $promotion->name,
                'description' => $promotion->description,
                'type' => $promotion->type->value,
                'value' => $promotion->value,
                'min_order_total' => $promotion->min_order_total,
                'max_discount_amount' => $promotion->max_discount_amount,
            ])
            ->values();

        return response()->json(['promotions' => $promotions]);
    }

    public function config(): JsonResponse
    {
        $hours = $this->schedule->weeklyHours()
            ->map(fn (OperatingHour $hour): array => [
                'day_of_week' => $hour->day_of_week->value,
                'is_closed' => $hour->is_closed,
                'opens_at' => $hour->opens_at,
                'closes_at' => $hour->closes_at,
            ])
            ->values();

        $holidays = Holiday::query()
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->get()
            ->map(fn (Holiday $holiday): array => [
                'date' => $holiday->date->toDateString(),
                'name' => $holiday->name,
            ])
            ->values();

        return response()->json([
            'schedule_status' => [
                'is_open' => $this->schedule->isOpenNow(),
                'message' => $this->schedule->closedMessage(),
            ],
            'operating_hours' => $hours,
            'holidays' => $holidays,
        ]);
    }
}
