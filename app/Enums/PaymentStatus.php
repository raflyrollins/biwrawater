<?php

namespace App\Enums;

use App\Enums\Concerns\HasState;

enum PaymentStatus: string
{
    use HasState;

    case Unpaid = 'unpaid';
    case Paid = 'paid';
    case Refunded = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Unpaid => 'Belum Dibayar',
            self::Paid => 'Lunas',
            self::Refunded => 'Dikembalikan',
        };
    }
}
