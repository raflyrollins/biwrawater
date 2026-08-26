<?php

namespace App\Models;

use Database\Factories\ZoneFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'slug',
    'is_within_area',
    'delivery_fee',
    'is_active',
    'kecamatan',
    'kelurahan',
    'city',
])]
class Zone extends Model
{
    /** @use HasFactory<ZoneFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_within_area' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeWithinArea(Builder $query): Builder
    {
        return $query->where('is_within_area', true);
    }

    /**
     * Find zone by kecamatan and kelurahan.
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeByKecamatanKelurahan(Builder $query, string $kecamatan, string $kelurahan): Builder
    {
        return $query->where('kecamatan', $kecamatan)
            ->where('kelurahan', $kelurahan);
    }

    /**
     * @return HasMany<Address, Zone>
     */
    public function addresses(): HasMany
    {
        /** @var HasMany<Address, Zone> $hasMany */
        $hasMany = $this->hasMany(Address::class);

        return $hasMany;
    }
}
