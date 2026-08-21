<?php

namespace App\Models;

use App\Enums\PhotoType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $delivery_id
 * @property PhotoType $type
 * @property string $path
 * @property string $photo_url
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'delivery_id',
    'type',
    'path',
])]
class DeliveryPhoto extends Model
{
    /**
     * @var list<string>
     */
    protected $appends = ['photo_url'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => PhotoType::class,
        ];
    }

    public function getPhotoUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }

    /**
     * @return BelongsTo<Delivery, $this>
     */
    public function delivery(): BelongsTo
    {
        return $this->belongsTo(Delivery::class);
    }
}
