<?php

namespace App\Enums;

use App\Enums\Concerns\HasState;

enum DriverStatus: string
{
    use HasState;

    case Available = 'available';
    case OnDuty = 'on_duty';
    case OffDuty = 'off_duty';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'Tersedia',
            self::OnDuty => 'Bertugas',
            self::OffDuty => 'Istirahat',
        };
    }
}
