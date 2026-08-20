<?php

namespace App\Enums;

use App\Enums\Concerns\HasState;

enum Permission: string
{
    use HasState;

    case DashboardView = 'dashboard.view';

    case OrdersView = 'orders.view';
    case OrdersConfirm = 'orders.confirm';
    case OrdersAssign = 'orders.assign';
    case OrdersCancel = 'orders.cancel';

    case AddressesManage = 'addresses.manage';

    case DeliveriesView = 'deliveries.view';
    case DeliveriesUpdateStatus = 'deliveries.update-status';

    case PromotionsManage = 'promotions.manage';
    case PromoCodesManage = 'promo-codes.manage';

    case TrucksManage = 'trucks.manage';
    case DriversManage = 'drivers.manage';

    public function label(): string
    {
        return match ($this) {
            self::DashboardView => 'Melihat dashboard',
            self::OrdersView => 'Melihat pesanan',
            self::OrdersConfirm => 'Mengonfirmasi pesanan',
            self::OrdersAssign => 'Menugaskan pengiriman',
            self::OrdersCancel => 'Membatalkan pesanan',
            self::AddressesManage => 'Mengelola alamat',
            self::DeliveriesView => 'Melihat pengiriman',
            self::DeliveriesUpdateStatus => 'Mengubah status pengiriman',
            self::PromotionsManage => 'Mengelola promosi',
            self::PromoCodesManage => 'Mengelola kode promo',
            self::TrucksManage => 'Mengelola armada',
            self::DriversManage => 'Mengelola driver',
        };
    }
}
