<?php

use App\Enums\DiscountType;
use App\Models\PromoCode;
use App\Models\Promotion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin dapat membuat promosi', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post('/dashboard/promotions', [
            'name' => 'Diskon Tahun Baru',
            'description' => 'Promo spesial',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_order_subtotal' => 100000,
            'max_discount_amount' => 25000,
            'starts_at' => now()->toDateTimeString(),
            'ends_at' => null,
            'is_active' => true,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('promotions', [
        'name' => 'Diskon Tahun Baru',
        'type' => DiscountType::Percentage,
        'value' => 10,
        'min_order_total' => 100000,
        'created_by' => $admin->id,
    ]);
});

test('admin dapat mengubah promosi', function () {
    $admin = User::factory()->admin()->create();
    $promotion = Promotion::factory()->create();

    $this->actingAs($admin)
        ->post("/dashboard/promotions/{$promotion->uuid}", [
            'name' => 'Nama Baru',
            'description' => null,
            'discount_type' => 'fixed',
            'discount_value' => 20000,
            'min_order_subtotal' => 50000,
            'max_discount_amount' => null,
            'starts_at' => null,
            'ends_at' => null,
            'is_active' => false,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($promotion->refresh())
        ->name->toBe('Nama Baru')
        ->type->toBe(DiscountType::Fixed)
        ->value->toBe(20000)
        ->is_active->toBeFalse();
});

test('admin dapat menonaktifkan dan menghapus promosi', function () {
    $admin = User::factory()->admin()->create();
    $promotion = Promotion::factory()->create();

    $this->actingAs($admin)
        ->post("/dashboard/promotions/{$promotion->uuid}/toggle")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($promotion->refresh()->is_active)->toBeFalse();

    $this->actingAs($admin)
        ->delete("/dashboard/promotions/{$promotion->uuid}")
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('promotions', ['id' => $promotion->id]);
});

test('promosi yang berakhir tidak masuk scope aktif', function () {
    Promotion::factory()->create([
        'ends_at' => now()->subDay(),
    ]);

    expect(Promotion::query()->active()->count())->toBe(0);
});

test('admin dapat membuat kode promo dengan kode otomatis huruf besar', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post('/dashboard/promo-codes', [
            'code' => 'bwr10',
            'description' => 'Kode spesial',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'min_order_subtotal' => 0,
            'max_discount_amount' => null,
            'max_uses' => 100,
            'starts_at' => null,
            'ends_at' => null,
            'is_active' => true,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('promo_codes', [
        'code' => 'BWR10',
        'max_uses' => 100,
        'created_by' => $admin->id,
    ]);
});

test('kode promo tidak boleh duplikat', function () {
    $admin = User::factory()->admin()->create();
    PromoCode::factory()->create(['code' => 'BWR10']);

    $this->actingAs($admin)
        ->post('/dashboard/promo-codes', [
            'code' => 'bwr10',
            'description' => null,
            'discount_type' => 'fixed',
            'discount_value' => 5000,
            'min_order_subtotal' => 0,
            'max_discount_amount' => null,
            'max_uses' => null,
            'starts_at' => null,
            'ends_at' => null,
            'is_active' => true,
        ])
        ->assertSessionHasErrors('code');

    expect(PromoCode::query()->count())->toBe(1);
});

test('kode promo yang habis kuota tidak masuk scope aktif', function () {
    PromoCode::factory()->create([
        'used_count' => 5,
        'max_uses' => 5,
    ]);

    expect(PromoCode::query()->active()->count())->toBe(0);
});

test('pelanggan tidak dapat membuat promosi', function () {
    $this->actingAs(User::factory()->create())
        ->post('/dashboard/promotions', [
            'name' => 'X',
            'discount_type' => 'percentage',
            'discount_value' => 1,
            'min_order_subtotal' => 0,
        ])
        ->assertForbidden();
});
