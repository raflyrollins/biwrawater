<?php

namespace Database\Seeders;

use App\Enums\Permission as PermissionEnum;
use App\Enums\Role as RoleEnum;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Seed roles and permissions, then reset the permission cache.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionEnum::cases() as $permission) {
            Permission::firstOrCreate(['name' => $permission->value]);
        }

        $assignments = [
            RoleEnum::SuperAdmin->value => PermissionEnum::cases(),
            RoleEnum::Admin->value => [
                PermissionEnum::DashboardView,
                PermissionEnum::OrdersView,
                PermissionEnum::OrdersAssign,
                PermissionEnum::OrdersCancel,
                PermissionEnum::DeliveriesUpdateStatus,
                PermissionEnum::PromotionsManage,
                PermissionEnum::PromoCodesManage,
                PermissionEnum::TrucksManage,
                PermissionEnum::DriversManage,
            ],
            RoleEnum::Driver->value => [
                PermissionEnum::DeliveriesView,
                PermissionEnum::DeliveriesUpdateStatus,
            ],
            RoleEnum::Customer->value => [
                PermissionEnum::OrdersView,
                PermissionEnum::OrdersCancel,
            ],
        ];

        foreach ($assignments as $roleName => $permissions) {
            Role::firstOrCreate(['name' => $roleName])
                ->syncPermissions(array_map(
                    fn (PermissionEnum $permission): string => $permission->value,
                    $permissions,
                ));
        }
    }
}
