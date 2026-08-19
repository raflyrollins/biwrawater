<?php

namespace App\Enums;

enum Role: string
{
    case SuperAdmin = 'super-admin';
    case Admin = 'admin';
    case Driver = 'driver';
    case Customer = 'customer';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Admin',
            self::Driver => 'Driver',
            self::Customer => 'Pelanggan',
        };
    }
}
