<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Zone;
use App\Support\DatabaseSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AreaController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = $request->string('q')->toString();

        if ($query === '') {
            return response()->json([]);
        }

        $city = $request->string('city')->toString();
        $kecamatan = $request->string('kecamatan')->toString();

        $areas = Zone::query()
            ->active()
            ->where(function ($q) use ($query): void {
                [$condition, $bindings] = DatabaseSearch::containsAny(['kecamatan', 'kelurahan', 'city'], $query);

                $q->whereRaw($condition, $bindings);
            })
            ->when($city, fn ($q) => $q->where('city', $city))
            ->when($kecamatan, fn ($q) => $q->where('kecamatan', $kecamatan))
            ->select('kecamatan', 'kelurahan', 'city', 'delivery_fee', 'is_within_area')
            ->distinct()
            ->limit(15)
            ->get()
            ->unique(fn (Zone $zone): string => $zone->kecamatan.'|'.$zone->kelurahan.'|'.$zone->city)
            ->values();

        return response()->json($areas);
    }
}
