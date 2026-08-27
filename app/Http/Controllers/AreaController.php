<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Zone;
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

        $zones = Zone::query()
            ->active()
            ->where(function ($q) use ($query) {
                $q->where('kecamatan', 'LIKE', "%{$query}%")
                    ->orWhere('kelurahan', 'LIKE', "%{$query}%")
                    ->orWhere('city', 'LIKE', "%{$query}%");
            })
            ->when($city, fn ($q) => $q->where('city', $city))
            ->when($kecamatan, fn ($q) => $q->where('kecamatan', $kecamatan))
            ->select('kecamatan', 'kelurahan', 'city', 'delivery_fee', 'is_within_area')
            ->distinct()
            ->limit(15)
            ->get()
            ->unique(fn (Zone $zone): string => $zone->kecamatan.'|'.$zone->kelurahan.'|'.$zone->city)
            ->values();

        return response()->json($zones);
    }
}
