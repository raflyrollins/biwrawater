<?php

namespace App\Models;

use App\Enums\TruckStatus;
use Database\Factories\TruckFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Ramsey\Uuid\Uuid;

/**
 * @property int $id
 * @property string $uuid
 * @property string $plate_number
 * @property string $name
 * @property int $capacity_liters
 * @property TruckStatus $status
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'plate_number',
    'name',
    'capacity_liters',
    'status',
    'notes',
])]
class Truck extends Model
{
    /** @use HasFactory<TruckFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (self $truck): void {
            $truck->uuid ??= (string) Uuid::uuid4();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TruckStatus::class,
        ];
    }

    /**
     * Scope a query to only include operational trucks.
     *
     * @param  Builder<Truck>  $query
     * @return Builder<Truck>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNot('status', TruckStatus::Retired);
    }

    /**
     * @return HasMany<Delivery, $this>
     */
    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }
}
