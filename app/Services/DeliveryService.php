<?php

namespace App\Services;

use App\Enums\DeliveryStatus;
use App\Enums\DriverStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\TruckStatus;
use App\Events\DeliveryStatusChanged;
use App\Events\OrderPaymentUpdated;
use App\Events\OrderStatusChanged;
use App\Models\Delivery;
use App\Models\Driver;
use App\Models\Order;
use App\Models\Truck;
use Carbon\CarbonInterface;
use RuntimeException;

class DeliveryService
{
    /**
     * Tugaskan truk dan driver ke pesanan yang sudah dikonfirmasi dan lunas.
     */
    public function assign(Order $order, Truck $truck, Driver $driver, CarbonInterface $scheduledAt, ?string $note = null): Delivery
    {
        if (! $order->status->is(OrderStatus::Confirmed) || ! $order->payment_status->is(PaymentStatus::Paid)) {
            throw new RuntimeException('Hanya pesanan terkonfirmasi dan sudah dibayar yang dapat ditugaskan.');
        }

        $order->delivery()->where('status', DeliveryStatus::Failed)->delete();

        $delivery = $order->delivery()->create([
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'status' => DeliveryStatus::Scheduled,
            'scheduled_at' => $scheduledAt,
            'note' => $note,
        ]);

        DeliveryStatusChanged::dispatch($delivery, DeliveryStatus::None);

        return $delivery;
    }

    /**
     * Tandai pengiriman berangkat.
     */
    public function depart(Delivery $delivery): void
    {
        if (! $delivery->status->is(DeliveryStatus::Scheduled)) {
            throw new RuntimeException('Pengiriman harus terjadwal untuk berangkat.');
        }

        $delivery->update([
            'status' => DeliveryStatus::OnTheWay,
            'departed_at' => now(),
        ]);
        $delivery->order->update([
            'status' => OrderStatus::InDelivery,
        ]);

        DeliveryStatusChanged::dispatch($delivery, DeliveryStatus::Scheduled);
        OrderStatusChanged::dispatch($delivery->order, OrderStatus::Confirmed);

        $this->occupyResources($delivery);
    }

    /**
     * Tandai pengiriman selesai. Jika COD, pembayaran otomatis lunas.
     */
    public function deliver(Delivery $delivery): void
    {
        if (! $delivery->status->is(DeliveryStatus::OnTheWay)) {
            throw new RuntimeException('Pengiriman harus dalam perjalanan untuk diselesaikan.');
        }

        $delivery->update([
            'status' => DeliveryStatus::Delivered,
            'delivered_at' => now(),
        ]);

        $order = $delivery->order;
        $order->update([
            'status' => OrderStatus::Delivered,
        ]);

        DeliveryStatusChanged::dispatch($delivery, DeliveryStatus::OnTheWay);
        OrderStatusChanged::dispatch($order, OrderStatus::InDelivery);

        if ($order->payment_method->is(PaymentMethod::Cod)) {
            $order->payments()->create([
                'method' => PaymentMethod::Cod,
                'amount' => $order->grand_total,
                'status' => PaymentStatus::Paid,
                'paid_at' => now(),
            ]);
            $order->update([
                'payment_status' => PaymentStatus::Paid,
            ]);

            OrderPaymentUpdated::dispatch($order);
        }

        $this->releaseResources($delivery);
    }

    /**
     * Tandai pengiriman gagal; pesanan kembali menunggu penugasan ulang
     * (status tetap dikonfirmasi karena sudah dibayar).
     */
    public function fail(Delivery $delivery): void
    {
        if ($delivery->status->is(DeliveryStatus::Delivered)) {
            throw new RuntimeException('Pengiriman yang selesai tidak dapat digagalkan.');
        }

        $previousStatus = $delivery->status;

        $delivery->update([
            'status' => DeliveryStatus::Failed,
        ]);
        $delivery->order->update([
            'status' => OrderStatus::Confirmed,
        ]);

        DeliveryStatusChanged::dispatch($delivery, $previousStatus);
        OrderStatusChanged::dispatch($delivery->order, OrderStatus::InDelivery);

        $this->releaseResources($delivery);
    }

    private function occupyResources(Delivery $delivery): void
    {
        $delivery->truck?->update([
            'status' => TruckStatus::Assigned,
        ]);
        $delivery->driver?->update([
            'status' => DriverStatus::OnDuty,
        ]);
    }

    private function releaseResources(Delivery $delivery): void
    {
        $delivery->truck?->update([
            'status' => TruckStatus::Available,
        ]);
        $delivery->driver?->update([
            'status' => DriverStatus::Available,
        ]);
    }
}
