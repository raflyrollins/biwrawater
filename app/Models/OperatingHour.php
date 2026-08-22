<?php

namespace App\Models;

use App\Enums\DayOfWeek;
use Database\Factories\OperatingHourFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property DayOfWeek $day_of_week
 * @property bool $is_closed
 * @property string|null $opens_at
 * @property string|null $closes_at
 */
#[Fillable([
    'day_of_week',
    'is_closed',
    'opens_at',
    'closes_at',
])]
class OperatingHour extends Model
{
    /** @use HasFactory<OperatingHourFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'day_of_week' => DayOfWeek::class,
            'is_closed' => 'boolean',
        ];
    }
}
