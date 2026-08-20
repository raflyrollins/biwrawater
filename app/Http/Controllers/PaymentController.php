<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\Permission;
use App\Models\Order;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use RuntimeException;

class PaymentController extends Controller
{
    public function __construct(private readonly MidtransService $midtransService) {}

    /**
     * Buat transaksi Snap Midtrans untuk pesanan yang sudah dikonfirmasi.
     */
    public function pay(Request $request, Order $order): RedirectResponse
    {
        $this->authorizeOrderAccess($request, $order);

        if (! $order->status->is(OrderStatus::Confirmed)) {
            return back()->with('error', 'Pesanan belum dikonfirmasi admin.');
        }

        if ($order->payment_status->is(PaymentStatus::Paid)) {
            return back()->with('error', 'Pesanan sudah lunas.');
        }

        if ($order->payment_due_at !== null && $order->payment_due_at->isPast()) {
            return back()->with('error', 'Batas waktu pembayaran telah lewat.');
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
            return back()->with('error', $e->getMessage());
        }

        $request->session()->flash('snap', [
            'token' => $token,
            'client_key' => config('midtrans.client_key'),
            'script' => config('midtrans.snap_script'),
        ]);

        return back()->with('success', 'Silakan selesaikan pembayaran di popup Midtrans.');
    }

    /**
     * Cek ulang status pembayaran secara manual.
     */
    public function status(Request $request, Order $order): RedirectResponse
    {
        $this->authorizeOrderAccess($request, $order);

        if ($order->payments()->where('status', PaymentStatus::Unpaid)->doesntExist()) {
            return back()->with('error', 'Tidak ada pembayaran yang perlu dicek.');
        }

        try {
            $payload = $this->midtransService->status($order->order_number);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        $this->midtransService->handleNotification($payload);

        $order->refresh();

        return $order->payment_status->is(PaymentStatus::Paid)
            ? back()->with('success', 'Pembayaran terkonfirmasi lunas.')
            : back()->with('error', 'Pembayaran belum diterima. Silakan cek kembali nanti.');
    }

    /**
     * Webhook notifikasi Midtrans (IPN).
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (! $this->midtransService->verifyNotification($payload)) {
            abort(403, 'Invalid signature');
        }

        $this->midtransService->handleNotification($payload);

        return response()->json(['status' => 'ok']);
    }

    private function authorizeOrderAccess(Request $request, Order $order): void
    {
        $user = $request->user();

        if (! $user->hasPermissionTo(Permission::DashboardView)) {
            abort_unless($order->user_id === $user->id, 404);
        }
    }
}
