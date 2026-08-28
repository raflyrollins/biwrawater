<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Events\OrderStatusChanged;
use App\Http\Controllers\Api\Concerns\SerializesOrders;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class OrderController extends Controller
{
    use SerializesOrders;

    public function __construct(private readonly MidtransService $midtransService) {}

    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with(['items', 'delivery'])
            ->latest()
            ->paginate(15);

        $serialized = collect($orders->items())
            ->map(fn (Order $order): array => $this->serializeOrder($order))
            ->values();

        return response()->json([
            'orders' => $serialized,
            'pagination' => [
                'total' => $orders->total(),
                'per_page' => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->assertOwnedBy($request, $order);

        $order->load(['delivery.truck', 'delivery.photos']);

        return response()->json([
            'order' => $this->serializeOrder($order),
        ]);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        $this->assertOwnedBy($request, $order);

        if (! $order->status->is(OrderStatus::Pending)) {
            return response()->json([
                'message' => 'Hanya pesanan berstatus menunggu yang dapat dibatalkan.',
            ], 422);
        }

        $previousStatus = $order->status;

        $order->update(['status' => OrderStatus::Cancelled]);

        OrderStatusChanged::dispatch($order, $previousStatus);

        return response()->json([
            'message' => 'Pesanan dibatalkan.',
            'order' => $this->serializeOrder($order),
        ]);
    }

    public function pay(Request $request, Order $order): JsonResponse
    {
        $this->assertOwnedBy($request, $order);

        if (! $order->status->is(OrderStatus::Confirmed)) {
            return response()->json(['message' => 'Pesanan belum dikonfirmasi admin.'], 422);
        }

        if ($order->payment_status->is(PaymentStatus::Paid)) {
            return response()->json(['message' => 'Pesanan sudah lunas.'], 422);
        }

        if ($order->payment_due_at !== null && $order->payment_due_at->isPast()) {
            return response()->json(['message' => 'Batas waktu pembayaran telah lewat.'], 422);
        }

        $order->payments()->firstOrCreate(
            [
                'method' => PaymentMethod::Midtrans,
                'status' => PaymentStatus::Unpaid,
            ],
            [
                'method' => PaymentMethod::Midtrans,
                'amount' => $order->grand_total,
                'status' => PaymentStatus::Unpaid,
                'reference' => $order->order_number,
            ],
        );

        try {
            $token = $this->midtransService->snapToken($order);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Lanjutkan pembayaran di Midtrans.',
            'snap_token' => $token,
            'client_key' => config('midtrans.client_key'),
            'snap_script' => config('midtrans.snap_script'),
        ]);
    }

    public function paymentStatus(Request $request, Order $order): JsonResponse
    {
        $this->assertOwnedBy($request, $order);

        if ($order->payments()->where('status', PaymentStatus::Unpaid)->doesntExist()) {
            return response()->json([
                'message' => 'Tidak ada pembayaran yang perlu dicek.',
                'payment_status' => $order->payment_status->value,
            ], 422);
        }

        try {
            $payload = $this->midtransService->status($order->order_number);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->midtransService->handleNotification($payload);

        $order->refresh();

        return response()->json([
            'message' => $order->payment_status->is(PaymentStatus::Paid)
                ? 'Pembayaran terkonfirmasi lunas.'
                : 'Pembayaran belum diterima. Silakan cek kembali nanti.',
            'payment_status' => $order->payment_status->value,
            'order' => $this->serializeOrder($order),
        ]);
    }

    private function assertOwnedBy(Request $request, Order $order): void
    {
        abort_unless($order->user_id === $request->user()->id, 404);
    }
}
