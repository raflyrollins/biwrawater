<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddressRequest;
use App\Models\Address;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()
            ->addresses()
            ->with('zone:id,name,delivery_fee,is_within_area')
            ->latest()
            ->get()
            ->map(fn (Address $address): array => $this->serialize($address))
            ->values();

        return response()->json(['addresses' => $addresses]);
    }

    public function store(AddressRequest $request): JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->create($this->payload($request));

        if ($address->is_default) {
            $this->clearOtherDefaults($user, $address);
        }

        return response()->json([
            'message' => 'Alamat berhasil ditambahkan.',
            'address' => $this->serialize($address),
        ], 201);
    }

    public function update(AddressRequest $request, Address $address): JsonResponse
    {
        $this->assertOwnedBy($request, $address);

        $address->update($this->payload($request));

        if ($address->is_default) {
            $this->clearOtherDefaults($request->user(), $address);
        }

        return response()->json([
            'message' => 'Alamat berhasil diperbarui.',
            'address' => $this->serialize($address->refresh()),
        ]);
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        $this->assertOwnedBy($request, $address);

        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault && $request->user()->addresses()->exists()) {
            $request->user()->addresses()->latest()->first()?->update(['is_default' => true]);
        }

        return response()->json(['message' => 'Alamat berhasil dihapus.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(AddressRequest $request): array
    {
        $payload = $request->safe()->only([
            'label',
            'recipient_name',
            'phone',
            'street_address',
            'district',
            'subdistrict',
            'city',
            'postal_code',
            'notes',
        ]);

        $payload['is_default'] = $request->boolean('is_default');

        return $payload;
    }

    private function assertOwnedBy(Request $request, Address $address): void
    {
        abort_unless($address->user_id === $request->user()->id, 404);
    }

    private function clearOtherDefaults(User $user, Address $address): void
    {
        $user->addresses()
            ->whereKeyNot($address->id)
            ->where('is_default', true)
            ->update(['is_default' => false]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Address $address): array
    {
        return [
            'id' => $address->id,
            'label' => $address->label,
            'recipient_name' => $address->recipient_name,
            'phone' => $address->phone,
            'street_address' => $address->street_address,
            'district' => $address->district,
            'subdistrict' => $address->subdistrict,
            'city' => $address->city,
            'postal_code' => $address->postal_code,
            'notes' => $address->notes,
            'is_default' => $address->is_default,
            'zone_id' => $address->zone_id,
            'zone' => $address->zone !== null
                ? [
                    'id' => $address->zone->id,
                    'name' => $address->zone->name,
                    'delivery_fee' => $address->zone->delivery_fee,
                ]
                : null,
        ];
    }
}
