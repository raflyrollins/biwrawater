<?php

namespace App\Enums;

use App\Enums\Concerns\HasState;

enum DeliveryStatus: string
{
    use HasState;

    case Scheduled = 'scheduled';
    case Accepted = 'accepted';
    case Filling = 'filling';
    case OnTheWay = 'on_the_way';
    case Unloading = 'unloading';
    case Delivered = 'delivered';
    case Failed = 'failed';
    case None = 'none';

    public function label(): string
    {
        return match ($this) {
            self::Scheduled => 'Terjadwal',
            self::Accepted => 'Diterima Driver',
            self::Filling => 'Pengisian',
            self::OnTheWay => 'Dalam Perjalanan',
            self::Unloading => 'Penurunan',
            self::Delivered => 'Selesai',
            self::Failed => 'Gagal',
            self::None => '-',
        };
    }
}
