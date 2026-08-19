<?php

namespace App\Models;

use App\Enums\DriverStatus;
use Database\Factories\DriverFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Ramsey\Uuid\Uuid;

/**
 * @property int $id
 * @property string $uuid
 * @property int $user_id
 * @property string|null $license_number
 * @property DriverStatus $status
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'license_number',
    'status',
    'notes',
])]
class Driver extends Model
{
    /** @use HasFactory<DriverFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (self $driver): void {
            $driver->uuid ??= (string) Uuid::uuid4();
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
            'status' => DriverStatus::class,
        ];
    }

    /**
     * Scope a query to only include available drivers.
     *
     * @param  Builder<Driver>  $query
     * @return Builder<Driver>
     */
    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', DriverStatus::Available);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Delivery, $this>
     */
    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }
}
