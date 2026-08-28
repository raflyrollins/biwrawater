<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;

trait SerializesOrders
{
    use SerializesDeliveries;

    /**
     * @return array<string, mixed>
     */
    protected function serializeOrder(Order $order): array
    {
        $order->loadMissing(['items', 'payments']);

        return [
            'id' => $order->id,
            'uuid' => $order->uuid,
            'order_number' => $order->order_number,
            'status' => $order->status->value,
            'status_label' => $order->status->label(),
            'payment_method' => $order->payment_method->value,
            'payment_status' => $order->payment_status->value,
            'payment_status_label' => $order->payment_status->label(),
            'payment_due_at' => $order->payment_due_at?->toIso8601String(),
            'payment_due_passed' => $order->payment_due_at !== null && $order->payment_due_at->isPast(),
            'subtotal' => $order->subtotal,
            'discount_total' => $order->discount_total,
            'delivery_fee' => $order->delivery_fee,
            'grand_total' => $order->grand_total,
            'customer_note' => $order->customer_note,
            'created_at' => $order->created_at?->toIso8601String(),
            'address' => $order->address_snapshot,
            'items' => $order->items
                ->map(fn (OrderItem $item): array => [
                    'service_id' => $item->service_id,
                    'service_name' => $item->service_name,
                    'volume_liters' => $item->volume_liters,
                    'unit_price' => $item->unit_price,
                    'quantity' => $item->quantity,
                    'line_total' => $item->line_total,
                ])
                ->values(),
            'delivery' => $order->delivery !== null
                ? $this->serializeDelivery($order->delivery)
                : null,
            'payments' => $order->payments
                ->map(fn (Payment $payment): array => [
                    'method' => $payment->method->value,
                    'amount' => $payment->amount,
                    'status' => $payment->status->value,
                    'reference' => $payment->reference,
                    'paid_at' => $payment->paid_at?->toIso8601String(),
                ])
                ->values(),
        ];
    }
}
