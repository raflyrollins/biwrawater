<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Events\OrderPaymentUpdated;
use App\Models\Order;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MidtransService
{
    /**
     * Minta token Snap untuk satu pesanan.
     */
    public function snapToken(Order $order): string
    {
        $item = $order->items->first();
        $response = $this->httpClient()
            ->post(config('midtrans.snap_url'), [
                'transaction_details' => [
                    'order_id' => $order->order_number,
                    'gross_amount' => $order->grand_total,
                ],
                'item_details' => [
                    [
                        'id' => (string) ($item ? $item->service_id : $order->id),
                        'price' => $order->grand_total,
                        'quantity' => 1,
                        'name' => $item ? $item->service_name : 'Air Tangki',
                    ],
                ],
                'customer_details' => array_filter([
                    'first_name' => $order->user->name,
                    'phone' => $order->user->phone
                        ?? $order->address_snapshot['phone']
                        ?? null,
                    'email' => $order->user->email,
                ]),
            ]);

        $token = $response->json('token');

        if ($response->failed() || ! is_string($token)) {
            throw new RuntimeException('Gagal membuat pembayaran. Silakan coba lagi.');
        }

        return $token;
    }

    /**
     * Tanyakan status transaksi terbaru ke Midtrans.
     *
     * @return array<string, mixed>
     */
    public function status(string $orderId): array
    {
        $response = $this->httpClient()
            ->get(sprintf('%s/v2/%s/status', config('midtrans.api_url'), $orderId));

        if ($response->failed()) {
            throw new RuntimeException('Gagal memeriksa status pembayaran. Silakan coba lagi.');
        }

        return $response->json() ?? [];
    }

    /**
     * Verifikasi tanda tangan notifikasi webhook Midtrans.
     *
     * @param  array<string, mixed>  $payload
     */
    public function verifyNotification(array $payload): bool
    {
        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $signatureKey = (string) ($payload['signature_key'] ?? '');

        if ($orderId === '' || $statusCode === '' || $grossAmount === '' || $signatureKey === '') {
            return false;
        }

        $expected = hash(
            'sha512',
            $orderId.$statusCode.$grossAmount.config('midtrans.server_key'),
        );

        return hash_equals($expected, $signatureKey);
    }

    /**
     * Proses notifikasi webhook: tandai pembayaran lunas bila status transaksi
     * sudah capture/settlement.
     *
     * @param  array<string, mixed>  $payload
     */
    public function handleNotification(array $payload): void
    {
        $transactionStatus = (string) ($payload['transaction_status'] ?? '');
        $fraudStatus = (string) ($payload['fraud_status'] ?? '');

        $paid = in_array($transactionStatus, ['capture', 'settlement'], true)
            && ($fraudStatus === '' || $fraudStatus === 'accept');

        if (! $paid) {
            return;
        }

        $order = Order::query()
            ->with('user')
            ->where('order_number', (string) ($payload['order_id'] ?? ''))
            ->first();

        if (! $order) {
            return;
        }

        $order->update([
            'payment_status' => PaymentStatus::Paid,
            'payment_due_at' => null,
        ]);

        $payments = $order->payments()
            ->where('status', PaymentStatus::Unpaid)
            ->get();

        foreach ($payments as $payment) {
            $payment->update([
                'status' => PaymentStatus::Paid,
                'reference' => (string) ($payload['transaction_id'] ?? $payment->reference),
                'paid_at' => now(),
            ]);
        }

        OrderPaymentUpdated::dispatch($order);
    }

    private function httpClient(): PendingRequest
    {
        $clientKey = (string) config('midtrans.client_key');
        $serverKey = (string) config('midtrans.server_key');
        $timestamp = now()->toIso8601String();
        $signature = hash_hmac(
            'sha512',
            $clientKey.'|'.$serverKey.'|'.$timestamp,
            $serverKey,
        );

        return Http::acceptJson()
            ->withHeaders([
                'Authorization' => 'Basic '.base64_encode($serverKey.':'),
                'X-Auth-Key' => $clientKey,
                'X-Timestamp' => $timestamp,
                'X-Signature' => $signature,
            ])
            ->timeout(15);
    }
}
