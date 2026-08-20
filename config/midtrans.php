<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Midtrans Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi payment gateway Midtrans (Snap). Key sandbox/produksi diambil
    | dari environment. Saat produksi, set MIDTRANS_IS_PRODUCTION=true.
    |
    */

    'merchant_id' => env('ID_MERCHANT'),

    'client_key' => env('CLIENT_KEY'),

    'server_key' => env('SERVER_KEY'),

    'is_production' => (bool) env('MIDTRANS_IS_PRODUCTION', false),

    /*
    | Base URL API Midtrans. Sandbox vs production.
    */
    'api_url' => env('MIDTRANS_IS_PRODUCTION', false)
        ? 'https://api.midtrans.com'
        : 'https://api.sandbox.midtrans.com',

    'snap_url' => env('MIDTRANS_IS_PRODUCTION', false)
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions',

    'snap_script' => env('MIDTRANS_IS_PRODUCTION', false)
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js',

    /*
    | Batas waktu pembayaran setelah konfirmasi admin (menit).
    | Lewat batas = pesanan otomatis dibatalkan (dijalankan scheduler).
    */
    'payment_timeout_minutes' => (int) env('MIDTRANS_PAYMENT_TIMEOUT', 20),

];
