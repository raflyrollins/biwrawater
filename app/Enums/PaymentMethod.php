<?php

namespace App\Enums;

use App\Enums\Concerns\HasState;

enum PaymentMethod: string
{
    use HasState;

    case Cod = 'cod';
    case Transfer = 'transfer';
    case Midtrans = 'midtrans';

    public function label(): string
    {
        return match ($this) {
            self::Cod => 'Bayar di Tempat (COD)',
            self::Transfer => 'Transfer Bank',
            self::Midtrans => 'Midtrans',
        };
    }
}
