<?php

namespace App\Services;

use App\Enums\DeliveryStatus;
use App\Enums\DriverStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PhotoType;
use App\Enums\TruckStatus;
use App\Events\DeliveryStatusChanged;
use App\Events\OrderPaymentUpdated;
use App\Events\OrderStatusChanged;
use App\Models\Delivery;
use App\Models\Driver;
use App\Models\Order;
use App\Models\Truck;
use Illuminate\Support\Collection;
use RuntimeException;

class DeliveryService
{
    /**
     * Data halaman jadwal pengiriman untuk seorang driver.
     * Task aktif diurutkan FIFO (paling awal terjadwal di atas); hanya
     * tugas pertama yang boleh dikerjakan (is_current = true).
     *
     * @return array{active: Collection<int, Delivery>, history: Collection<int, Delivery>, driver_status: string}
     */
    public function scheduleFor(Driver $driver): array
    {
        $active = Delivery::query()
            ->with([
                'order:id,order_number,address_snapshot,status',
                'truck:id,name,plate_number',
                'photos:id,delivery_id,type,path',
            ])
            ->where('driver_id', $driver->id)
            ->active()
            ->orderBy('scheduled_at')
            ->orderBy('id')
            ->get()
            ->each(function (Delivery $delivery, int $index): void {
                $delivery->setAttribute('queue_position', $index + 1);
                $delivery->setAttribute('is_current', $index === 0);
            });

        return [
            'active' => $active,
            'history' => Delivery::query()
                ->with(['order:id,order_number,status'])
                ->where('driver_id', $driver->id)
                ->history()
                ->latest()
                ->limit(10)
                ->get(),
            'driver_status' => $driver->status->value,
        ];
    }

    /**
     * Tugaskan truk ke pesanan yang sudah dikonfirmasi dan lunas.
     * Driver diambil dari default_driver truk, atau driver yang dipilih admin.
     * Truk TIDAK di-lock di sini agar bisa menerima beberapa pesanan
     * (pre-assign multi-tugas). Lock truk + driver terjadi saat startFilling().
     */
    public function assign(Order $order, Truck $truck, ?string $note = null, ?Driver $driver = null): Delivery
    {
        if (! $order->status->is(OrderStatus::Confirmed) || ! $order->payment_status->is(PaymentStatus::Paid)) {
            throw new RuntimeException('Hanya pesanan terkonfirmasi dan sudah dibayar yang dapat ditugaskan.');
        }

        $hasActiveDelivery = $order->delivery()->active()->exists();

        if ($hasActiveDelivery) {
            throw new RuntimeException('Pesanan sudah memiliki pengiriman aktif. Selesaikan atau gagalkan pengiriman saat ini terlebih dahulu.');
        }

        $order->delivery()->where('status', DeliveryStatus::Failed)->delete();

        $deliveryFee = $order->zone->delivery_fee ?? 0;

        $driver ??= $truck->defaultDriver;

        $delivery = $order->delivery()->create([
            'truck_id' => $truck->id,
            'driver_id' => $driver?->id,
            'status' => DeliveryStatus::Scheduled,
            'scheduled_at' => now(),
            'note' => $note,
        ]);

        $order->update([
            'delivery_fee' => $deliveryFee,
        ]);

        DeliveryStatusChanged::dispatch($delivery, DeliveryStatus::None);

        return $delivery;
    }

    /**
     * Air mulai diisi ke tangki truk. Truk + driver di-lock saat ini.
     */
    public function startFilling(Delivery $delivery): void
    {
        if (! $delivery->status->is(DeliveryStatus::Scheduled)) {
            throw new RuntimeException('Hanya tugas terjadwal yang dapat dimulai pengisiannya.');
        }

        $delivery->update([
            'status' => DeliveryStatus::Filling,
            'filling_started_at' => now(),
        ]);

        // Lock truck + driver at filling time
        $delivery->truck?->update([
            'status' => TruckStatus::Assigned,
        ]);
        $delivery->driver?->update([
            'status' => DriverStatus::OnDuty,
        ]);

        DeliveryStatusChanged::dispatch($delivery, DeliveryStatus::Scheduled);
    }

