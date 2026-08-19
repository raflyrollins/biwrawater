<?php

namespace App\Enums;

use App\Enums\Concerns\HasState;

enum OrderStatus: string
{
    use HasState;

    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case InDelivery = 'in_delivery';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Menunggu Konfirmasi',
            self::Confirmed => 'Dikonfirmasi',
            self::InDelivery => 'Sedang Dikirim',
            self::Delivered => 'Selesai',
            self::Cancelled => 'Dibatalkan',
        };
    }
}
