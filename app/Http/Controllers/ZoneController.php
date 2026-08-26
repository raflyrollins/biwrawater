<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Zone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;

class ZoneController extends Controller
{
    public function index(): Response
    {
        Head::title('Zona Pengiriman');

        return Inertia::render('dashboard/zones/Index', [
            'zones' => Zone::query()
                ->withCount('addresses')
                ->orderBy('city')
                ->orderBy('kecamatan')
                ->orderBy('kelurahan')
                ->paginate(20),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateZone($request);

        $validated['slug'] = Str::slug($validated['name']);

        Zone::create($validated);

        return back()->with('success', 'Zona pengiriman ditambahkan.');
    }

    public function update(Request $request, Zone $zone): RedirectResponse
    {
        $validated = $this->validateZone($request, $zone);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $zone->update($validated);

        return back()->with('success', 'Zona pengiriman diperbarui.');
    }

    public function destroy(Zone $zone): RedirectResponse
    {
        if ($zone->addresses()->exists()) {
            return back()->with('error', 'Zona masih digunakan oleh alamat pengguna.');
        }

        $zone->delete();

        return back()->with('success', 'Zona pengiriman dihapus.');
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
                (string) $request->string('kelurahan')
            )
            ->first();

        if (! $zone) {
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

    /**
     * @return array<string, mixed>
     */
    private function validateZone(Request $request, ?Zone $zone = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'kecamatan' => ['required', 'string', 'max:255'],
            'kelurahan' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'delivery_fee' => ['required', 'integer', 'min:0'],
            'is_within_area' => ['boolean'],
            'is_active' => ['boolean'],
        ]);
    }
}
