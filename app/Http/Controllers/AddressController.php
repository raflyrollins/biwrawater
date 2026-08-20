<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\AddressRequest;
use App\Models\Address;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;

class AddressController extends Controller
{
    public function index(Request $request): Response
    {
        Head::title('Alamat Saya');

        return Inertia::render('dashboard/addresses/Index', [
            'addresses' => $request->user()->addresses()->latest()->get(),
        ]);
    }

    public function store(AddressRequest $request): RedirectResponse
    {
        $user = $request->user();

        $address = $user->addresses()->create($this->addressPayload($request));

        if ($address->is_default) {
            $this->clearOtherDefaults($user, $address);
        }

        return back()->with('success', 'Alamat berhasil ditambahkan.');
    }

    public function update(AddressRequest $request, Address $address): RedirectResponse
    {
        $this->assertOwnedBy($request, $address);

        $address->update($this->addressPayload($request));

        if ($address->is_default) {
            $this->clearOtherDefaults($request->user(), $address);
        }

        return back()->with('success', 'Alamat berhasil diperbarui.');
    }

    public function destroy(Request $request, Address $address): RedirectResponse
    {
        $this->assertOwnedBy($request, $address);

        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault && $request->user()->addresses()->exists()) {
            $request->user()->addresses()->latest()->first()?->update(['is_default' => true]);
        }

        return back()->with('success', 'Alamat berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function addressPayload(AddressRequest $request): array
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
}
