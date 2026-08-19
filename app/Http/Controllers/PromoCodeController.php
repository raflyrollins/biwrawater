<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\DiscountType;
use App\Models\PromoCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;

class PromoCodeController extends Controller
{
    public function index(): Response
    {
        Head::title('Kode Promo');

        return Inertia::render('dashboard/promo-codes/Index', [
            'promoCodes' => PromoCode::query()
                ->with('creator:id,name')
                ->latest()
                ->paginate(15),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge(['code' => Str::upper($request->input('code', ''))]);
        $validated = $this->validatePromoCode($request);

        PromoCode::create([
            ...$this->mapFields($validated),
            'code' => $validated['code'],
            'name' => $validated['code'],
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Kode promo dibuat.');
    }

    public function update(Request $request, PromoCode $promoCode): RedirectResponse
    {
        $request->merge(['code' => Str::upper($request->input('code', ''))]);
        $validated = $this->validatePromoCode($request, $promoCode);

        $promoCode->update([
            ...$this->mapFields($validated),
            'code' => $validated['code'],
            'name' => $validated['code'],
        ]);

        return back()->with('success', 'Kode promo diperbarui.');
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function mapFields(array $validated): array
    {
        return [
            'description' => $validated['description'] ?? null,
            'type' => $validated['discount_type'],
            'value' => $validated['discount_value'],
            'min_order_total' => $validated['min_order_subtotal'],
            'max_discount_amount' => $validated['max_discount_amount'] ?? null,
            'max_uses' => $validated['max_uses'] ?? null,
            'starts_at' => $validated['starts_at'] ?? null,
            'ends_at' => $validated['ends_at'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];
    }

    public function toggle(PromoCode $promoCode): RedirectResponse
    {
        $promoCode->update([
            'is_active' => ! $promoCode->is_active,
        ]);

        return back()->with('success', $promoCode->is_active ? 'Kode promo diaktifkan.' : 'Kode promo dinonaktifkan.');
    }

    public function destroy(PromoCode $promoCode): RedirectResponse
    {
        $promoCode->delete();

        return back()->with('success', 'Kode promo dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePromoCode(Request $request, ?PromoCode $promoCode = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:30', Rule::unique('promo_codes', 'code')->ignore($promoCode)],
            'description' => ['nullable', 'string', 'max:500'],
            'discount_type' => ['required', Rule::enum(DiscountType::class)],
            'discount_value' => ['required', 'integer', 'min:1'],
            'min_order_subtotal' => ['required', 'integer', 'min:0'],
            'max_discount_amount' => ['nullable', 'integer', 'min:1'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
