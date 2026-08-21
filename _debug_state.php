<?php

use App\Models\Delivery;
use App\Models\Driver;
use App\Models\Order;
use App\Models\User;

echo 'users='.User::count().' drivers='.Driver::count()
    .' orders='.Order::count().' deliveries='.Delivery::count().PHP_EOL;

User::all(['id', 'name', 'email'])->each(function (User $u): void {
    echo 'user#'.$u->id.' '.$u->email.' driver_id='.($u->driver?->id ?? '-').PHP_EOL;
});

Order::with('delivery')->get()->each(function (Order $o): void {
    echo 'order '.$o->uuid.' status='.$o->status->value
        .' pay='.($o->payment_status?->value ?? '-')
        .' delivery='.($o->delivery?->uuid ?? '-')
        .' dstatus='.($o->delivery?->status->value ?? '-')
        .' ddriver='.($o->delivery?->driver_id ?? '-').PHP_EOL;
});
