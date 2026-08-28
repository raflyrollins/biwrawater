<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ZoneController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->name('api.auth.register');
        Route::post('/login', [AuthController::class, 'login'])->name('api.auth.login');
        Route::post('/logout', [AuthController::class, 'logout'])
            ->middleware('auth:sanctum')
            ->name('api.auth.logout');
    });

    Route::get('/services', [CatalogController::class, 'services'])->name('api.services');
    Route::get('/promotions', [CatalogController::class, 'promotions'])->name('api.promotions');
    Route::get('/config', [CatalogController::class, 'config'])->name('api.config');
    Route::get('/zones', [ZoneController::class, 'index'])->name('api.zones');
    Route::post('/zones/lookup', [ZoneController::class, 'lookup'])->name('api.zones.lookup');
    Route::get('/areas/search', [AreaController::class, 'search'])->name('api.areas.search');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me'])->name('api.me');

        Route::get('/addresses', [AddressController::class, 'index'])->name('api.addresses');
        Route::post('/addresses', [AddressController::class, 'store'])->name('api.addresses.store');
        Route::put('/addresses/{address}', [AddressController::class, 'update'])->name('api.addresses.update');
        Route::delete('/addresses/{address}', [AddressController::class, 'destroy'])->name('api.addresses.destroy');

        Route::post('/checkout/validate-promo', [CheckoutController::class, 'validatePromo'])->name('api.checkout.promo');
        Route::post('/checkout', [CheckoutController::class, 'store'])->name('api.checkout.store');

        Route::get('/orders', [OrderController::class, 'index'])->name('api.orders');
        Route::get('/orders/{order}', [OrderController::class, 'show'])->name('api.orders.show');
        Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('api.orders.cancel');
        Route::post('/orders/{order}/pay', [OrderController::class, 'pay'])->name('api.orders.pay');
        Route::get('/orders/{order}/pay-status', [OrderController::class, 'paymentStatus'])->name('api.orders.pay-status');

        Route::get('/driver/deliveries', [DriverController::class, 'deliveries'])->name('api.driver.deliveries');
        Route::post('/driver/status', [DriverController::class, 'updateStatus'])->name('api.driver.status');
        Route::post('/driver/deliveries/{delivery}/fill', [DriverController::class, 'fill'])->name('api.driver.deliveries.fill');
        Route::post('/driver/deliveries/{delivery}/depart', [DriverController::class, 'depart'])->name('api.driver.deliveries.depart');
        Route::post('/driver/deliveries/{delivery}/unload', [DriverController::class, 'unload'])->name('api.driver.deliveries.unload');
        Route::post('/driver/deliveries/{delivery}/deliver', [DriverController::class, 'deliver'])->name('api.driver.deliveries.deliver');
        Route::post('/driver/deliveries/{delivery}/fail', [DriverController::class, 'fail'])->name('api.driver.deliveries.fail');
        Route::post('/driver/deliveries/{delivery}/photos', [DriverController::class, 'photos'])->name('api.driver.deliveries.photos');
    });
});
