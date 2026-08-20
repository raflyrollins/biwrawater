<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

foreach (DB::table('failed_jobs')->orderByDesc('id')->limit(3)->get() as $f) {
    $p = json_decode($f->payload, true);
    echo 'FAILED: '.($p['displayName'] ?? '?').PHP_EOL;
    echo 'JOB: '.($p['data']['commandName'] ?? '?').PHP_EOL;
    echo 'EXCEPTION: '.$f->exception.PHP_EOL.PHP_EOL;
}