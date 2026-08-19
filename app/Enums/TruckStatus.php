<?php

namespace App\Enums;

use App\Enums\Concerns\HasState;

enum TruckStatus: string
{
    use HasState;

    case Available = 'available';
    case Assigned = 'assigned';
    case Maintenance = 'maintenance';
    case Retired = 'retired';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Tersedia',
            self::Assigned => 'Sedang Bertugas',
            self::Maintenance => 'Perbaikan',
            self::Retired => 'Nonaktif',
        };
    }
}