    /**
     * Tandai pengiriman berangkat setelah pengisian selesai.
     */
    public function depart(Delivery $delivery): void
    {
        if (! $delivery->status->is(DeliveryStatus::Filling)) {
            throw new RuntimeException('Selesaikan pengisian air sebelum berangkat.');
        }

        $delivery->update([
            'status' => DeliveryStatus::OnTheWay,
            'departed_at' => now(),
        ]);
        $delivery->order->update([
            'status' => OrderStatus::InDelivery,
        ]);

        DeliveryStatusChanged::dispatch($delivery, DeliveryStatus::Filling);
        OrderStatusChanged::dispatch($delivery->order, OrderStatus::Confirmed);
    }

    /**
     * Truk tiba dan air mulai diturunkan ke lokasi pelanggan.
     */
    public function startUnloading(Delivery $delivery): void
    {
        if (! $delivery->status->is(DeliveryStatus::OnTheWay)) {
            throw new RuntimeException('Pengiriman harus dalam perjalanan untuk memulai penurunan.');
        }

        $delivery->update([
            'status' => DeliveryStatus::Unloading,
        ]);

        DeliveryStatusChanged::dispatch($delivery, DeliveryStatus::OnTheWay);
    }

    /**
     * Tandai pengiriman selesai. Foto bukti tangki dan penerima wajib ada.
     * Jika COD, pembayaran otomatis lunas.
     */
    public function deliver(Delivery $delivery): void
    {
        if (! $delivery->status->is(DeliveryStatus::Unloading)) {
            throw new RuntimeException('Pengiriman harus dalam proses penurunan untuk diselesaikan.');
        }

        $hasTankPhoto = $delivery->photos()
            ->where('type', PhotoType::CompletionTank)
            ->exists();
        $hasPersonPhoto = $delivery->photos()
            ->where('type', PhotoType::CompletionPerson)
            ->exists();

        if (! $hasTankPhoto || ! $hasPersonPhoto) {
            throw new RuntimeException('Foto bukti tangki dan foto penerima wajib diunggah sebelum pengiriman diselesaikan.');
        }

        $delivery->update([
            'status' => DeliveryStatus::Delivered,
            'delivered_at' => now(),
        ]);

        $order = $delivery->order;
        $order->update([
            'status' => OrderStatus::Delivered,
        ]);

        DeliveryStatusChanged::dispatch($delivery, DeliveryStatus::Unloading);
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
     * Tandai pengiriman gagal; pesanan kembali menunggu penugasan ulang.
     */
    public function fail(Delivery $delivery): void
    {
        $inProgress = in_array(
            $delivery->status,
            [DeliveryStatus::Filling, DeliveryStatus::OnTheWay, DeliveryStatus::Unloading],
            true,
        );

        if (! $inProgress) {
            throw new RuntimeException('Hanya pengiriman yang sedang berjalan dapat digagalkan.');
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

    /**
     * Batalkan delivery yang masih scheduled (belum mulai diisi).
     * Pesanan kembali ke antrian, truk + driver terbuka.
     */
    public function cancelScheduled(Delivery $delivery): void
    {
        if (! $delivery->status->is(DeliveryStatus::Scheduled)) {
            throw new RuntimeException('Hanya tugas terjadwal yang dapat dibatalkan.');
        }

        $previousStatus = $delivery->status;

        $delivery->update([
            'status' => DeliveryStatus::Failed,
            'note' => trim(($delivery->note !== null ? $delivery->note.' ' : '').'[Dibatalkan admin]'),
        ]);
        $delivery->order->update([
            'status' => OrderStatus::Confirmed,
        ]);

        DeliveryStatusChanged::dispatch($delivery, $previousStatus);
        OrderStatusChanged::dispatch($delivery->order, OrderStatus::Confirmed);

        $this->releaseResources($delivery);
    }

    /**
     * Ganti driver pada delivery yang masih scheduled.
     */
    public function reassignDriver(Delivery $delivery, Driver $newDriver): void
    {
        if (! $delivery->status->is(DeliveryStatus::Scheduled)) {
            throw new RuntimeException('Hanya tugas terjadwal yang dapat diganti driver-nya.');
        }

        $delivery->update([
            'driver_id' => $newDriver->id,
        ]);

        DeliveryStatusChanged::dispatch($delivery, DeliveryStatus::Scheduled);
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
