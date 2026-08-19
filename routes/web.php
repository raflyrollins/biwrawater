<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\AuthPageController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PromoCodeController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\TruckController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::get('/login', [AuthPageController::class, 'login'])->name('login');
Route::get('/register', [AuthPageController::class, 'register'])->name('register');
Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('auth.logout');

Route::middleware(['auth', 'permission:orders.view|deliveries.view|dashboard.view'])
    ->prefix('dashboard')
    ->name('dashboard.')
    ->group(function (): void {
        Route::get('/', [DashboardController::class, 'index'])->name('index');

        Route::get('/orders', [OrderController::class, 'index'])
            ->middleware(['permission:orders.view', 'permission:dashboard.view'])
            ->name('orders.index');
        Route::get('/orders/{order}', [OrderController::class, 'show'])->middleware('permission:orders.view')->name('orders.show');
        Route::post('/orders/{order}/assign', [OrderController::class, 'assign'])->middleware('permission:orders.assign')->name('orders.assign');
        Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])->middleware('permission:orders.cancel')->name('orders.cancel');
        Route::post('/orders/{order}/delivery/{delivery}/depart', [OrderController::class, 'depart'])->middleware('permission:deliveries.update-status')->name('orders.delivery.depart');
        Route::post('/orders/{order}/delivery/{delivery}/deliver', [OrderController::class, 'deliver'])->middleware('permission:deliveries.update-status')->name('orders.delivery.deliver');
        Route::post('/orders/{order}/delivery/{delivery}/fail', [OrderController::class, 'fail'])->middleware('permission:deliveries.update-status')->name('orders.delivery.fail');

        Route::get('/deliveries', [DeliveryController::class, 'index'])->middleware('permission:deliveries.view')->name('deliveries.index');
        Route::post('/deliveries/{delivery}/depart', [DeliveryController::class, 'depart'])->middleware('permission:deliveries.update-status')->name('deliveries.depart');
        Route::post('/deliveries/{delivery}/deliver', [DeliveryController::class, 'deliver'])->middleware('permission:deliveries.update-status')->name('deliveries.deliver');
        Route::post('/deliveries/{delivery}/fail', [DeliveryController::class, 'fail'])->middleware('permission:deliveries.update-status')->name('deliveries.fail');

        Route::middleware('permission:promotions.manage')->group(function (): void {
            Route::get('/promotions', [PromotionController::class, 'index'])->name('promotions.index');
            Route::post('/promotions', [PromotionController::class, 'store'])->name('promotions.store');
            Route::post('/promotions/{promotion}', [PromotionController::class, 'update'])->name('promotions.update');
            Route::post('/promotions/{promotion}/toggle', [PromotionController::class, 'toggle'])->name('promotions.toggle');
            Route::delete('/promotions/{promotion}', [PromotionController::class, 'destroy'])->name('promotions.destroy');
        });

        Route::middleware('permission:promo-codes.manage')->group(function (): void {
            Route::get('/promo-codes', [PromoCodeController::class, 'index'])->name('promo-codes.index');
            Route::post('/promo-codes', [PromoCodeController::class, 'store'])->name('promo-codes.store');
            Route::post('/promo-codes/{promoCode}', [PromoCodeController::class, 'update'])->name('promo-codes.update');
            Route::post('/promo-codes/{promoCode}/toggle', [PromoCodeController::class, 'toggle'])->name('promo-codes.toggle');
            Route::delete('/promo-codes/{promoCode}', [PromoCodeController::class, 'destroy'])->name('promo-codes.destroy');
        });

        Route::middleware('permission:trucks.manage')->group(function (): void {
            Route::get('/trucks', [TruckController::class, 'index'])->name('trucks.index');
            Route::post('/trucks', [TruckController::class, 'store'])->name('trucks.store');
            Route::post('/trucks/{truck}', [TruckController::class, 'update'])->name('trucks.update');
            Route::post('/trucks/{truck}/toggle', [TruckController::class, 'toggle'])->name('trucks.toggle');
            Route::delete('/trucks/{truck}', [TruckController::class, 'destroy'])->name('trucks.destroy');
        });

        Route::middleware('permission:drivers.manage')->group(function (): void {
            Route::get('/drivers', [DriverController::class, 'index'])->name('drivers.index');
            Route::post('/drivers', [DriverController::class, 'store'])->name('drivers.store');
            Route::post('/drivers/{driver}', [DriverController::class, 'update'])->name('drivers.update');
            Route::post('/drivers/{driver}/toggle', [DriverController::class, 'toggle'])->name('drivers.toggle');
            Route::delete('/drivers/{driver}', [DriverController::class, 'destroy'])->name('drivers.destroy');
        });
    });
