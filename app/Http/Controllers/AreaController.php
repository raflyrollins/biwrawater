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

        $zones = Zone::query()
            ->active()
            ->where(function ($q) use ($query) {
                $q->where('kecamatan', 'LIKE', "%{$query}%")
                    ->orWhere('kelurahan', 'LIKE', "%{$query}%")
                    ->orWhere('city', 'LIKE', "%{$query}%");
            })
            ->select('kecamatan', 'kelurahan', 'city', 'delivery_fee', 'is_within_area')
            ->distinct()
            ->limit(10)
            ->get()
            ->map(function ($zone) {
                return [
                    'kecamatan' => $zone->kecamatan,
                    'kelurahan' => $zone->kelurahan,
                    'city' => $zone->city,
                    'delivery_fee' => $zone->delivery_fee,
                    'is_within_area' => $zone->is_within_area,
                ];
            })
            ->unique('kecamatan.kelurahan.city')
            ->values();

        return response()->json($zones);
    }
}
