<?php

namespace App\Enums;

enum UserRole: string
{
    case Customer = 'customer';
    case Admin = 'admin';
    case Driver = 'driver';

    public function label(): string
    {
        return match ($this) {
            self::Customer => 'Pelanggan',
            self::Admin => 'Admin',
            self::Driver => 'Driver',
        };
    }
}
