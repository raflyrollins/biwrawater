<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Delivery;
use App\Models\DeliveryPhoto;

trait SerializesDeliveries
{
    /**
     * @return array<string, mixed>
     */
    protected function serializeDelivery(Delivery $delivery, int $queuePosition = 0, bool $isCurrent = false): array
    {
        return [
            'id' => $delivery->id,
            'uuid' => $delivery->uuid,
            'status' => $delivery->status->value,
            'status_label' => $delivery->status->label(),
            'scheduled_at' => $delivery->scheduled_at->toIso8601String(),
            'filling_started_at' => $delivery->filling_started_at?->toIso8601String(),
            'departed_at' => $delivery->departed_at?->toIso8601String(),
            'delivered_at' => $delivery->delivered_at?->toIso8601String(),
            'note' => $delivery->note,
            'queue_position' => $queuePosition,
            'is_current' => $isCurrent,
            'order' => $delivery->order !== null
                ? [
                    'id' => $delivery->order->id,
                    'uuid' => $delivery->order->uuid,
                    'order_number' => $delivery->order->order_number,
                    'status' => $delivery->order->status->value,
                    'address_snapshot' => $delivery->order->address_snapshot,
                ]
                : null,
            'truck' => $delivery->truck !== null
                ? [
                    'id' => $delivery->truck->id,
                    'name' => $delivery->truck->name,
                    'plate_number' => $delivery->truck->plate_number,
                ]
                : null,
            'photos' => $delivery->photos
                ->map(fn (DeliveryPhoto $photo): array => [
                    'id' => $photo->id,
                    'type' => $photo->type->value,
                    'type_label' => $photo->type->label(),
                    'url' => $photo->photo_url,
                ])
                ->values(),
        ];
    }
}
