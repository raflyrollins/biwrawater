<?php

namespace App\Enums;

use App\Enums\Concerns\HasState;

enum DeliveryStatus: string
{
    use HasState;

    case Scheduled = 'scheduled';
    case OnTheWay = 'on_the_way';
    case Delivered = 'delivered';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'Terjadwal',
            self::OnTheWay => 'Dalam Perjalanan',
            self::Delivered => 'Selesai',
            self::Failed => 'Gagal',
        };
    }
}
