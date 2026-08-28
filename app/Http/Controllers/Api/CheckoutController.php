<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\SerializesOrders;
use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Services\OperatingScheduleService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class CheckoutController extends Controller
{
    use SerializesOrders;

    public function __construct(
        private readonly OrderService $orderService,
        private readonly OperatingScheduleService $schedule,
    ) {}

    public function validatePromo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'promo_code' => ['required', 'string', 'max:100'],
        ]);

        $service = Service::query()
            ->active()
            ->whereKey((int) $validated['service_id'])
            ->first();

        if ($service === null) {
            return response()->json([
                'message' => 'Varian tangki tidak tersedia.',
            ], 422);
        }

        try {
            $preview = $this->orderService->previewPromoCode(
                $service->price,
                (string) $validated['promo_code'],
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['preview' => $preview]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->schedule->isOpenNow()) {
            return response()->json([
                'message' => $this->schedule->closedMessage(),
            ], 422);
        }

        $validated = $request->validate([
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'address_id' => ['nullable', 'integer', 'exists:addresses,id'],
            'zone_id' => ['required_without:address_id', 'nullable', 'integer', 'exists:zones,id'],
            'label' => ['nullable', 'required_without:address_id', 'string', 'max:50'],
            'recipient_name' => ['nullable', 'required_without:address_id', 'string', 'max:255'],
            'phone' => ['nullable', 'required_without:address_id', 'string', 'max:20', 'regex:/^\+?[0-9\s]+$/'],
            'street_address' => ['nullable', 'required_without:address_id', 'string', 'max:255'],
            'district' => ['nullable', 'required_without:address_id', 'string', 'max:255'],
            'subdistrict' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'required_without:address_id', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'notes' => ['nullable', 'string', 'max:255'],
            'promo_code' => ['nullable', 'string', 'max:100'],
            'customer_note' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $service = Service::query()
            ->whereKey((int) $validated['service_id'])
            ->firstOrFail();

        if (! empty($validated['address_id'])) {
            $address = $user->addresses()
                ->whereKey((int) $validated['address_id'])
                ->firstOrFail();
        } else {
            $address = $user->addresses()->create([
                'label' => $validated['label'],
                'recipient_name' => $validated['recipient_name'],
                'phone' => $validated['phone'],
                'street_address' => $validated['street_address'],
                'district' => $validated['district'],
                'subdistrict' => $validated['subdistrict'] ?? null,
                'city' => $validated['city'],
                'postal_code' => $validated['postal_code'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'zone_id' => $validated['zone_id'] ?? null,
                'is_default' => ! $user->addresses()->exists(),
            ]);
        }

        try {
            $order = $this->orderService->create(
                $user,
                $service,
                $address,
                $validated['promo_code'] ?? null,
                $validated['customer_note'] ?? null,
                isset($validated['zone_id']) ? (int) $validated['zone_id'] : null,
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Pesanan berhasil dibuat. Tunggu konfirmasi admin untuk melanjutkan pembayaran.',
            'order' => $this->serializeOrder($order),
        ], 201);
    }
}
