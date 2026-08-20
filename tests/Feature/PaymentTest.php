<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\Http;

test('admin mengonfirmasi pesanan yang menunggu', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create();

    $this->actingAs($admin)
        ->post(route('dashboard.orders.confirm', $order))
        ->assertRedirect()
        ->assertSessionHas('success');

    $order->refresh();

    expect($order->status)->toBe(OrderStatus::Confirmed)
        ->and($order->payment_due_at)->not->toBeNull()
        ->and($order->payment_due_at->isFuture())->toBeTrue();
});

test('pelanggan tidak dapat mengonfirmasi pesanan', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create();

    $this->actingAs($user)
        ->post(route('dashboard.orders.confirm', $order))
        ->assertForbidden();
});

test('pesanan terkonfirmasi tidak dapat dikonfirmasi ulang', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['status' => OrderStatus::Confirmed]);

    $this->actingAs($admin)
        ->post(route('dashboard.orders.confirm', $order))
        ->assertRedirect()
        ->assertSessionHas('error');
});

test('pelanggan membayar pesanan yang dikonfirmasi via Midtrans', function () {
    Http::fake([
        'app.sandbox.midtrans.com/*' => Http::response(['token' => 'snap-token-123']),
    ]);

    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create([
        'status' => OrderStatus::Confirmed,
        'payment_method' => PaymentMethod::Midtrans,
        'payment_status' => PaymentStatus::Unpaid,
    ]);

    $this->actingAs($user)
        ->post(route('dashboard.orders.pay', $order))
        ->assertRedirect()
        ->assertSessionHas('success')
        ->assertSessionHas('snap');

    expect($order->payments()->count())->toBe(1)
        ->and($order->payments->first()->status)->toBe(PaymentStatus::Unpaid)
        ->and(session('snap')['token'])->toBe('snap-token-123');
});

test('pelanggan tidak dapat membayar pesanan orang lain', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $order = Order::factory()->for($owner)->create([
        'status' => OrderStatus::Confirmed,
    ]);

    $this->actingAs($intruder)
        ->post(route('dashboard.orders.pay', $order))
        ->assertNotFound();
});

test('pesanan yang belum dikonfirmasi tidak dapat dibayar', function () {
    $user = User::factory()->create();
    $order = Order::factory()->for($user)->create();

    $this->actingAs($user)
        ->post(route('dashboard.orders.pay', $order))
        ->assertRedirect()
        ->assertSessionHas('error');
});

test('webhook dengan tanda tangan tidak valid ditolak', function () {
    $this->postJson(route('midtrans.webhook'), [
        'order_id' => 'BWR-X',
        'status_code' => '200',
        'gross_amount' => '10000',
        'signature_key' => 'invalid',
        'transaction_status' => 'capture',
    ])->assertForbidden();
});

test('webhook menandai pembayaran lunas saat capture', function () {
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Unpaid,
    ]);
    $payment = Payment::factory()->for($order)->create([
        'method' => PaymentMethod::Midtrans,
        'status' => PaymentStatus::Unpaid,
        'reference' => $order->order_number,
    ]);

    $signature = hash(
        'sha512',
        $order->order_number.'200'.$order->grand_total.config('midtrans.server_key'),
    );

    $this->postJson(route('midtrans.webhook'), [
        'order_id' => $order->order_number,
        'status_code' => '200',
        'gross_amount' => (string) $order->grand_total,
        'signature_key' => $signature,
        'transaction_status' => 'capture',
        'fraud_status' => 'accept',
        'transaction_id' => 'TRX-123',
    ])->assertOk();

    expect($order->refresh()->payment_status)->toBe(PaymentStatus::Paid)
        ->and($payment->refresh()->status)->toBe(PaymentStatus::Paid)
        ->and($payment->refresh()->reference)->toBe('TRX-123')
        ->and($payment->refresh()->paid_at)->not->toBeNull();
});

test('webhook transaksi pending tidak mengubah status pembayaran', function () {
    $order = Order::factory()->create([
        'status' => OrderStatus::Confirmed,
        'payment_status' => PaymentStatus::Unpaid,
    ]);
    Payment::factory()->for($order)->create([
        'method' => PaymentMethod::Midtrans,
        'status' => PaymentStatus::Unpaid,
    ]);

    $signature = hash(
        'sha512',
        $order->order_number.'201'.$order->grand_total.config('midtrans.server_key'),
    );

    $this->postJson(route('midtrans.webhook'), [
        'order_id' => $order->order_number,
        'status_code' => '201',
        'gross_amount' => (string) $order->grand_total,
        'signature_key' => $signature,
        'transaction_status' => 'pending',
    ])->assertOk();

    expect($order->refresh()->payment_status)->toBe(PaymentStatus::Unpaid);
});
