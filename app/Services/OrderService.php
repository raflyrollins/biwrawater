<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DiscountType;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Events\OrderCreated;
use App\Models\Address;
use App\Models\Order;
use App\Models\PromoCode;
use App\Models\Promotion;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class OrderService
{
    /**
     * Hitung nominal diskon dari satu sumber diskon, dibatasi subtotal.
     */
    public function calculateDiscount(
        int $subtotal,
        DiscountType $type,
        int $value,
        ?int $maxDiscountAmount = null,
    ): int {
        $discount = $type->is(DiscountType::Percentage)
            ? intdiv($subtotal * $value, 100)
            : $value;

        if ($maxDiscountAmount !== null) {
            $discount = min($discount, $maxDiscountAmount);
        }

        return min($discount, $subtotal);
    }

    /**
     * Buat pesanan baru untuk pelanggan (1 pesanan = 1 tangki).
     *
     * Diskon: satu promosi otomatis terbaik (jika memenuhi minimal pembelian)
     * ditambah satu kode promo (jika diberikan dan valid).
     */
    public function create(
        User $user,
        Service $service,
        Address $address,
        ?string $promoCode = null,
        ?string $customerNote = null,
    ): Order {
        return DB::transaction(function () use (
            $user,
            $service,
            $address,
            $promoCode,
            $customerNote,
        ): Order {
            if (! $service->is_active) {
                throw new RuntimeException('Varian tangki tidak tersedia.');
            }

            $subtotal = $service->price;
            $discountBreakdown = [];
            $discountTotal = 0;

            $promotion = Promotion::query()
                ->active()
                ->where('min_order_total', '<=', $subtotal)
                ->orderByDesc('value')
                ->first();

            if ($promotion) {
                $promotionDiscount = $this->calculateDiscount(
                    $subtotal,
                    $promotion->type,
                    $promotion->value,
                    $promotion->max_discount_amount,
                );
                $discountTotal += $promotionDiscount;
                $discountBreakdown[] = [
                    'type' => 'promotion',
                    'name' => $promotion->name,
                    'code' => null,
                    'discount_type' => $promotion->type->value,
                    'discount_value' => $promotion->value,
                    'max_discount_amount' => $promotion->max_discount_amount,
                    'discount_total' => $promotionDiscount,
                ];
            }

            if ($promoCode !== null) {
                $discountTotal += $this->applyPromoCode(
                    $subtotal,
                    $promoCode,
                    $discountBreakdown,
                );
            }

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $user->id,
                'address_id' => $address->id,
                'address_snapshot' => $address->toArray(),
                'status' => OrderStatus::Pending,
                'payment_method' => PaymentMethod::Midtrans,
                'payment_status' => PaymentStatus::Unpaid,
                'subtotal' => $subtotal,
                'discount_total' => $discountTotal,
                'grand_total' => $subtotal - $discountTotal,
                'discount_snapshot' => $discountBreakdown === [] ? null : $discountBreakdown,
                'customer_note' => $customerNote,
            ]);

            $order->items()->create([
                'service_id' => $service->id,
                'service_name' => $service->name,
                'volume_liters' => $service->volume_liters,
                'unit_price' => $service->price,
                'quantity' => 1,
                'line_total' => $service->price,
            ]);

            OrderCreated::dispatch($order);

            return $order;
        });
    }

    /**
     * Validasi dan terapkan kode promo; kembalikan nominal diskon.
     *
     * @param  array<int, array<string, mixed>>  $discountBreakdown
     */
    private function applyPromoCode(int $subtotal, string $promoCode, array &$discountBreakdown): int
    {
        $code = PromoCode::query()
            ->active()
            ->where('code', strtoupper(trim($promoCode)))
            ->first();

        if (! $code) {
            throw new RuntimeException('Kode promo tidak valid atau sudah kedaluwarsa.');
        }

        if ($subtotal < $code->min_order_total) {
            throw new RuntimeException(sprintf(
                'Kode promo berlaku untuk minimal pembelian Rp %s.',
                number_format($code->min_order_total, 0, ',', '.'),
            ));
        }

        $codeDiscount = $this->calculateDiscount(
            $subtotal,
            $code->type,
            $code->value,
            $code->max_discount_amount,
        );

        $code->increment('used_count');

        $discountBreakdown[] = [
            'type' => 'promo_code',
            'name' => $code->name,
            'code' => $code->code,
            'discount_type' => $code->type->value,
            'discount_value' => $code->value,
            'max_discount_amount' => $code->max_discount_amount,
            'discount_total' => $codeDiscount,
        ];

        return $codeDiscount;
    }
}
