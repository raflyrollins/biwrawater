<?php

namespace App\Models;

use App\Enums\DiscountType;
use Database\Factories\PromotionFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Ramsey\Uuid\Uuid;

/**
 * @property int $id
 * @property string $uuid
 * @property string $name
 * @property string|null $description
 * @property DiscountType $type
 * @property int $value
 * @property int $min_order_total
 * @property int|null $max_discount_amount
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property bool $is_active
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Appends(['discount_type', 'discount_value', 'min_order_subtotal'])]
#[Fillable([
    'name',
    'description',
    'type',
    'value',
    'min_order_total',
    'max_discount_amount',
    'starts_at',
    'ends_at',
    'is_active',
    'created_by',
])]
class Promotion extends Model
{
    /** @use HasFactory<PromotionFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (self $promotion): void {
            $promotion->uuid ??= (string) Uuid::uuid4();
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
            'type' => DiscountType::class,
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Alias agar frontend memakai nama kolom yang konsisten.
     *
     * @return Attribute<DiscountType, never>
     */
    protected function discountType(): Attribute
    {
        return Attribute::get(fn () => $this->type);
    }

    /**
     * @return Attribute<int, never>
     */
    protected function discountValue(): Attribute
    {
        return Attribute::get(fn () => $this->value);
    }

    /**
     * @return Attribute<int, never>
     */
    protected function minOrderSubtotal(): Attribute
    {
        return Attribute::get(fn () => $this->min_order_total);
    }

    /**
     * Scope a query to only include promotions currently active.
     *
     * @param  Builder<Promotion>  $query
     * @return Builder<Promotion>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->where(fn (Builder $q) => $q
                ->whereNull('starts_at')
                ->orWhere('starts_at', '<=', now()))
            ->where(fn (Builder $q) => $q
                ->whereNull('ends_at')
                ->orWhere('ends_at', '>=', now()));
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
