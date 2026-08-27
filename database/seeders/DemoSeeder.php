<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\TruckStatus;
use App\Enums\UserRole;
use App\Models\Address;
use App\Models\Driver;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Service;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            ServiceSeeder::class,
            ZoneSeeder::class,
            PromoCodeSeeder::class,
            OperatingHoursSeeder::class,
        ]);

        $services = Service::all()->keyBy('slug');

        // --- Drivers ---
        $drivers = [
            ['email' => 'driver1@biwrawater.test', 'name' => 'Budi Santoso', 'phone' => '081234567801', 'license' => '610110018201'],
            ['email' => 'driver2@biwrawater.test', 'name' => 'Andi Pratama', 'phone' => '081234567802', 'license' => '610110018202'],
            ['email' => 'driver3@biwrawater.test', 'name' => 'Rina Wati', 'phone' => '081234567803', 'license' => '610110018203'],
            ['email' => 'driver4@biwrawater.test', 'name' => 'Dedi Kurniawan', 'phone' => '081234567804', 'license' => '610110018204'],
            ['email' => 'driver5@biwrawater.test', 'name' => 'Siti Rahmawati', 'phone' => '081234567805', 'license' => '610110018205'],
            ['email' => 'driver6@biwrawater.test', 'name' => 'Agus Widodo', 'phone' => '081234567806', 'license' => '610110018206'],
            ['email' => 'driver7@biwrawater.test', 'name' => 'Maya Sari', 'phone' => '081234567807', 'license' => '610110018207'],
            ['email' => 'driver8@biwrawater.test', 'name' => 'Rudi Hartono', 'phone' => '081234567808', 'license' => '610110018208'],
        ];

        $driverModels = [];
        foreach ($drivers as $d) {
            $user = User::updateOrCreate(
                ['email' => $d['email']],
                [
                    'name' => $d['name'],
                    'phone' => $d['phone'],
                    'role' => UserRole::Driver,
                    'password' => Hash::make('password'),
                ],
            );
            $user->assignRole('driver');

            $driverModels[$d['email']] = Driver::updateOrCreate(
                ['user_id' => $user->id],
                ['license_number' => $d['license']],
            );
        }

        // --- Trucks ---
        $truckDefs = [
            ['plate' => 'BK 1001 AA', 'name' => 'Tangki 1', 'capacity' => 5000, 'driver' => 'driver1@biwrawater.test'],
            ['plate' => 'BK 1002 AB', 'name' => 'Tangki 2', 'capacity' => 5000, 'driver' => 'driver2@biwrawater.test'],
            ['plate' => 'BK 1003 AC', 'name' => 'Tangki 3', 'capacity' => 5000, 'driver' => 'driver3@biwrawater.test'],
            ['plate' => 'BK 2001 BA', 'name' => 'Tangki 4', 'capacity' => 8000, 'driver' => 'driver4@biwrawater.test'],
            ['plate' => 'BK 2002 BB', 'name' => 'Tangki 5', 'capacity' => 8000, 'driver' => 'driver5@biwrawater.test'],
            ['plate' => 'BK 2003 BC', 'name' => 'Tangki 6', 'capacity' => 8000, 'driver' => 'driver6@biwrawater.test'],
            ['plate' => 'BK 3001 CA', 'name' => 'Tangki 7', 'capacity' => 11000, 'driver' => 'driver7@biwrawater.test'],
            ['plate' => 'BK 3002 CB', 'name' => 'Tangki 8', 'capacity' => 11000, 'driver' => 'driver8@biwrawater.test'],
        ];

        foreach ($truckDefs as $t) {
            Truck::updateOrCreate(
                ['plate_number' => $t['plate']],
                [
                    'name' => $t['name'],
                    'capacity_liters' => $t['capacity'],
                    'status' => TruckStatus::Available,
                    'default_driver_id' => $driverModels[$t['driver']]->id,
                ],
            );
        }

        // --- Customers ---
        $customers = [
            ['email' => 'andi@example.com', 'name' => 'Andi customer', 'phone' => '082111111111'],
            ['email' => 'budi@example.com', 'name' => 'Budi customer', 'phone' => '082122222222'],
            ['email' => 'citra@example.com', 'name' => 'Citra Dewi', 'phone' => '082133333333'],
            ['email' => 'dian@example.com', 'name' => 'Dian Permata', 'phone' => '082144444444'],
            ['email' => 'eko@example.com', 'name' => 'Eko Saputra', 'phone' => '082155555555'],
            ['email' => 'fani@example.com', 'name' => 'Fani Anggraeni', 'phone' => '082166666666'],
            ['email' => 'gita@example.com', 'name' => 'Gita Puspita', 'phone' => '082177777777'],
            ['email' => 'hadi@example.com', 'name' => 'Hadi Gunawan', 'phone' => '082188888888'],
            ['email' => 'indah@example.com', 'name' => 'Indah Sari', 'phone' => '082199999999'],
            ['email' => 'joko@example.com', 'name' => 'Joko Widodo', 'phone' => '082100000000'],
        ];

        $streets = [
            'Jl. Marelan Raya No. 10',
            'Jl. Setia Budi No. 25',
            'Jl. Gatot Subroto No. 50',
            'Jl. Pemuda No. 15',
            'Jl. Sudirman No. 80',
            'Jl. Thamrin No. 33',
            'Jl. Diponegoro No. 12',
            'Jl. Imam Bonjol No. 45',
            'Jl. Ahmad Yani No. 7',
            'Jl. Kartini No. 20',
        ];

        $kecamatans = [
            'Medan Marelan', 'Medan Area', 'Medan Baru', 'Medan Johor',
            'Medan Kota', 'Medan Labuhan', 'Medan Maimun', 'Medan Perjuangan',
            'Medan Petisah', 'Medan Polonia',
        ];

        $customerUsers = [];
        foreach ($customers as $i => $c) {
            $user = User::updateOrCreate(
                ['email' => $c['email']],
                [
                    'name' => $c['name'],
                    'phone' => $c['phone'],
                    'role' => UserRole::Customer,
                    'password' => Hash::make('password'),
                ],
            );
            $user->assignRole('customer');
            $customerUsers[] = $user;

            Address::create([
                'user_id' => $user->id,
                'label' => 'Rumah',
                'recipient_name' => $c['name'],
                'phone' => $c['phone'],
                'street_address' => $streets[$i],
                'district' => $kecamatans[$i],
                'subdistrict' => $kecamatans[$i],
                'city' => 'Medan',
                'is_default' => true,
            ]);
        }

        // --- Orders (confirmed + paid, ready for assignment) ---
        $orderDefs = [
            ['customer' => 0, 'service' => 'tangki-5000-liter', 'mins_ago' => 120],
            ['customer' => 1, 'service' => 'tangki-8000-liter', 'mins_ago' => 110],
            ['customer' => 2, 'service' => 'tangki-5000-liter', 'mins_ago' => 100],
            ['customer' => 3, 'service' => 'tangki-11000-liter', 'mins_ago' => 90],
            ['customer' => 4, 'service' => 'tangki-8000-liter', 'mins_ago' => 80],
            ['customer' => 5, 'service' => 'tangki-5000-liter', 'mins_ago' => 70],
            ['customer' => 6, 'service' => 'tangki-11000-liter', 'mins_ago' => 60],
            ['customer' => 7, 'service' => 'tangki-8000-liter', 'mins_ago' => 50],
            ['customer' => 8, 'service' => 'tangki-5000-liter', 'mins_ago' => 40],
            ['customer' => 9, 'service' => 'tangki-11000-liter', 'mins_ago' => 30],
        ];

        foreach ($orderDefs as $def) {
            $service = $services[$def['service']];
            $user = $customerUsers[$def['customer']];
            $address = $user->addresses()->first();
            $subtotal = $service->price;

            $snapshot = [
                'recipient_name' => $user->name,
                'phone' => $user->phone,
                'street_address' => '',
                'subdistrict' => '',
                'district' => '',
                'city' => 'Medan',
            ];

            if ($address) {
                $snapshot = [
                    'recipient_name' => $address->recipient_name,
                    'phone' => $address->phone,
                    'street_address' => $address->street_address,
                    'subdistrict' => $address->subdistrict ?? '',
                    'district' => $address->district,
                    'city' => $address->city,
                ];
            }

            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $user->id,
                'address_id' => $address?->id,
                'address_snapshot' => $snapshot,
                'status' => OrderStatus::Confirmed,
                'payment_method' => PaymentMethod::Cod,
                'payment_status' => PaymentStatus::Paid,
                'subtotal' => $subtotal,
                'discount_total' => 0,
                'grand_total' => $subtotal,
                'delivery_fee' => 0,
                'created_at' => now()->subMinutes($def['mins_ago']),
                'updated_at' => now()->subMinutes($def['mins_ago']),
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'service_id' => $service->id,
                'service_name' => $service->name,
                'volume_liters' => $service->volume_liters,
                'unit_price' => $service->price,
                'quantity' => 1,
                'line_total' => $subtotal,
            ]);

            Payment::create([
                'order_id' => $order->id,
                'method' => 'cod',
                'amount' => $subtotal,
                'status' => 'paid',
                'paid_at' => now()->subMinutes($def['mins_ago'] - 5),
            ]);
        }
    }
}
