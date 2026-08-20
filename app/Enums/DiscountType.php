<?php

namespace App\Enums;

use App\Enums\Concerns\HasState;

enum DiscountType: string
{
    use HasState;

    case Percentage = 'percentage';
    case Fixed = 'fixed';

    public function label(): string
    {
        return match ($this) {
            self::Percentage => 'Persen (%)',
            self::Fixed => 'Nominal (Rp)',
        };
    }
}
