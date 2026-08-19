<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\DiscountType;
use App\Models\Promotion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Head\Facades\Head;

class PromotionController extends Controller
{
    public function index(): Response
    {
        Head::title('Promosi');

        return Inertia::render('dashboard/promotions/Index', [
            'promotions' => Promotion::query()
                ->with('creator:id,name')
                ->latest()
                ->paginate(15),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePromotion($request);

        Promotion::create([
            ...$this->mapFields($validated),
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Promosi dibuat.');
    }

    public function update(Request $request, Promotion $promotion): RedirectResponse
    {
        $validated = $this->validatePromotion($request);

        $promotion->update($this->mapFields($validated));

        return back()->with('success', 'Promosi diperbarui.');
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function mapFields(array $validated): array
    {
        return [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['discount_type'],
            'value' => $validated['discount_value'],
            'min_order_total' => $validated['min_order_subtotal'],
            'max_discount_amount' => $validated['max_discount_amount'] ?? null,
            'starts_at' => $validated['starts_at'] ?? null,
            'ends_at' => $validated['ends_at'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];
    }

    public function toggle(Promotion $promotion): RedirectResponse
    {
        $promotion->update([
            'is_active' => ! $promotion->is_active,
        ]);

        return back()->with('success', $promotion->is_active ? 'Promosi diaktifkan.' : 'Promosi dinonaktifkan.');
    }

    public function destroy(Promotion $promotion): RedirectResponse
    {
        $promotion->delete();

        return back()->with('success', 'Promosi dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePromotion(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'discount_type' => ['required', Rule::enum(DiscountType::class)],
            'discount_value' => ['required', 'integer', 'min:1'],
            'min_order_subtotal' => ['required', 'integer', 'min:0'],
            'max_discount_amount' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
