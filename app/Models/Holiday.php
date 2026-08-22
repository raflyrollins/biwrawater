<?php

namespace App\Models;

use Database\Factories\HolidayFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Ramsey\Uuid\Uuid;

/**
 * @property int $id
 * @property string $uuid
 * @property Carbon $date
 * @property string $name
 */
#[Fillable([
    'date',
    'name',
])]
class Holiday extends Model
{
    /** @use HasFactory<HolidayFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (self $holiday): void {
            $holiday->uuid ??= (string) Uuid::uuid4();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
        ];
    }
}
