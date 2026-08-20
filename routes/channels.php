<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('dashboard', function ($user) {
    return $user->hasAnyPermission([
        'orders.view',
        'deliveries.view',
        'dashboard.view',
        'orders.assign',
        'orders.confirm',
        'deliveries.update-status',
    ]);
});
