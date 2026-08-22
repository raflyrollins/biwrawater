<?php

namespace App\Enums;

use App\Enums\Concerns\HasState;

/**
 * Hari dalam seminggu mengikuti konvensi Carbon: 0 = Minggu … 6 = Sabtu.
 */
enum DayOfWeek: int
{
    use HasState;

    case Sunday = 0;
    case Monday = 1;
    case Tuesday = 2;
    case Wednesday = 3;
    case Thursday = 4;
    case Friday = 5;
    case Saturday = 6;

    public function label(): string
    {
        return match ($this) {
            self::Monday => 'Senin',
            self::Tuesday => 'Selasa',
            self::Wednesday => 'Rabu',
            self::Thursday => 'Kamis',
            self::Friday => 'Jumat',
            self::Saturday => 'Sabtu',
            self::Sunday => 'Minggu',
        };
    }

    /**
     * Urutan tampilan mulai Senin (konvensi minggu kerja Indonesia).
     *
     * @return list<self>
     */
    public static function mondayFirst(): array
    {
        return [
            self::Monday,
            self::Tuesday,
            self::Wednesday,
            self::Thursday,
            self::Friday,
            self::Saturday,
            self::Sunday,
        ];
    }
}
