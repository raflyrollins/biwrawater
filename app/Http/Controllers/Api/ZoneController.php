<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Zone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZoneController extends Controller
{
    public function index(): JsonResponse
    {
        $zones = Zone::query()
            ->active()
            ->orderBy('city')
            ->orderBy('kecamatan')
            ->orderBy('kelurahan')
            ->get()
            ->map(fn (Zone $zone): array => [
                'id' => $zone->id,
                'name' => $zone->name,
                'slug' => $zone->slug,
                'is_within_area' => $zone->is_within_area,
                'delivery_fee' => $zone->delivery_fee,
                'kecamatan' => $zone->kecamatan,
                'kelurahan' => $zone->kelurahan,
                'city' => $zone->city,
            ])
            ->values();

        return response()->json(['zones' => $zones]);
    }

    public function lookup(Request $request): JsonResponse
    {
        $request->validate([
            'kecamatan' => ['required', 'string'],
            'kelurahan' => ['required', 'string'],
        ]);

        $zone = Zone::query()
            ->active()
            ->byKecamatanKelurahan(
                (string) $request->string('kecamatan'),
                (string) $request->string('kelurahan'),
            )
            ->first();

        if ($zone === null) {
            return response()->json([
                'found' => false,
                'message' => 'Zona tidak ditemukan untuk kecamatan dan kelurahan tersebut.',
            ], 404);
        }

        return response()->json([
            'found' => true,
            'zone' => [
                'id' => $zone->id,
                'name' => $zone->name,
                'slug' => $zone->slug,
                'is_within_area' => $zone->is_within_area,
                'delivery_fee' => $zone->delivery_fee,
            ],
        ]);
    }
}
