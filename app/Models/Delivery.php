<?php

namespace App\Models;

use App\Enums\DeliveryStatus;
use Database\Factories\DeliveryFactory;
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
 * @property int $order_id
 * @property int|null $truck_id
 * @property int|null $driver_id
 * @property DeliveryStatus $status
 * @property Carbon $scheduled_at
 * @property Carbon|null $filling_started_at
 * @property Carbon|null $departed_at
 * @property Carbon|null $delivered_at
 * @property string|null $note
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'order_id',
    'truck_id',
    'driver_id',
    'status',
    'scheduled_at',
    'filling_started_at',
    'departed_at',
    'delivered_at',
    'note',
])]
class Delivery extends Model
{
    /** @use HasFactory<DeliveryFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (self $delivery): void {
            $delivery->uuid ??= (string) Uuid::uuid4();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Pengiriman yang sedang berjalan (belum selesai/gagal).
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [
            DeliveryStatus::Scheduled,
            DeliveryStatus::Accepted,
            DeliveryStatus::Filling,
            DeliveryStatus::OnTheWay,
            DeliveryStatus::Unloading,
        ]);
    }

    /**
     * Pengiriman yang sudah berakhir.
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeHistory(Builder $query): Builder
    {
        return $query->whereIn('status', [
            DeliveryStatus::Delivered,
            DeliveryStatus::Failed,
        ]);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => DeliveryStatus::class,
            'scheduled_at' => 'datetime',
            'filling_started_at' => 'datetime',
            'departed_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * @return BelongsTo<Truck, $this>
     */
    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    /**
     * @return BelongsTo<Driver, $this>
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    /**
     * @return HasMany<DeliveryPhoto, $this>
     */
    public function photos(): HasMany
    {
        return $this->hasMany(DeliveryPhoto::class);
    }
}
